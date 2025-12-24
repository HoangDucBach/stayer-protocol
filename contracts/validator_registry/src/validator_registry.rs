use odra::prelude::*;
use odra::casper_types::PublicKey;

const MIN_P_AVG: u64 = 10;
const MAX_P_AVG: u64 = 100;
const MAX_VALIDATORS_PER_UPDATE: u32 = 50;
const STALE_DATA_ERAS: u64 = 3;

#[odra::odra_type]
pub struct ValidatorData {
    pub fee: u64,
    pub is_active: bool,
    pub decay_factor: u64,
    pub p_score: u64,
    pub updated_era: u64,
}

#[odra::odra_type]
pub struct ValidatorUpdateData {
    pub pubkey: PublicKey,
    pub fee: u64,
    pub is_active: bool,
    pub decay_factor: u64,
}

#[odra::module(events = [ValidatorsUpdated])]
pub struct ValidatorRegistry {
    validators: Mapping<PublicKey, ValidatorData>,
    network_p_avg: Var<u64>,
    last_update_era: Var<u64>,
    keeper: Var<Address>,
    owner: Var<Address>,
}

#[odra::module]
impl ValidatorRegistry {
    #[odra(init)]
    pub fn init(&mut self, keeper_address: Address) {
        let caller = self.env().caller();
        self.owner.set(caller);
        self.keeper.set(keeper_address);
        self.network_p_avg.set(80);
        self.last_update_era.set(0);
    }

    pub fn update_validators(
        &mut self,
        validators_data: Vec<ValidatorUpdateData>,
        p_avg: u64,
        current_era: u64,
    ) {
        self.require_keeper();

        if validators_data.len() as u32 > MAX_VALIDATORS_PER_UPDATE {
            self.env().revert(Error::TooManyValidators);
        }

        if p_avg < MIN_P_AVG || p_avg > MAX_P_AVG {
            self.env().revert(Error::InvalidPAvg);
        }

        let last_era = self.last_update_era.get_or_default();
        if current_era <= last_era {
            self.env().revert(Error::InvalidEra);
        }

        for validator_update in validators_data.iter() {
            let p_score = self.calculate_p_score(
                validator_update.fee,
                validator_update.is_active,
                validator_update.decay_factor,
            );

            let validator_data = ValidatorData {
                fee: validator_update.fee,
                is_active: validator_update.is_active,
                decay_factor: validator_update.decay_factor,
                p_score,
                updated_era: current_era,
            };

            self.validators.set(&validator_update.pubkey, validator_data);
        }

        self.network_p_avg.set(p_avg);
        self.last_update_era.set(current_era);

        self.env().emit_event(ValidatorsUpdated {
            era: current_era,
            count: validators_data.len() as u32,
            p_avg,
        });
    }

    pub fn get_validator(&self, pubkey: PublicKey) -> Option<ValidatorData> {
        self.validators.get(&pubkey)
    }

    pub fn get_network_p_avg(&self) -> u64 {
        self.network_p_avg.get_or_default()
    }

    pub fn get_last_update_era(&self) -> u64 {
        self.last_update_era.get_or_default()
    }

    pub fn is_valid(&self, pubkey: PublicKey, current_era: u64) -> bool {
        let validator_opt = self.validators.get(&pubkey);

        match validator_opt {
            Some(v) => {
                v.p_score > 0 &&
                v.is_active &&
                (current_era - self.last_update_era.get_or_default()) <= STALE_DATA_ERAS
            }
            None => false,
        }
    }

    pub fn set_keeper(&mut self, new_keeper: Address) {
        self.require_owner();
        self.keeper.set(new_keeper);
    }

    fn calculate_p_score(&self, fee: u64, is_active: bool, decay_factor: u64) -> u64 {
        if !is_active {
            return 0;
        }

        let fee_component = 100u64.saturating_sub(fee);
        let status_factor = if is_active { 100u64 } else { 0u64 };

        fee_component
            .saturating_mul(status_factor)
            .saturating_mul(decay_factor)
            / 10000
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
pub struct ValidatorsUpdated {
    pub era: u64,
    pub count: u32,
    pub p_avg: u64,
}

#[odra::odra_error]
pub enum Error {
    Unauthorized = 1,
    NotInitialized = 2,
    TooManyValidators = 3,
    InvalidPAvg = 4,
    InvalidEra = 5,
}

#[cfg(test)]
mod tests {
    use super::*;
    use odra::host::{Deployer, HostEnv};
    use odra::casper_types::AsymmetricType;

    fn setup() -> (HostEnv, ValidatorRegistryHostRef, Address, Address) {
        let env = odra_test::env();
        let owner = env.get_account(0);
        let keeper = env.get_account(1);

        env.set_caller(owner);

        let registry = ValidatorRegistry::deploy(&env, ValidatorRegistryInitArgs {
            keeper_address: keeper,
        });

        (env, registry, owner, keeper)
    }

    fn create_test_pubkey(byte_value: u8) -> PublicKey {
        let bytes = [byte_value; 32];
        let hex_string = hex::encode(bytes);
        let full_hex = format!("01{}", hex_string);
        PublicKey::from_hex(&full_hex).unwrap()
    }

    #[test]
    fn test_initialization() {
        let (_env, registry, _owner, _keeper) = setup();

        assert_eq!(registry.get_network_p_avg(), 80);
        assert_eq!(registry.get_last_update_era(), 0);
    }

    #[test]
    fn test_update_validators() {
        let (env, mut registry, _owner, keeper) = setup();

        env.set_caller(keeper);

        let pubkey = create_test_pubkey(1);
        let validators = vec![ValidatorUpdateData {
            pubkey: pubkey.clone(),
            fee: 5u64,
            is_active: true,
            decay_factor: 100u64,
        }];

        registry.update_validators(validators, 85, 1);

        let validator_data = registry.get_validator(pubkey).unwrap();
        assert_eq!(validator_data.fee, 5);
        assert_eq!(validator_data.is_active, true);
        assert_eq!(validator_data.p_score, 95);
        assert_eq!(registry.get_network_p_avg(), 85);
        assert_eq!(registry.get_last_update_era(), 1);
    }

    #[test]
    #[should_panic]
    fn test_unauthorized_update() {
        let (env, mut registry, _owner, _keeper) = setup();
        let hacker = env.get_account(2);

        env.set_caller(hacker);

        let pubkey = create_test_pubkey(1);
        let validators = vec![ValidatorUpdateData {
            pubkey,
            fee: 5u64,
            is_active: true,
            decay_factor: 100u64,
        }];

        registry.update_validators(validators, 85, 1);
    }

    #[test]
    fn test_network_state() {
        let (env, mut registry, _owner, keeper) = setup();

        env.set_caller(keeper);

        let pubkey = create_test_pubkey(1);
        let validators = vec![ValidatorUpdateData {
            pubkey: pubkey.clone(),
            fee: 10u64,
            is_active: true,
            decay_factor: 100u64,
        }];

        registry.update_validators(validators, 85, 1);

        assert_eq!(registry.get_network_p_avg(), 85);
        assert_eq!(registry.get_last_update_era(), 1);
    }
}
