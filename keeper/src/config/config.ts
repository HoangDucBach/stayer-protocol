export interface AppConfig {
  nodeUrl: string;
  chainName: string;
  keeperPrivateKeyPath: string;
  validatorRegistryContractPackageHash: string;
  liquidStakingContractPackageHash: string;
  updateIntervalMs: number;
  harvestIntervalMs: number;
  withdrawalIntervalMs: number;
  csprCloudApiKey?: string;
  csprCloudApiUrl?: string;
}

export const config = (): AppConfig => ({
  nodeUrl: process.env.NODE_URL || 'http://65.109.222.219:7777/rpc',
  chainName: process.env.CHAIN_NAME || 'casper-test',
  keeperPrivateKeyPath:
    process.env.KEEPER_PRIVATE_KEY_PATH || './secret_key.pem',
  validatorRegistryContractPackageHash:
    process.env.VALIDATOR_REGISTRY_CONTRACT_PACKAGE_HASH || '',
  liquidStakingContractPackageHash:
    process.env.LIQUID_STAKING_CONTRACT_PACKAGE_HASH || '',
  updateIntervalMs: parseInt(process.env.UPDATE_INTERVAL_MS || '3600000', 10),
  harvestIntervalMs: parseInt(process.env.HARVEST_INTERVAL_MS || '7200000', 10),
  withdrawalIntervalMs: parseInt(
    process.env.WITHDRAWAL_INTERVAL_MS || '1800000',
    10,
  ),
  csprCloudApiKey: process.env.CSPR_CLOUD_API_KEY,
  csprCloudApiUrl: process.env.CSPR_CLOUD_API_URL,
});
