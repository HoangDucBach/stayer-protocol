use odra::prelude::*;
use odra::casper_types::{PublicKey, U256, U512};

#[odra::external_contract]
pub trait ValidatorRegistryContract {
    fn get_validator(&self, pubkey: PublicKey) -> Option<ValidatorData>;
    fn get_network_p_avg(&self) -> u64;
    fn get_last_update_era(&self) -> u64;
    fn is_valid(&self, pubkey: PublicKey, current_era: u64) -> bool;
}

#[odra::external_contract]
pub trait YSCSPRContract {
    fn mint(&mut self, to: Address, amount: U256);
    fn burn(&mut self, from: Address, amount: U256);
    fn total_supply(&self) -> U256;
}


#[odra::odra_type]
pub struct ValidatorData {
    pub fee: u64,
    pub is_active: bool,
    pub decay_factor: u64,
    pub p_score: u64,
    pub updated_era: u64,
}

#[odra::odra_type]
pub struct WithdrawalRequest {
    pub user: Address,
    pub amount: U512,
    pub unlock_era: u64,
    pub status: WithdrawalStatus,
}

#[odra::odra_type]
pub enum WithdrawalStatus {
    Pending,
    Claimed,
}

#[odra::odra_type]
pub struct LiquidStakingStats {
    pub total_staked: U512,
    pub total_pending_withdrawal: U512,
    pub cumulative_rewards: U512,
    pub exchange_rate: U256,
}

#[odra::odra_type]
pub struct PendingDelegation {
    pub validator: PublicKey,
    pub amount: U512,
    pub era: u64,
}

#[odra::odra_type]
pub struct PendingUndelegation {
    pub validator: PublicKey,
    pub amount: U512,
    pub era: u64,
}

const MIN_STAKE: u128 = 100_000_000_000;
const UNBONDING_DELAY: u64 = 7;
const PROTOCOL_FEE_BPS: u64 = 500;
const MIN_MULTIPLIER: u64 = 5000;
const MAX_MULTIPLIER: u64 = 15000;
const MAX_SINGLE_STAKE: u128 = 100_000_000_000_000;
const MOTES_PER_CSPR: u128 = 1_000_000_000;
const BASIS_POINTS: u64 = 10000;

#[odra::module(events = [Staked, UnstakeRequested, Claimed, RewardsHarvested, DelegationProcessed, UndelegationProcessed])]
pub struct LiquidStaking {
    validator_registry: External<ValidatorRegistryContractContractRef>,
    yscspr_token: External<YSCSPRContractContractRef>,
    owner: Var<Address>,
    keeper: Var<Address>,

    user_stakes: Mapping<(Address, PublicKey), U512>,
    validator_total_stake: Mapping<PublicKey, U512>,
    total_staked: Var<U512>,
    total_pending_withdrawal: Var<U512>,

    withdrawal_requests: Mapping<u64, WithdrawalRequest>,
    user_pending_withdrawals: Mapping<Address, Vec<u64>>,
    next_request_id: Var<u64>,

    last_harvest_era: Var<u64>,

    // Pending delegations/undelegations for keeper to process
    pending_delegations: Var<Vec<PendingDelegation>>,
    pending_undelegations: Var<Vec<PendingUndelegation>>,
    total_delegated: Var<U512>,  // Actually delegated to validators
}

#[odra::module]
impl LiquidStaking {
    #[odra(init)]
    pub fn init(
        &mut self,
        validator_registry: Address,
        yscspr_token: Address,
        keeper: Address,
    ) {
        let caller = self.env().caller();
        self.owner.set(caller);
        self.validator_registry.set(validator_registry);
        self.yscspr_token.set(yscspr_token);
        self.keeper.set(keeper);

        self.total_staked.set(U512::zero());
        self.total_pending_withdrawal.set(U512::zero());
        self.next_request_id.set(1);
        self.last_harvest_era.set(0);
        self.pending_delegations.set(Vec::new());
        self.pending_undelegations.set(Vec::new());
        self.total_delegated.set(U512::zero());
    }

