use odra::prelude::*;
use odra::casper_types::{U256, U512};
use odra::ContractRef;

// --- External Contract Interfaces ---

#[odra::external_contract]
pub trait PriceOracleContract {
    fn get_price(&self) -> U256;
}

#[odra::external_contract]
pub trait CUSDContract {
    fn mint(&mut self, to: Address, amount: U256);
    fn burn(&mut self, from: Address, amount: U256);
}

#[odra::external_contract]
pub trait YSCSPRContract {
    fn transfer(&mut self, recipient: Address, amount: U256);
    fn transfer_from(&mut self, owner: Address, recipient: Address, amount: U256);
}

#[odra::external_contract]
pub trait LiquidStakingContract {
    fn get_exchange_rate(&self) -> U256;
}

// --- Data Structures ---

#[odra::odra_type]
pub struct Position {
    pub owner: Address,
    pub collateral: U256, // ySCSPR amount
    pub debt: U256,       // cUSD amount
    pub entry_price: U256,
    pub opened_at: u64,
}

#[odra::odra_type]
pub struct VaultParams {
    pub ltv: u64,
    pub liq_threshold: u64,
    pub liq_penalty: u64,
    pub stability_fee: u64,
    pub min_collateral: U256,
}

const DEFAULT_LTV: u64 = 5000;
const DEFAULT_LIQ_THRESHOLD: u64 = 11000;
const DEFAULT_LIQ_PENALTY: u64 = 1000;
const DEFAULT_STABILITY_FEE: u64 = 200;
const DEFAULT_MIN_COLLATERAL: u128 = 100_000_000_000;

impl Default for VaultParams {
    fn default() -> Self {
        Self {
            ltv: DEFAULT_LTV,
            liq_threshold: DEFAULT_LIQ_THRESHOLD,
            liq_penalty: DEFAULT_LIQ_PENALTY,
            stability_fee: DEFAULT_STABILITY_FEE,
            min_collateral: U256::from(DEFAULT_MIN_COLLATERAL),
        }
    }
}

#[odra::module(events = [Deposit, Withdraw, Borrow, Repay, Liquidate])]
pub struct StayerVault {
    total_collateral: Var<U256>, // Total ySCSPR locked
    total_debt: Var<U256>,       // Total cUSD debt
    positions: Mapping<Address, Position>,
    params: Var<VaultParams>,
    oracle: Var<Address>,
    cusd_token: Var<Address>,
    yscspr_token: Var<Address>,
    liquid_staking: Var<Address>,
    owner: Var<Address>,
    paused: Var<bool>,
}

#[odra::module]
impl StayerVault {

    #[odra(init)]
    pub fn init(
        &mut self,
        oracle: Address,
        cusd_token: Address,
        yscspr_token: Address,
        liquid_staking: Address,
    ) {
        self.owner.set(self.env().caller());
        self.oracle.set(oracle);
        self.cusd_token.set(cusd_token);
        self.yscspr_token.set(yscspr_token);
        self.liquid_staking.set(liquid_staking);
        self.params.set(VaultParams::default());
        self.paused.set(false);
        self.total_collateral.set(U256::zero());
        self.total_debt.set(U256::zero());
    }

    // --- Core Functions ---

    /// Deposit ySCSPR as collateral
    /// User must approve Vault to spend ySCSPR first!
    /// No longer payable (doesn't accept CSPR)
    pub fn deposit(&mut self, amount: U256) {
        self.require_not_paused();
        
        if amount.is_zero() {
            self.env().revert(Error::InvalidAmount);
        }

        let caller = self.env().caller();
        let params = self.params.get_or_revert_with(Error::Paused);
        
        // Transfer ySCSPR from user to Vault
        self.transfer_yscspr_from(caller, self.env().self_address(), amount);

        let price = self.get_price();

        // Update Position
        let mut position = self.positions.get(&caller).unwrap_or(Position {
            owner: caller,
            collateral: U256::zero(),
            debt: U256::zero(),
            entry_price: price,
            opened_at: self.env().get_block_time(),
        });

        position.collateral = position.collateral
            .checked_add(amount)
            .unwrap_or_revert_with(&self.env(), Error::Overflow);
            
        // Check min collateral
        if position.collateral < params.min_collateral {
            self.env().revert(Error::CollateralTooLow);
        }

        // Weighted avg price update
        if position.collateral > amount {
             position.entry_price = self.calculate_weighted_price(
                position.entry_price,
                position.collateral.checked_sub(amount).unwrap_or_default(),
                price,
                amount,
            );
        } else {
            position.entry_price = price;
        }

        self.positions.set(&caller, position);

        // Update global
        self.total_collateral.set(
            self.total_collateral.get_or_default()
                .checked_add(amount)
                .unwrap_or_revert_with(&self.env(), Error::Overflow)
        );

        self.env().emit_event(Deposit {
            user: caller,
            collateral: amount,
            debt_minted: U256::zero(), // Deprecated field but kept for event schema compatibility
            price,
        });
    }

