use odra::casper_types::U256;
use odra::host::{Deployer, HostEnv};
use odra::prelude::{Address, Addressable};
use odra_cli::{deploy::DeployScript, DeployedContractsContainer, OdraCli};
use std::str::FromStr;

use cusd::cusd::{CUSDInitArgs, CUSD};
use liquid_staking::liquid_staking::{LiquidStaking, LiquidStakingInitArgs};
use oracle::oracle::{PriceOracle, PriceOracleInitArgs};
use stayer::stayer::{StayerVault, StayerVaultInitArgs};
use validator_registry::validator_registry::{ValidatorRegistry, ValidatorRegistryInitArgs};
use yscspr::yscspr::{YSCSPRInitArgs, YSCSPR};

pub struct DeployStayerScript;

impl DeployScript for DeployStayerScript {
    fn deploy(
        &self,
        env: &HostEnv,
        container: &mut DeployedContractsContainer,
    ) -> Result<(), odra_cli::deploy::Error> {
        env.set_gas(500_000_000_000u64);

        let styks_contract_hash =
            "hash-2879d6e927289197aab0101cc033f532fe22e4ab4686e44b5743cb1333031acc";
        let styks_address = Address::from_str(styks_contract_hash).unwrap();

        let initial_price = U256::from(50_000_000u128);

        let oracle = PriceOracle::try_deploy(
            env,
            PriceOracleInitArgs {
                initial_price,
                styks_address,
            },
        )?;
        container.add_contract(&oracle)?;

        let oracle_address = oracle.address();

        let vault_placeholder = Address::from_str(
            "hash-0000000000000000000000000000000000000000000000000000000000000000",
        )
        .unwrap();
        let keeper_address = env.caller();

        // Auction contract is handled by keeper, not used in contract init
        // hash-93d923e336b20a4c4ca14d592b60e5bd3fe330775618290104f9beb326db7ae2

        let validator_registry =
            ValidatorRegistry::try_deploy(env, ValidatorRegistryInitArgs { keeper_address })?;
        container.add_contract(&validator_registry)?;

        let mut cusd = CUSD::try_deploy(
            env,
            CUSDInitArgs {
                initial_minter: vault_placeholder,
            },
        )?;
        container.add_contract(&cusd)?;

        let mut yscspr = YSCSPR::try_deploy(
            env,
            YSCSPRInitArgs {
                initial_minter: vault_placeholder,
            },
        )?;
        container.add_contract(&yscspr)?;

        let liquid_staking = LiquidStaking::try_deploy(
            env,
            LiquidStakingInitArgs {
                validator_registry: validator_registry.address(),
                yscspr_token: yscspr.address(),
                keeper: keeper_address,
            },
        )?;
        container.add_contract(&liquid_staking)?;

        let stayer = StayerVault::try_deploy(
            env,
            StayerVaultInitArgs {
                oracle: oracle_address,
                cusd_token: cusd.address(),
                yscspr_token: yscspr.address(),
                liquid_staking: liquid_staking.address(),
            },
        )?;
        container.add_contract(&stayer)?;

        cusd.add_authorized(stayer.address());
        cusd.add_authorized(liquid_staking.address());

        yscspr.add_authorized(stayer.address());
        yscspr.add_authorized(liquid_staking.address());

        Ok(())
    }
}

pub fn main() {
    OdraCli::new()
        .about("Stayer Protocol CLI")
        .deploy(DeployStayerScript)
        .contract::<PriceOracle>()
        .contract::<CUSD>()
        .contract::<YSCSPR>()
        .contract::<ValidatorRegistry>()
        .contract::<LiquidStaking>()
        .contract::<StayerVault>()
        .build()
        .run();
}
