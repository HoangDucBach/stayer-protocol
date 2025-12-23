use odra::prelude::*;
use odra::casper_types::U256;
use odra::ContractRef;

// --- 1. Styks Interface Definition ---
// Renamed trait to 'StyksPriceFeedContract' so Odra generates 'StyksPriceFeedContractRef'
#[odra::external_contract]
pub trait StyksPriceFeedContract {
    /// Returns the latest TWAP price for the requested price_feed_id (e.g., "CSPRUSD")
    fn get_twap_price(&self, id: String) -> Option<u64>;
}

// --- Constants ---
const MAX_AGE_DEFAULT: u64 = 7200; // 2 hours in seconds
const MIN_ACCEPTABLE_PRICE: u64 = 10; // $0.00...10 (Example bounds)
const MAX_ACCEPTABLE_PRICE: u64 = 1_000_000_000; // Example bounds

// --- 2. Data Structures ---

#[odra::odra_type]
pub struct PriceData {
    /// Price in specified decimals
    pub price: U256,
    /// Timestamp of last update
    pub updated_at: u64,
    /// Round ID for tracking updates
    pub round_id: u64,
}

// --- 3. Main Contract Module ---

#[odra::module(events = [PriceUpdated, OracleConfigUpdated])]
pub struct PriceOracle {
    // --- Storage ---
    
    /// Current trusted price data
    price_data: Var<PriceData>,
    
    /// Maximum acceptable data age (seconds)
    max_age: Var<u64>,
    
    /// Address of the Styks PriceFeed Contract on the network
    styks_oracle: Var<Address>,
    
    /// List of addresses authorized for manual updates (Keepers)
    updaters: Mapping<Address, bool>,
    
    /// Contract owner (Admin)
    owner: Var<Address>,
    
    /// Fallback price (used in emergencies or oracle failure)
    fallback_price: Var<U256>,
    
    /// Flag to toggle fallback mode
    use_fallback: Var<bool>,
}

#[odra::module]
impl PriceOracle {
    
    // --- Initialization ---

    #[odra(init)]
    pub fn init(&mut self, initial_price: U256, styks_address: Address) {
        let caller = self.env().caller();
        
        // Init price data
        self.price_data.set(PriceData {
            price: initial_price,
            updated_at: self.env().get_block_time(),
            round_id: 1,
        });

        // Default configuration
        self.max_age.set(MAX_AGE_DEFAULT);
        self.styks_oracle.set(styks_address);
        
        // Set permissions
        self.updaters.set(&caller, true);
        self.owner.set(caller);
        
        // Fallback setup
        self.fallback_price.set(initial_price);
        self.use_fallback.set(false);
    }

    // --- Core Oracle Logic ---

    /// Get current CSPR price (Safe View)
    pub fn get_price(&self) -> U256 {
        // 1. Check if fallback mode is manually enabled
        if self.use_fallback.get_or_default() {
            return self.fallback_price.get_or_revert_with(Error::FallbackNotSet);
        }

        // 2. Get price data
        let data = self.price_data.get_or_revert_with(Error::PriceNotInitialized);
        let current_time = self.env().get_block_time();
        let max_age = self.max_age.get_or_revert_with(Error::InvalidConfig);

        // 3. Check data staleness (Circuit Breaker)
        if current_time > data.updated_at {
            let age = current_time - data.updated_at;
            if age > max_age {
                // If data is too old -> Try to use safe fallback price
                return self.fallback_price.get_or_revert_with(Error::StalePriceAndNoFallback);
            }
        }

        data.price
    }

    /// Get full data struct
    pub fn get_latest_price_data(&self) -> PriceData {
        if self.use_fallback.get_or_default() {
            return PriceData {
                price: self.fallback_price.get_or_revert_with(Error::FallbackNotSet),
                updated_at: self.env().get_block_time(),
                round_id: 0,
            };
        }
        self.price_data.get_or_revert_with(Error::PriceNotInitialized)
    }

    // --- Data Ingestion ---

    /// METHOD 1: PULL MODEL (Recommended via Styks)
    /// Call Styks PriceFeed contract to fetch the latest TWAP price.
    pub fn fetch_from_styks(&mut self, feed_id: String) {
        // 1. Get Styks address
        let styks_addr = self.styks_oracle.get_or_revert_with(Error::InvalidConfig);

        // 2. Create reference to Styks contract
        let styks_ref: StyksPriceFeedContractContractRef = StyksPriceFeedContractContractRef::new(self.env(), styks_addr);

        // 3. Cross-Contract Call to get_twap_price
        let price_opt = styks_ref.get_twap_price(feed_id);

        // 4. Handle Option<u64> return
        let new_price_u64 = match price_opt {
            Some(p) => p,
            None => self.env().revert(Error::StyksPriceUnavailable),
        };

        // 5. Update internal storage (Convert u64 to U256)
        self.update_price_internal(U256::from(new_price_u64));
    }

    /// METHOD 2: PUSH MODEL
    pub fn update_price(&mut self, new_price: U256) {
        self.require_updater();
        self.update_price_internal(new_price);
    }

    // Internal helper for common update logic
    fn update_price_internal(&mut self, new_price: U256) {
        if new_price < U256::from(MIN_ACCEPTABLE_PRICE) || new_price > U256::from(MAX_ACCEPTABLE_PRICE) {
            self.env().revert(Error::PriceOutOfRange);
        }

        let current_data = self.price_data.get_or_revert_with(Error::PriceNotInitialized);
        let new_round = current_data.round_id + 1;

        let new_data = PriceData {
            price: new_price,
            updated_at: self.env().get_block_time(),
            round_id: new_round,
        };
        self.price_data.set(new_data);

        self.env().emit_event(PriceUpdated {
            price: new_price,
            round_id: new_round,
            timestamp: self.env().get_block_time(),
        });
    }

