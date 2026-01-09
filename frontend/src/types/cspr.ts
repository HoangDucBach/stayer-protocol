// CSPR.cloud REST API Types (1:1 Mapping)
// Reference: https://docs.cspr.cloud/rest-api/reference

// ============ Common Types ============

export type PaginatedResponse<T> = {
  data: T[];
  page_count: number;
  item_count: number;
  pages: number[];
};

export type SingleResponse<T> = {
  data: T;
};

// ============ Validator ============

export type Validator = {
  public_key: string;
  era_id: number;
  rank: number;
  is_active: boolean;
  fee: number;
  fee_change: number | null;
  total_stake: string;
  self_stake: string;
  self_share: number;
  network_share: number;
  delegators_number: number;
  delegators_stake: string;
  delegators_change: number | null;
  average_performance: ValidatorPerformance;
  bid_amount?: string;
  reserved_slots?: number;
  minimum_delegation_amount?: string;
  maximum_delegation_amount?: string | null;
  delegators?: Delegation[];
  account_info?: AccountInfo;
  centralized_account_info?: Record<string, any>;
  cspr_name?: string;
};

// ============ Validator Performance ============

export type ValidatorPerformance = {
  public_key: string;
  era_id: number;
  score: number;
};

// ============ Validator Reward ============

export type ValidatorReward = {
  public_key: string;
  era_id: number;
  amount: string;
  timestamp: string;
};

// ============ Delegator Reward ============

export type DelegatorReward = {
  delegator_public_key: string;
  validator_public_key: string;
  era_id: number;
  amount: string;
  timestamp: string;
};

// ============ Account ============

export type Account = {
  public_key: string;
  account_hash: string;
  balance: string;
  total_balance: string;
  available_balance: string;
  staked_balance: string | null;
  rewards: string | null;
  is_system: boolean;
  delegations?: Delegation[];
  unbonding_delegations?: Delegation[];
};

// ============ Account Info ============

export type AccountInfo = {
  account_hash: string;
  url: string;
  is_verified: boolean;
  deploy_hash?: string;
  verified_account_hashes?: string[];
  created?: string;
  updated?: string;
  info: {
    owner?: {
      name?: string;
      description?: string;
      type?: string[];
      email?: string;
      identity?: {
        ownership_disclosure_url?: string;
        casper_association_kyc_url?: string;
        casper_association_kyc_onchain?: string;
      };
      resources?: {
        code_of_conduct_url?: string;
        terms_of_service_url?: string;
        privacy_policy_url?: string;
        other?: { name: string; url: string }[];
      };
      affiliated_accounts?: { public_key: string }[];
      social?: {
        website?: string;
        twitter?: string;
        github?: string;
        medium?: string;
        telegram?: string;
        discord?: string;
        youtube?: string;
        linkedin?: string;
        facebook?: string;
      };
      branding?: {
        logo?: { svg?: string; png_256?: string; png_1024?: string };
      };
      location?: {
        country?: string;
        latitude?: number;
        longitude?: number;
      };
    };
    nodes?: {
      public_key: string;
      description?: string;
      functionality?: string[];
      location?: {
        name?: string;
        country?: string;
        latitude?: number;
        longitude?: number;
      };
    }[];
  };
};

// ============ Block ============

export type Block = {
  hash: string;
  height: number;
  era_id: number;
  timestamp: string;
  proposer: string;
  state_root_hash: string;
  deploy_count: number;
  transfer_count: number;
  is_switch_block: boolean;
  deploys?: Deploy[];
  transfers?: Transfer[];
};

// ============ Auction Metrics ============

export type AuctionMetrics = {
  current_era_id: number;
  active_validator_number: number;
  total_bids_number: number;
  active_bids_number: number;
  total_active_era_stake: string;
};

// ============ CSPR Rate ============

export type CSPRRate = {
  currency_id: string;
  rate: string;
  created: string;
};

// ============ CSPR Supply ============

export type CSPRSupply = {
  total: string;
  circulating: string;
  staked: string;
  staked_differing_from_circulating: string;
  timestamp: string;
};