    /// Borrow cUSD against ySCSPR collateral
    pub fn borrow(&mut self, cusd_amount: U256) {
        self.require_not_paused();

        let caller = self.env().caller();
        let position = self.positions.get(&caller)
            .unwrap_or_revert_with(&self.env(), Error::PositionNotFound);

        if position.collateral.is_zero() {
            self.env().revert(Error::InsufficientCollateral);
        }

        let price = self.get_price();
        let params = self.params.get_or_revert_with(Error::Paused);

        // Calculate max debt based on ySCSPR value
        let max_debt = self.calculate_max_debt(position.collateral, price, params.ltv);
        
        let new_total_debt = position.debt
            .checked_add(cusd_amount)
            .unwrap_or_revert_with(&self.env(), Error::Overflow);

        if new_total_debt > max_debt {
            self.env().revert(Error::ExceedsMaxDebt);
        }

        // Update position
        let mut updated_position = position.clone();
        updated_position.debt = new_total_debt;
        self.positions.set(&caller, updated_position);

        // Update global
        self.total_debt.set(
            self.total_debt.get_or_default()
                .checked_add(cusd_amount)
                .unwrap_or_revert_with(&self.env(), Error::Overflow)
        );

        // Mint cUSD to user
        self.mint_cusd(caller, cusd_amount);

        self.env().emit_event(Borrow {
            user: caller,
            amount: cusd_amount,
        });
    }

    /// Repay cUSD debt
    pub fn repay(&mut self, cusd_amount: U256) {
        self.require_not_paused();

        let caller = self.env().caller();
        let position = self.positions.get(&caller)
            .unwrap_or_revert_with(&self.env(), Error::PositionNotFound);

        if cusd_amount > position.debt {
            self.env().revert(Error::ExceedsDebt);
        }

        // Burn cUSD from user
        self.burn_cusd(caller, cusd_amount);

        // Update position
        let mut updated_position = position.clone();
        updated_position.debt = updated_position.debt
            .checked_sub(cusd_amount)
            .unwrap_or_revert_with(&self.env(), Error::Underflow);
            
        self.positions.set(&caller, updated_position);

        // Update global
        self.total_debt.set(
            self.total_debt.get_or_default()
                .checked_sub(cusd_amount)
                .unwrap_or_revert_with(&self.env(), Error::Underflow)
        );

        self.env().emit_event(Repay {
            user: caller,
            amount: cusd_amount,
        });
    }

    /// Withdraw ySCSPR collateral
    pub fn withdraw(&mut self, yscspr_amount: U256) {
        self.require_not_paused();

        let caller = self.env().caller();
        let position = self.positions.get(&caller)
            .unwrap_or_revert_with(&self.env(), Error::PositionNotFound);

        if yscspr_amount > position.collateral {
            self.env().revert(Error::InsufficientCollateral);
        }

        // Check health factor
        if !position.debt.is_zero() {
            let new_collateral = position.collateral
                .checked_sub(yscspr_amount)
                .unwrap_or_revert_with(&self.env(), Error::Underflow);

            let price = self.get_price();
            let params = self.params.get_or_revert_with(Error::Paused);

            let mut temp_position = position.clone();
            temp_position.collateral = new_collateral;

            let health_factor = self.calculate_health_factor(&temp_position, price, params.liq_threshold);
            if health_factor < 10000 {
                self.env().revert(Error::UnhealthyPosition);
            }
        }

        // Update position
        let new_collateral = position.collateral
            .checked_sub(yscspr_amount)
            .unwrap_or_revert_with(&self.env(), Error::Underflow);

        let mut updated_position = position.clone();
        updated_position.collateral = new_collateral;
        self.positions.set(&caller, updated_position);

        // Update global
        self.total_collateral.set(
            self.total_collateral.get_or_default()
                .checked_sub(yscspr_amount)
                .unwrap_or_revert_with(&self.env(), Error::Underflow)
        );

        // Transfer ySCSPR back to user
        self.transfer_yscspr(caller, yscspr_amount);

        self.env().emit_event(Withdraw {
            user: caller,
            collateral_returned: yscspr_amount,
            debt_burned: U256::zero(),
        });
    }