    #[odra(payable)]
    pub fn stake(&mut self, validator_pubkey: PublicKey, current_era: u64) {
        let caller = self.env().caller();
        let amount = self.env().attached_value();

        if amount.as_u128() < MIN_STAKE {
            self.env().revert(Error::StakeTooLow);
        }

        if amount.as_u128() > MAX_SINGLE_STAKE {
            self.env().revert(Error::StakeTooHigh);
        }

        if !self.validator_registry.is_valid(validator_pubkey.clone(), current_era) {
            self.env().revert(Error::InvalidValidator);
        }

        let validator_data = self.validator_registry.get_validator(validator_pubkey.clone())
            .unwrap_or_revert_with(&self.env(), Error::ValidatorNotFound);

        if validator_data.p_score == 0 {
            self.env().revert(Error::ValidatorInactive);
        }

        let p_avg = self.validator_registry.get_network_p_avg();
        let multiplier = self.calculate_multiplier(validator_data.p_score, p_avg);

        let amount_u256 = U256::from(amount.as_u128());
        let mint_amount = amount_u256
            .checked_mul(U256::from(multiplier))
            .unwrap_or_default()
            .checked_div(U256::from(BASIS_POINTS))
            .unwrap_or_default();

        let key = (caller, validator_pubkey.clone());
        let current_stake = self.user_stakes.get(&key).unwrap_or(U512::zero());
        self.user_stakes.set(&key, current_stake.checked_add(amount).unwrap_or_default());

        let validator_stake = self.validator_total_stake.get(&validator_pubkey).unwrap_or(U512::zero());
        self.validator_total_stake.set(&validator_pubkey, validator_stake.checked_add(amount).unwrap_or_default());

        let total = self.total_staked.get_or_default();
        self.total_staked.set(total.checked_add(amount).unwrap_or_default());

        // Add to pending delegations for keeper to process
        let mut pending = self.pending_delegations.get_or_default();
        // Check if there's already a pending delegation for this validator
        let mut found = false;
        for p in pending.iter_mut() {
            if p.validator == validator_pubkey {
                p.amount = p.amount.checked_add(amount).unwrap_or_default();
                found = true;
                break;
            }
        }
        if !found {
            pending.push(PendingDelegation {
                validator: validator_pubkey.clone(),
                amount,
                era: current_era,
            });
        }
        self.pending_delegations.set(pending);

        self.mint_yscspr(caller, mint_amount);

        self.env().emit_event(Staked {
            user: caller,
            validator: validator_pubkey,
            cspr_amount: amount,
            yscspr_minted: mint_amount,
            multiplier,
            era: current_era,
        });
    }

    pub fn unstake(&mut self, validator_pubkey: PublicKey, yscspr_amount: U256, current_era: u64) {
        let caller = self.env().caller();

        if yscspr_amount.is_zero() {
            self.env().revert(Error::InvalidAmount);
        }

        let exchange_rate = self.get_exchange_rate();
        let precision = U256::from(MOTES_PER_CSPR);

        let cspr_to_return_u256 = yscspr_amount
            .checked_mul(exchange_rate)
            .unwrap_or_default()
            .checked_div(precision)
            .unwrap_or_default();

        let cspr_to_return = U512::from(cspr_to_return_u256.as_u128());

        let key = (caller, validator_pubkey.clone());
        let user_validator_stake = self.user_stakes.get(&key).unwrap_or(U512::zero());
        if cspr_to_return > user_validator_stake {
            self.env().revert(Error::InsufficientStake);
        }

        let total_pool = self.total_staked.get_or_default();
        let max_withdrawal = total_pool / 10u64;
        if cspr_to_return > max_withdrawal {
            self.env().revert(Error::ExceedsMaxWithdrawal);
        }

        self.burn_yscspr(caller, yscspr_amount);

        self.user_stakes.set(&key, user_validator_stake.checked_sub(cspr_to_return).unwrap_or_default());

        let validator_stake = self.validator_total_stake.get(&validator_pubkey).unwrap_or(U512::zero());
        self.validator_total_stake.set(&validator_pubkey, validator_stake.checked_sub(cspr_to_return).unwrap_or_default());

        let request_id = self.next_request_id.get_or_default();
        self.next_request_id.set(request_id + 1);

        let unlock_era = current_era + UNBONDING_DELAY;
        let request = WithdrawalRequest {
            user: caller,
            amount: cspr_to_return,
            unlock_era,
            status: WithdrawalStatus::Pending,
        };

        self.withdrawal_requests.set(&request_id, request);

        let mut user_requests = self.user_pending_withdrawals.get(&caller).unwrap_or_default();
        user_requests.push(request_id);
        self.user_pending_withdrawals.set(&caller, user_requests);

        let total_staked = self.total_staked.get_or_default();
        self.total_staked.set(total_staked.checked_sub(cspr_to_return).unwrap_or_default());

        let total_pending = self.total_pending_withdrawal.get_or_default();
        self.total_pending_withdrawal.set(total_pending.checked_add(cspr_to_return).unwrap_or_default());

        // Add to pending undelegations for keeper to process
        let mut pending = self.pending_undelegations.get_or_default();
        let mut found = false;
        for p in pending.iter_mut() {
            if p.validator == validator_pubkey {
                p.amount = p.amount.checked_add(cspr_to_return).unwrap_or_default();
                found = true;
                break;
            }
        }
        if !found {
            pending.push(PendingUndelegation {
                validator: validator_pubkey.clone(),
                amount: cspr_to_return,
                era: current_era,
            });
        }
        self.pending_undelegations.set(pending);

        self.env().emit_event(UnstakeRequested {
            user: caller,
            request_id,
            yscspr_burned: yscspr_amount,
            cspr_amount: cspr_to_return,
            unlock_era,
        });
    }

