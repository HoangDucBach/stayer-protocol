use odra::casper_types::U256;
use odra::prelude::*;
use odra_modules::cep18_token::Cep18;

/// ySCSPR - Yield Staked CSPR Token
#[odra::module]
pub struct YSCSPR {
    /// This automatically provides: transfer, approve, balance_of, etc.
    token: SubModule<Cep18>,

    /// Whitelist of contracts authorized to mint/burn
    authorized_minters: Mapping<Address, bool>,

    /// Contract owner for admin functions
    owner: Var<Address>,
}

const YIELD_STAKED_CSPR_NAME: &str = "Yield Staked CSPR";
const YIELD_STAKED_CSPR_SYMBOL: &str = "ySCSPR";
const YIELD_STAKED_CSPR_DECIMALS: u8 = 9;
const YIELD_STAKED_CSPR_INITIAL_SUPPLY: U256 = U256::zero();

#[odra::module]
impl YSCSPR {
    /// Initialize ySCSPR token with CEP-18 standard
    ///
    /// # Arguments
    /// * `initial_minter` - Initial authorized minter address (e.g., LiquidStaking contract)
    #[odra(init)]
    pub fn init(&mut self, initial_minter: Address) {
        // Initialize CEP-18 module with token metadata
        self.token.init(
            YIELD_STAKED_CSPR_SYMBOL.to_string(),
            YIELD_STAKED_CSPR_NAME.to_string(),
            YIELD_STAKED_CSPR_DECIMALS,
            YIELD_STAKED_CSPR_INITIAL_SUPPLY,
        );

        self.authorized_minters.set(&initial_minter, true);
        self.owner.set(self.env().caller());
    }

    /// Mint new tokens (authorized minters only)
    /// Called when user deposits collateral
    ///
    /// # Arguments
    /// * `to` - Address to mint to
    /// * `amount` - Amount to mint (1:1 with sCSPR deposited)
    pub fn mint(&mut self, to: Address, amount: U256) {
        self.ensure_authorized();

        self.token.raw_mint(&to, &amount);
    }

    /// Burn tokens (authorized minters only)
    /// Called when user withdraws collateral
    ///
    /// # Arguments
    /// * `from` - Address to burn from
    /// * `amount` - Amount to burn
    pub fn burn(&mut self, from: Address, amount: U256) {
        self.ensure_authorized();

        // Call CEP-18 standard burn function
        self.token.raw_burn(&from, &amount);
    }

    // --- Admin Functions ---

    /// Add authorized contract (owner only)
    /// Authorized contracts can mint and burn tokens
    ///
    /// # Arguments
    /// * `address` - Contract address to authorize
    pub fn add_authorized(&mut self, address: Address) {
        self.ensure_owner();
        self.authorized_minters.set(&address, true);
    }

    /// Remove authorized contract (owner only)
    ///
    /// # Arguments
    /// * `address` - Contract address to deauthorize
    pub fn remove_authorized(&mut self, address: Address) {
        self.ensure_owner();
        self.authorized_minters.set(&address, false);
    }

    /// Check if address is authorized
    ///
    /// # Arguments
    /// * `address` - Address to check
    pub fn is_authorized(&self, address: Address) -> bool {
        self.authorized_minters.get(&address).unwrap_or(false)
    }

    // --- View Functions (Delegated to CEP-18) ---

    /// Get token name
    pub fn name(&self) -> String {
        self.token.name()
    }

    /// Get token symbol
    pub fn symbol(&self) -> String {
        self.token.symbol()
    }

    /// Get token decimals
    pub fn decimals(&self) -> u8 {
        self.token.decimals()
    }

    /// Get total supply
    pub fn total_supply(&self) -> U256 {
        self.token.total_supply()
    }

    /// Get balance of address
    pub fn balance_of(&self, address: Address) -> U256 {
        self.token.balance_of(&address)
    }

    /// Get allowance
    pub fn allowance(&self, owner: Address, spender: Address) -> U256 {
        self.token.allowance(&owner, &spender)
    }

    /// Transfer tokens
    pub fn transfer(&mut self, recipient: Address, amount: U256) {
        self.token.transfer(&recipient, &amount);
    }