    /// Liquidate position
    pub fn liquidate(&mut self, user: Address, debt_to_cover: U256) {
        self.require_not_paused();

        let position = self.positions.get(&user)
            .unwrap_or_revert_with(&self.env(), Error::PositionNotFound);

        let price = self.get_price();
        let params = self.params.get_or_revert_with(Error::Paused);

        let health_factor = self.calculate_health_factor(&position, price, params.liq_threshold);
        if health_factor >= 10000 {
            self.env().revert(Error::PositionHealthy);
        }

        if debt_to_cover > position.debt {
            self.env().revert(Error::ExceedsDebt);
        }

        // Calculate ySCSPR to seize
        let collateral_to_seize = self.calculate_liquidation_amount(
            debt_to_cover,
            price,
            params.liq_penalty,
        );

        if collateral_to_seize > position.collateral {
            self.env().revert(Error::InsufficientCollateral);
        }

        let liquidator = self.env().caller();

        // Burn liquidator's cUSD
        self.burn_cusd(liquidator, debt_to_cover);

        // Update position
        let new_collateral = position.collateral
            .checked_sub(collateral_to_seize)
            .unwrap_or_revert_with(&self.env(), Error::Underflow);
            
        let new_debt = position.debt
            .checked_sub(debt_to_cover)
            .unwrap_or_revert_with(&self.env(), Error::Underflow);

        let mut updated_position = position.clone();
        updated_position.collateral = new_collateral;
        updated_position.debt = new_debt;
        self.positions.set(&user, updated_position);

        // Update global
        self.total_collateral.set(
            self.total_collateral.get_or_default()
                .checked_sub(collateral_to_seize)
                .unwrap_or_revert_with(&self.env(), Error::Underflow)
        );

        self.total_debt.set(
            self.total_debt.get_or_default()
                .checked_sub(debt_to_cover)
                .unwrap_or_revert_with(&self.env(), Error::Underflow)
        );

        // Transfer ySCSPR to liquidator
        self.transfer_yscspr(liquidator, collateral_to_seize);

        self.env().emit_event(Liquidate {
            user,
            liquidator,
            debt_covered: debt_to_cover,
            collateral_seized: collateral_to_seize,
            price,
        });
    }

    // --- Helpers & Views ---

    pub fn get_position(&self, user: Address) -> Option<Position> {
        self.positions.get(&user)
    }

    fn get_price(&self) -> U256 {
        let oracle_addr = self.oracle.get_or_revert_with(Error::InvalidConfig);
        let oracle_ref = PriceOracleContractContractRef::new(self.env(), oracle_addr);
        oracle_ref.get_price()
    }

    fn get_exchange_rate(&self) -> U256 {
        let ls_addr = self.liquid_staking.get_or_revert_with(Error::InvalidConfig);
        let ls_ref = LiquidStakingContractContractRef::new(self.env(), ls_addr);
        ls_ref.get_exchange_rate()
    }

    fn mint_cusd(&mut self, to: Address, amount: U256) {
        let addr = self.cusd_token.get_or_revert_with(Error::InvalidConfig);
        let mut token = CUSDContractContractRef::new(self.env(), addr);
        token.mint(to, amount);
    }

    fn burn_cusd(&mut self, from: Address, amount: U256) {
        let addr = self.cusd_token.get_or_revert_with(Error::InvalidConfig);
        let mut token = CUSDContractContractRef::new(self.env(), addr);
        token.burn(from, amount);
    }

    fn transfer_yscspr(&mut self, to: Address, amount: U256) {
        let addr = self.yscspr_token.get_or_revert_with(Error::InvalidConfig);
        let mut token = YSCSPRContractContractRef::new(self.env(), addr);
        token.transfer(to, amount);
    }

    fn transfer_yscspr_from(&mut self, from: Address, to: Address, amount: U256) {
        let addr = self.yscspr_token.get_or_revert_with(Error::InvalidConfig);
        let mut token = YSCSPRContractContractRef::new(self.env(), addr);
        token.transfer_from(from, to, amount);
    }

    // Calculation Helpers

    fn calculate_max_debt(&self, collateral: U256, price: U256, ltv: u64) -> U256 {
        let collateral_usd_value = self.collateral_to_usd(collateral, price);
        
        collateral_usd_value
            .checked_mul(U256::from(ltv))
            .unwrap_or_default()
            .checked_div(U256::from(10000))
            .unwrap_or_default()
    }