// ============ Delegation ============

export type Delegation = {
  public_key: string;
  validator_public_key: string;
  stake: string;
  bonding_purse: string;
  validator?: Validator;
  delegator?: Account;
};

// ============ Deploy ============

export type Deploy = {
  deploy_hash: string;
  block_hash: string;
  caller_public_key: string;
  execution_type_id: number;
  contract_hash: string | null;
  contract_package_hash: string | null;
  cost: string;
  payment_amount: string;
  error_message: string | null;
  timestamp: string;
  status: string;
  args: Record<string, unknown> | null;
  gas_price?: number;
  ttl?: string;
  chain_name?: string;
  raw_args?: string;
  type?: string;
};

// ============ Transfer ============

export type Transfer = {
  deploy_hash: string;
  block_hash: string;
  from_public_key: string | null;
  from_account_hash: string | null;
  to_public_key: string | null;
  to_account_hash: string | null;
  amount: string;
  id: number | null;
  timestamp: string;
  to_purse: string | null;
  initiator_public_key?: string;
  from_purse_public_key?: string | null;
  to_purse_public_key?: string | null;
  to_account_info?: AccountInfo;
  to_centralized_account_info?: any;
  from_purse_account_info?: AccountInfo;
  from_purse_centralized_account_info?: any;
};

// ============ Bidder ============

export type Bidder = {
  public_key: string;
  bid: string;
  era_id: number;
  self_stake: string;
  self_stake_change: string | null;
  delegators_count: number;
  delegators_count_change: number | null;
  delegators_stake: string;
  delegators_stake_change: string | null;
  inactive: boolean;
  is_new: boolean;
  fee: number;
};

// ============ Contract ============

export type Contract = {
  contract_hash: string;
  contract_package_hash: string;
  deploy_hash: string;
  contract_type_id: number | null;
  contract_version: number;
  contract_name: string | null;
  is_disabled: boolean;
  timestamp: string;
  // Includes
  contract_package?: ContractPackage;
};

// ============ Contract Package ============

export type ContractPackage = {
  contract_package_hash: string;
  owner_public_key: string | null;
  owner_hash: string;
  name: string | null;
  description: string | null;
  icon_url: string | null;
  website_url: string | null;
  latest_version_contract_type_id: number | null;
  timestamp: string;
  metadata?: Record<string, any>;
  // Includes
  contracts?: Contract[];
};

// ============ NFT ============

export type NftToken = {
  token_id: string;
  contract_package_hash: string;
  owner_public_key: string | null;
  owner_account_hash: string | null;
  on_chain_metadata: Record<string, unknown>;
  off_chain_metadata: Record<string, unknown> | null;
  burn: boolean;
  timestamp: string;
  metadata_json?: string;
};

// ============ Fungible Token / ERC20 ============

export type FungibleToken = {
  contract_package_hash: string;
  name: string;
  symbol: string;
  decimals: number;
  total_supply: string;
  image_url: string | null;
};

// ============ Query Params ============

export type ValidatorsQueryParams = {
  page?: number;
  page_size?: number;
  order_by?: string;
  order_direction?: "ASC" | "DESC";
  is_active?: boolean;
  public_key?: string;
  era_id?: number;
};

export type AccountQueryParams = {
  page?: number;
  page_size?: number;
  order_by?: string;
  order_direction?: "ASC" | "DESC";
  account_hash?: string;
  public_key?: string;
  includes?: string;
};

export type BlocksQueryParams = {
  page?: number;
  page_size?: number;
  order_by?: string;
  order_direction?: "ASC" | "DESC";
  proposer?: string;
  era_id?: number;
  hash?: string;
  includes?: string;
};

export type DeploysQueryParams = {
  page?: number;
  page_size?: number;
  order_by?: string;
  order_direction?: "ASC" | "DESC";
  caller_public_key?: string;
  block_hash?: string;
  deploy_hash?: string;
  includes?: string;
};

export type ContractsQueryParams = {
  page?: number;
  page_size?: number;
  contract_hash?: string;
  contract_package_hash?: string;
};