    /// Transfer from (with allowance)
    pub fn transfer_from(&mut self, owner: Address, recipient: Address, amount: U256) {
        self.token.transfer_from(&owner, &recipient, &amount);
    }

    /// Approve spender
    pub fn approve(&mut self, spender: Address, amount: U256) {
        self.token.approve(&spender, &amount);
    }

    /// Increase allowance
    pub fn increase_allowance(&mut self, spender: Address, amount: U256) {
        let owner = self.env().caller();
        let current = self.token.allowance(&owner, &spender);
        let new_amount = current
            .checked_add(amount)
            .unwrap_or_revert_with(&self.env(), Error::Overflow);
        self.token.approve(&spender, &new_amount);
    }

    /// Decrease allowance
    pub fn decrease_allowance(&mut self, spender: Address, amount: U256) {
        let owner = self.env().caller();
        let current = self.token.allowance(&owner, &spender);

        if current < amount {
            self.env().revert(Error::InsufficientAllowance);
        }

        let new_amount = current
            .checked_sub(amount)
            .unwrap_or_revert_with(&self.env(), Error::Underflow);
        self.token.approve(&spender, &new_amount);
    }

    // --- Internal Helpers ---

    fn ensure_authorized(&self) {
        let caller = self.env().caller();
        let is_authorized = self.authorized_minters.get(&caller).unwrap_or(false);

        if !is_authorized {
            self.env().revert(Error::Unauthorized);
        }
    }

    fn ensure_owner(&self) {
        let caller = self.env().caller();
        let owner = self.owner.get_or_revert_with(Error::NotInitialized);

        if caller != owner {
            self.env().revert(Error::Unauthorized);
        }
    }
}

// --- Errors ---

#[odra::odra_error]
pub enum Error {
    Unauthorized = 1,
    InsufficientAllowance = 2,
    NotInitialized = 3,
    Overflow = 100,
    Underflow = 101,
}

#[cfg(test)]
mod tests {
    use super::*;
    use odra::host::{Deployer, HostEnv};

    fn setup() -> (HostEnv, YSCSPRHostRef, Address, Address, Address) {
        let env = odra_test::env();

        let owner = env.get_account(0);
        let minter = env.get_account(1);
        let user = env.get_account(2);

        env.set_caller(owner);

        let token = YSCSPR::deploy(
            &env,
            YSCSPRInitArgs {
                initial_minter: minter,
            },
        );
        (env, token, owner, minter, user)
    }

    #[test]
    fn test_authorization_lifecycle() {
        let (env, mut token, owner, authorized_contract, user) = setup();
        let new_contract = env.get_account(3);

        // Initial authorized contract can mint
        env.set_caller(authorized_contract);
        token.mint(user, U256::from(1000));
        assert_eq!(token.balance_of(user), U256::from(1000));

        // Owner adds new authorized contract
        env.set_caller(owner);
        token.add_authorized(new_contract);

        // New contract can mint
        env.set_caller(new_contract);
        token.mint(user, U256::from(500));
        assert_eq!(token.balance_of(user), U256::from(1500));

        // Owner removes initial authorized contract
        env.set_caller(owner);
        token.remove_authorized(authorized_contract);

        // Old contract cannot mint anymore
        env.set_caller(authorized_contract);
        assert_eq!(token.is_authorized(authorized_contract), false);
    }

    #[test]
    fn test_burn_success() {
        let (env, mut token, _, minter, user) = setup();

        env.set_caller(minter);
        token.mint(user, U256::from(1000));

        token.burn(user, U256::from(400));

        assert_eq!(token.balance_of(user), U256::from(600));
        assert_eq!(token.total_supply(), U256::from(600));
    }

    #[test]
    #[should_panic]
    fn test_fail_mint_unauthorized() {
        let (env, mut token, _, _, _) = setup();
        let hacker = env.get_account(4);

        env.set_caller(hacker);
        token.mint(hacker, U256::from(1000));
    }

    #[test]
    #[should_panic]
    fn test_fail_add_authorized_by_hacker() {
        let (env, mut token, _, _, _) = setup();
        let hacker = env.get_account(4);
        let hacker_contract = env.get_account(5);

        env.set_caller(hacker);
        token.add_authorized(hacker_contract);
    }
}