    fn collateral_to_usd(&self, yscspr_amount: U256, cspr_price: U256) -> U256 {
        const MOTES_PER_CSPR: u128 = 1_000_000_000;
        let exchange_rate = self.get_exchange_rate();

        // 1. Convert ySCSPR -> sCSPR value
        let cspr_value = yscspr_amount
            .checked_mul(exchange_rate)
            .unwrap_or_default()
            .checked_div(U256::from(MOTES_PER_CSPR))
            .unwrap_or_default();

        // 2. Convert sCSPR -> USD value
        cspr_value
            .checked_mul(cspr_price)
            .unwrap_or_default()
            .checked_div(U256::from(MOTES_PER_CSPR))
            .unwrap_or_default()
    }

    fn calculate_health_factor(&self, position: &Position, price: U256, threshold: u64) -> u64 {
        if position.debt.is_zero() {
            return u64::MAX;
        }

        let collateral_usd = self.collateral_to_usd(position.collateral, price);
        
        let threshold_value = collateral_usd
            .checked_mul(U256::from(threshold))
            .unwrap_or_default();

        let health = threshold_value
            .checked_mul(U256::from(10000))
            .unwrap_or_default()
            .checked_div(position.debt.checked_mul(U256::from(10000)).unwrap_or(U256::one()))
            .unwrap_or_default();
            
        health.as_u64()
    }

    fn calculate_liquidation_amount(&self, debt_cover: U256, price: U256, penalty: u64) -> U256 {
        // We need to return amount of ySCSPR, not CSPR
        const MOTES_PER_CSPR: u128 = 1_000_000_000;
        const BASIS_POINTS: u64 = 10000;
        
        // 1. Calculate value in USD needed (Debt + Penalty)
        let multiplier = BASIS_POINTS.checked_add(penalty).unwrap_or(BASIS_POINTS);
        let usd_value_needed = debt_cover
            .checked_mul(U256::from(multiplier))
            .unwrap_or_default()
            .checked_div(U256::from(BASIS_POINTS))
            .unwrap_or_default();

        // 2. Convert USD -> CSPR
        let cspr_needed = usd_value_needed
            .checked_mul(U256::from(MOTES_PER_CSPR))
            .unwrap_or_default()
            .checked_div(price)
            .unwrap_or_default();

        // 3. Convert CSPR -> ySCSPR (via Exchange Rate)
        let exchange_rate = self.get_exchange_rate();
        
        cspr_needed
            .checked_mul(U256::from(MOTES_PER_CSPR))
            .unwrap_or_default()
            .checked_div(exchange_rate)
            .unwrap_or_default()
    }

    fn calculate_weighted_price(
        &self,
        old_price: U256,
        old_amt: U256,
        new_price: U256,
        new_amt: U256,
    ) -> U256 {
        let total = old_amt.checked_add(new_amt).unwrap_or(new_amt);
        if total.is_zero() { return new_price; }

        let old_val = old_price.checked_mul(old_amt).unwrap_or_default();
        let new_val = new_price.checked_mul(new_amt).unwrap_or_default();

        old_val
            .checked_add(new_val)
            .unwrap_or_default()
            .checked_div(total)
            .unwrap_or(new_price)
    }

    fn require_owner(&self) {
        if self.env().caller() != self.owner.get_or_revert_with(Error::Unauthorized) {
            self.env().revert(Error::Unauthorized);
        }
    }

    fn require_not_paused(&self) {
        if self.paused.get_or_default() {
            self.env().revert(Error::Paused);
        }
    }
}

// --- Events ---
#[odra::event]
pub struct Deposit {
    pub user: Address,
    pub collateral: U256,
    pub debt_minted: U256,
    pub price: U256,
}

#[odra::event]
pub struct Withdraw {
    pub user: Address,
    pub collateral_returned: U256,
    pub debt_burned: U256,
}

#[odra::event]
pub struct Borrow {
    pub user: Address,
    pub amount: U256,
}

#[odra::event]
pub struct Repay {
    pub user: Address,
    pub amount: U256,
}

#[odra::event]
pub struct Liquidate {
    pub user: Address,
    pub liquidator: Address,
    pub debt_covered: U256,
    pub collateral_seized: U256,
    pub price: U256,
}

// --- Errors ---
#[odra::odra_error]
pub enum Error {
    Unauthorized = 1,
    PositionNotFound = 2,
    InsufficientCollateral = 3,
    InsufficientDebt = 4,
    ExceedsCollateral = 5,
    PositionHealthy = 6,
    CollateralTooLow = 7,
    InvalidLTV = 8,
    InvalidThreshold = 9,
    InvalidPenalty = 10,
    Paused = 11,
    ExceedsMaxDebt = 12,
    ExceedsDebt = 13,
    UnhealthyPosition = 14,
    InvalidConfig = 15,
    Overflow = 100,
    Underflow = 101,
    InvalidAmount = 102,
}