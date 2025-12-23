use odra::host::{Deployer, HostEnv};
use odra_cli::{deploy::DeployScript, DeployedContractsContainer, OdraCli};
use odra::casper_types::U256;
use odra::prelude::{Address, Addressable};
use std::str::FromStr;

use oracle::oracle::{PriceOracle, PriceOracleInitArgs};
use cusd::cusd::{CUSD, CUSDInitArgs};
use yscspr::yscspr::{YSCSPR, YSCSPRInitArgs};
use stayer::stayer::{StayerVault, StayerVaultInitArgs};

pub struct DeployStayerScript;

impl DeployScript for DeployStayerScript {
    fn deploy(
        &self,
        env: &HostEnv,
        container: &mut DeployedContractsContainer
    ) -> Result<(), odra_cli::deploy::Error> {
        env.set_gas(500_000_000_000u64);

        let styks_contract_hash = "hash-2879d6e927289197aab0101cc033f532fe22e4ab4686e44b5743cb1333031acc";
        let styks_address = Address::from_str(styks_contract_hash).unwrap();

        let initial_price = U256::from(50_000_000u128);

        let oracle = PriceOracle::try_deploy(env, PriceOracleInitArgs {
            initial_price,
            styks_address,
        })?;
        container.add_contract(&oracle)?;

        let oracle_address = oracle.address();

        let vault_placeholder = Address::from_str("hash-0000000000000000000000000000000000000000000000000000000000000000").unwrap();

        let mut cusd = CUSD::try_deploy(env, CUSDInitArgs {
            vault_address: vault_placeholder,
        })?;
        container.add_contract(&cusd)?;

        let mut yscspr = YSCSPR::try_deploy(env, YSCSPRInitArgs {
            vault_address: vault_placeholder,
        })?;
        container.add_contract(&yscspr)?;

        let stayer = StayerVault::try_deploy(env, StayerVaultInitArgs {
            oracle: oracle_address,
            cusd_token: cusd.address(),
            yscspr_token: yscspr.address(),
        })?;
        container.add_contract(&stayer)?;

        cusd.set_vault(stayer.address());
        yscspr.set_vault(stayer.address());

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
        .contract::<StayerVault>()
        .build()
        .run();
}