    pub fn claim(&mut self, current_era: u64) {
        let caller = self.env().caller();

        let user_requests = self.user_pending_withdrawals.get(&caller)
            .unwrap_or_revert_with(&self.env(), Error::NoPendingWithdrawals);

        let mut total_claimable = U512::zero();
        let mut claimed_requests = Vec::new();

        for request_id in user_requests.iter() {
            let mut request = self.withdrawal_requests.get(request_id)
                .unwrap_or_revert_with(&self.env(), Error::RequestNotFound);

            if request.unlock_era <= current_era && request.status == WithdrawalStatus::Pending {
                total_claimable = total_claimable.checked_add(request.amount).unwrap_or_default();
                request.status = WithdrawalStatus::Claimed;
                self.withdrawal_requests.set(request_id, request);
                claimed_requests.push(*request_id);
            }
        }

        if total_claimable.is_zero() {
            self.env().revert(Error::NoMaturedWithdrawals);
        }

        let remaining_requests: Vec<u64> = user_requests
            .iter()
            .filter(|id| !claimed_requests.contains(id))
            .cloned()
            .collect();
        self.user_pending_withdrawals.set(&caller, remaining_requests);

        let total_pending = self.total_pending_withdrawal.get_or_default();
        self.total_pending_withdrawal.set(total_pending.checked_sub(total_claimable).unwrap_or_default());

        self.env().transfer_tokens(&caller, &total_claimable);

        self.env().emit_event(Claimed {
            user: caller,
            amount: total_claimable,
            request_ids: claimed_requests,
        });
    }

    pub fn harvest_rewards(&mut self, new_total_delegation: U512, current_era: u64) {
        self.require_keeper();

        let last_era = self.last_harvest_era.get_or_default();
        if current_era <= last_era {
            self.env().revert(Error::InvalidEra);
        }

        let total_staked = self.total_staked.get_or_default();
        let total_pending = self.total_pending_withdrawal.get_or_default();

        let expected_total = total_staked.checked_add(total_pending).unwrap_or_default();

        if new_total_delegation <= expected_total {
            self.last_harvest_era.set(current_era);
            return;
        }

        let rewards_earned = new_total_delegation.checked_sub(expected_total).unwrap_or_default();

        let protocol_fee = U512::from(
            rewards_earned.as_u128()
                .saturating_mul(PROTOCOL_FEE_BPS as u128)
                / BASIS_POINTS as u128
        );

        // Add rewards to total staked (increases exchange rate)
        self.total_staked.set(total_staked.checked_add(rewards_earned.checked_sub(protocol_fee).unwrap_or_default()).unwrap_or_default());

        self.last_harvest_era.set(current_era);

        let exchange_rate = self.get_exchange_rate();

        self.env().emit_event(RewardsHarvested {
            era: current_era,
            rewards: rewards_earned,
            protocol_fee,
            new_exchange_rate: exchange_rate,
        });
    }