    // --- View Functions (Restored) ---

    pub fn is_price_stale(&self) -> bool {
        if self.use_fallback.get_or_default() {
            return false;
        }

        let data = self.price_data.get_or_revert_with(Error::PriceNotInitialized);
        let current_time = self.env().get_block_time();
        let max_age = self.max_age.get_or_revert_with(Error::InvalidConfig);

        if current_time <= data.updated_at {
            return false;
        }

        let age = current_time - data.updated_at;
        age > max_age
    }

    pub fn get_price_age(&self) -> u64 {
        let data = self.price_data.get_or_revert_with(Error::PriceNotInitialized);
        let current_time = self.env().get_block_time();

        if current_time <= data.updated_at {
            return 0;
        }
        current_time - data.updated_at
    }

    pub fn get_max_age(&self) -> u64 {
        self.max_age.get_or_revert_with(Error::InvalidConfig)
    }

    // --- Admin / Configuration Functions ---

    pub fn set_styks_oracle(&mut self, new_oracle: Address) {
        self.require_owner();
        self.styks_oracle.set(new_oracle);
        self.env().emit_event(OracleConfigUpdated { 
            config_name: "styks_oracle".to_string(), 
            new_value: "updated".to_string() 
        });
    }

    pub fn set_max_age(&mut self, new_max_age: u64) {
        self.require_owner();
        if new_max_age == 0 { self.env().revert(Error::InvalidConfig); }
        self.max_age.set(new_max_age);
    }

    pub fn set_fallback_price(&mut self, price: U256) {
        self.require_owner();
        self.fallback_price.set(price);
    }

    pub fn set_use_fallback(&mut self, enabled: bool) {
        self.require_owner();
        self.use_fallback.set(enabled);
    }

    pub fn add_updater(&mut self, updater: Address) {
        self.require_owner();
        self.updaters.set(&updater, true);
    }

    pub fn remove_updater(&mut self, updater: Address) {
        self.require_owner();
        self.updaters.set(&updater, false);
    }

    // --- Helpers ---

    fn require_updater(&self) {
        let caller = self.env().caller();
        if !self.updaters.get(&caller).unwrap_or_default() {
            self.env().revert(Error::Unauthorized);
        }
    }

    fn require_owner(&self) {
        if self.env().caller() != self.owner.get_or_revert_with(Error::NotInitialized) {
            self.env().revert(Error::Unauthorized);
        }
    }
}

// --- Events & Errors ---

#[odra::event]
pub struct PriceUpdated {
    pub price: U256,
    pub round_id: u64,
    pub timestamp: u64,
}

#[odra::event]
pub struct OracleConfigUpdated {
    pub config_name: String,
    pub new_value: String,
}

#[odra::odra_error]
pub enum Error {
    Unauthorized = 1,
    PriceOutOfRange = 2,
    InvalidConfig = 3,
    StyksPriceUnavailable = 4,
    PriceNotInitialized = 5,
    FallbackNotSet = 6,
    StalePriceAndNoFallback = 7,
    NotInitialized = 8,
}

#[cfg(test)]
mod tests {
    use super::*;
    use odra::host::{Deployer, HostEnv};

    // Mock Styks - IMPORTANT: Parameter name MUST match the interface trait
    #[odra::module]
    struct MockStyks {
        price: Var<u64>
    }

    #[odra::module]
    impl MockStyks {
        #[odra(init)]
        pub fn init(&mut self, price: u64) {
            self.price.set(price);
        }

        // CRITICAL: Use 'id' (not '_id') to match StyksPriceFeedContract trait
        // The parameter name must exactly match the trait for contract ABI compatibility
        #[allow(unused_variables)]
        pub fn get_twap_price(&self, id: String) -> Option<u64> {
            Some(self.price.get_or_default())
        }

        pub fn set_mock_price(&mut self, new_price: u64) {
            self.price.set(new_price);
        }
    }

    fn setup() -> (HostEnv, PriceOracleHostRef, MockStyksHostRef, Address) {
        let env = odra_test::env();
        let owner = env.get_account(0);
        env.set_caller(owner);

        // Deploy mock Styks oracle
        let mock_styks = MockStyks::deploy(&env, MockStyksInitArgs { price: 500u64 });

        // Deploy price oracle
        let oracle = PriceOracle::deploy(&env, PriceOracleInitArgs {
            initial_price: U256::from(400),
            styks_address: mock_styks.address(),
        });

        (env, oracle, mock_styks, owner)
    }

    #[test]
    fn test_fetch_from_styks_integration() {
        let (_env, mut oracle, mut mock_styks, _owner) = setup();
        
        assert_eq!(oracle.get_price(), U256::from(400));

        // Update mock to 550
        mock_styks.set_mock_price(550u64);

        // Fetch "CSPRUSD"
        oracle.fetch_from_styks("CSPRUSD".to_string());

        assert_eq!(oracle.get_price(), U256::from(550));
    }

    #[test]
    fn test_manual_update() {
        let (_env, mut oracle, _mock_styks, _owner) = setup();
        oracle.update_price(U256::from(450));
        assert_eq!(oracle.get_price(), U256::from(450));
    }

    #[test]
    fn test_fallback_logic() {
        let (_env, mut oracle, _mock_styks, _owner) = setup();

        oracle.set_use_fallback(true);
        oracle.set_fallback_price(U256::from(100));

        oracle.update_price(U256::from(500));
        assert_eq!(oracle.get_price(), U256::from(100));
    }
}