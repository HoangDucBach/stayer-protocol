use odra::casper_types::U256;
use odra::prelude::*;
use odra_modules::cep18_token::{Cep18};

/// cUSD - Casper USD Stablecoin
#[odra::module]
pub struct CUSD {
    /// This automatically provides: transfer, approve, balance_of, etc.
    token: SubModule<Cep18>,

    /// Vault contract authorized to mint/burn
    vault: Var<Address>,

    /// Contract owner for admin functions
    owner: Var<Address>,
}

const CASPER_USD_NAME: &str = "Casper USD";
const CASPER_USD_SYMBOL: &str = "cUSD";
const CASPER_USD_DECIMALS: u8 = 9;
const CASPER_USD_INITIAL_SUPPLY: U256 = U256::zero();

#[odra::module]
impl CUSD {
    /// Initialize cUSD token wth CEP-18 standard
    ///
    /// # Arguments
    /// * `vault_address` - Address of Stayer vault contract
    #[odra(init)]
    pub fn init(&mut self, vault_address: Address) {
        // Initialize CEP-18 module with token metadata
        self.token.init(
            CASPER_USD_SYMBOL.to_string(),
            CASPER_USD_NAME.to_string(),
            CASPER_USD_DECIMALS,
            CASPER_USD_INITIAL_SUPPLY,
        );

        self.vault.set(vault_address);
        self.owner.set(self.env().caller());
    }

    /// Mint new tokens (vault only)
    ///
    /// # Arguments
    /// * `to` - Address to mint to
    /// * `amount` - Amount to mint
    pub fn mint(&mut self, to: Address, amount: U256) {
        self.ensure_vault();

        self.token.raw_mint(&to, &amount);
    }

    /// Burn tokens (vault only)
    ///
    /// # Arguments
    /// * `from` - Address to burn from
    /// * `amount` - Amount to burn
    pub fn burn(&mut self, from: Address, amount: U256) {
        self.ensure_vault();

        // Call CEP-18 standard burn function
        self.token.raw_burn(&from, &amount);
    }

    // --- Admin Functions ---

    /// Update vault address (owner only)
    ///
    /// # Arguments
    /// * `new_vault` - New vault contract address
    pub fn set_vault(&mut self, new_vault: Address) {
        self.ensure_owner();
        self.vault.set(new_vault);
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

    fn ensure_vault(&self) {
        let caller = self.env().caller();
        let vault = self.vault.get_or_revert_with(Error::NotInitialized);

        if caller != vault {
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

    fn setup() -> (HostEnv, CUSDHostRef, Address, Address, Address) {
        let env = odra_test::env();

        // Tạo account
        let owner = env.get_account(0);
        let vault = env.get_account(1);
        let user = env.get_account(2);

        env.set_caller(owner);

        let token = CUSD::deploy(
            &env,
            CUSDInitArgs {
                vault_address: vault,
            },
        );
        (env, token, owner, vault, user)
    }

    #[test]
    fn test_vault_lifecycle() {
        let (env, mut token, owner, vault, user) = setup();
        let new_vault = env.get_account(3);

        env.set_caller(vault);
        token.mint(user, U256::from(1000));
        assert_eq!(token.balance_of(user), U256::from(1000));

        env.set_caller(owner);
        token.set_vault(new_vault);

        env.set_caller(new_vault);
        token.mint(user, U256::from(500));
        assert_eq!(token.balance_of(user), U256::from(1500));
    }

    #[test]
    fn test_burn_success() {
        let (env, mut token, _, vault, user) = setup();

        env.set_caller(vault);
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
    fn test_fail_set_vault_unauthorized() {
        let (env, mut token, _, _, _) = setup();
        let hacker = env.get_account(4);
        let new_hacker_vault = env.get_account(5);

        env.set_caller(hacker);
        token.set_vault(new_hacker_vault);
    }
}