    pub fn get_exchange_rate(&self) -> U256 {
        let total_supply = self.yscspr_token.total_supply();

        if total_supply.is_zero() {
            return U256::from(MOTES_PER_CSPR);
        }

        let total_staked = self.total_staked.get_or_default();
        let total_cspr_pool = U256::from(total_staked.as_u128());

        let precision = U256::from(MOTES_PER_CSPR);

        total_cspr_pool
            .checked_mul(precision)
            .unwrap_or_default()
            .checked_div(total_supply)
            .unwrap_or(precision)
    }

    // ============== Keeper Delegation Functions ==============

    /// Get pending delegations for keeper to process
    pub fn get_pending_delegations(&self) -> Vec<PendingDelegation> {
        self.pending_delegations.get_or_default()
    }

    /// Get pending undelegations for keeper to process
    pub fn get_pending_undelegations(&self) -> Vec<PendingUndelegation> {
        self.pending_undelegations.get_or_default()
    }

    /// Keeper withdraws CSPR to delegate to validators
    /// Returns the amount withdrawn
    pub fn withdraw_for_delegation(&mut self, validator: PublicKey, amount: U512) -> U512 {
        self.require_keeper();

        let pending = self.pending_delegations.get_or_default();
        let mut found_amount = U512::zero();

        for p in pending.iter() {
            if p.validator == validator {
                found_amount = p.amount;
                break;
            }
        }

        if found_amount.is_zero() || amount > found_amount {
            self.env().revert(Error::InvalidAmount);
        }

        // Transfer CSPR to keeper
        let caller = self.env().caller();
        self.env().transfer_tokens(&caller, &amount);

        amount
    }

    /// Keeper confirms successful delegation
    pub fn confirm_delegation(&mut self, validator: PublicKey, amount: U512) {
        self.require_keeper();

        let mut pending = self.pending_delegations.get_or_default();
        let mut new_pending = Vec::new();
        let mut confirmed = false;

        for mut p in pending {
            if p.validator == validator && !confirmed {
                if amount >= p.amount {
                    // Fully delegated, remove from pending
                    confirmed = true;
                    continue;
                } else {
                    // Partially delegated
                    p.amount = p.amount.checked_sub(amount).unwrap_or_default();
                    confirmed = true;
                }
            }
            new_pending.push(p);
        }

        if !confirmed {
            self.env().revert(Error::InvalidValidator);
        }

        self.pending_delegations.set(new_pending);

        // Update total delegated
        let total = self.total_delegated.get_or_default();
        self.total_delegated.set(total.checked_add(amount).unwrap_or_default());

        self.env().emit_event(DelegationProcessed {
            validator,
            amount,
            total_delegated: self.total_delegated.get_or_default(),
        });
    }

    /// Keeper confirms successful undelegation
    pub fn confirm_undelegation(&mut self, validator: PublicKey, amount: U512) {
        self.require_keeper();

        let mut pending = self.pending_undelegations.get_or_default();
        let mut new_pending = Vec::new();
        let mut confirmed = false;

        for mut p in pending {
            if p.validator == validator && !confirmed {
                if amount >= p.amount {
                    confirmed = true;
                    continue;
                } else {
                    p.amount = p.amount.checked_sub(amount).unwrap_or_default();
                    confirmed = true;
                }
            }
            new_pending.push(p);
        }

        if !confirmed {
            self.env().revert(Error::InvalidValidator);
        }

        self.pending_undelegations.set(new_pending);

        // Update total delegated
        let total = self.total_delegated.get_or_default();
        self.total_delegated.set(total.checked_sub(amount).unwrap_or_default());

        self.env().emit_event(UndelegationProcessed {
            validator,
            amount,
            total_delegated: self.total_delegated.get_or_default(),
        });
    }

    /// Keeper deposits CSPR back after undelegation completes
    #[odra(payable)]
    pub fn deposit_from_undelegation(&mut self) {
        self.require_keeper();
        // CSPR is automatically added to contract balance via payable
        // No additional tracking needed as it's already in total_pending_withdrawal
    }

    // ============== Admin Functions ==============

    pub fn set_keeper(&mut self, new_keeper: Address) {
        self.require_owner();
        self.keeper.set(new_keeper);
    }

    fn calculate_multiplier(&self, p_score: u64, p_avg: u64) -> u64 {
        if p_avg == 0 {
            return BASIS_POINTS;
        }

        let multiplier = p_score
            .saturating_mul(BASIS_POINTS)
            / p_avg;

        if multiplier < MIN_MULTIPLIER {
            MIN_MULTIPLIER
        } else if multiplier > MAX_MULTIPLIER {
            MAX_MULTIPLIER
        } else {
            multiplier
        }
    }

    fn mint_yscspr(&mut self, to: Address, amount: U256) {
        self.yscspr_token.mint(to, amount);
    }

    fn burn_yscspr(&mut self, from: Address, amount: U256) {
        self.yscspr_token.burn(from, amount);
    }

    fn require_keeper(&self) {
        let caller = self.env().caller();
        let keeper = self.keeper.get_or_revert_with(Error::NotInitialized);
        let owner = self.owner.get_or_revert_with(Error::NotInitialized);

        if caller != keeper && caller != owner {
            self.env().revert(Error::Unauthorized);
        }
    }

    fn require_owner(&self) {
        let caller = self.env().caller();
        let owner = self.owner.get_or_revert_with(Error::NotInitialized);

        if caller != owner {
            self.env().revert(Error::Unauthorized);
        }
    }
}

#[odra::event]
pub struct Staked {
    pub user: Address,
    pub validator: PublicKey,
    pub cspr_amount: U512,
    pub yscspr_minted: U256,
    pub multiplier: u64,
    pub era: u64,
}

#[odra::event]
pub struct UnstakeRequested {
    pub user: Address,
    pub request_id: u64,
    pub yscspr_burned: U256,
    pub cspr_amount: U512,
    pub unlock_era: u64,
}

#[odra::event]
pub struct Claimed {
    pub user: Address,
    pub amount: U512,
    pub request_ids: Vec<u64>,
}

#[odra::event]
pub struct RewardsHarvested {
    pub era: u64,
    pub rewards: U512,
    pub protocol_fee: U512,
    pub new_exchange_rate: U256,
}

#[odra::event]
pub struct DelegationProcessed {
    pub validator: PublicKey,
    pub amount: U512,
    pub total_delegated: U512,
}

#[odra::event]
pub struct UndelegationProcessed {
    pub validator: PublicKey,
    pub amount: U512,
    pub total_delegated: U512,
}

#[odra::odra_error]
pub enum Error {
    Unauthorized = 1,
    NotInitialized = 2,
    InvalidValidator = 3,
    ValidatorNotFound = 4,
    ValidatorInactive = 5,
    StakeTooLow = 6,
    StakeTooHigh = 7,
    InvalidAmount = 8,
    ExceedsMaxWithdrawal = 9,
    NoPendingWithdrawals = 10,
    NoMaturedWithdrawals = 11,
    RequestNotFound = 12,
    InvalidEra = 13,
    InsufficientStake = 14,
}

#[cfg(test)]
mod tests {
    use super::*;
    use odra::host::{Deployer, HostEnv};

    fn setup() -> (HostEnv, LiquidStakingHostRef, Address, Address, Address) {
        let env = odra_test::env();
        let owner = env.get_account(0);
        let registry_addr = env.get_account(1);
        let yscspr_addr = env.get_account(2);
        let keeper = env.get_account(3);

        env.set_caller(owner);

        let liquid_staking = LiquidStaking::deploy(&env, LiquidStakingInitArgs {
            validator_registry: registry_addr,
            yscspr_token: yscspr_addr,
            keeper,
        });

        (env, liquid_staking, owner, keeper, registry_addr)
    }

    #[test]
    fn test_initialization() {
        let (_env, liquid_staking, _owner, _keeper, _registry) = setup();

        assert_eq!(liquid_staking.get_total_staked(), U512::zero());
    }

    #[test]
    fn test_basic_state() {
        let (_env, liquid_staking, _owner, _keeper, _registry) = setup();

        assert_eq!(liquid_staking.get_total_staked(), U512::zero());
    }
}
