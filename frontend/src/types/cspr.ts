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
  performance: number | null;
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
};

// ============ Account Info ============

export type AccountInfo = {
  account_hash: string;
  url: string;
  is_verified: boolean;
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
};

// ============ Auction Metrics ============

export type AuctionMetrics = {
  // Current era ID (API returns as either era_id or current_era_id)
  era_id: number;
  current_era_id?: number;
  // Validator counts
  active_validator_number?: number;
  validators_count?: number;
  validators_count_change?: number;
  // Bidder counts
  total_bids_number?: number;
  active_bids_number?: number;
  bidders_count?: number;
  bidders_count_change?: number;
  // Stakes
  total_active_era_stake?: string;
  total_stake?: string;
  total_stake_change?: string;
  active_validators_stake?: string;
  active_validators_stake_change?: string;
  total_bid?: string;
  total_bid_change?: string;
  // Performance
  average_performance?: number | null;
  average_performance_change?: number | null;
  // Delegators
  delegators_count?: number;
  delegators_count_change?: number;
  // Auction
  auction_price?: string;
  auction_price_change?: string;
  era_rewards?: string | null;
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
  contract_wasm_hash: string;
  named_keys: { name: string; key: string }[];
  entry_points: {
    name: string;
    args: { name: string; type: string; optional: boolean }[];
    ret: string;
    access: string;
    entry_point_type: string;
  }[];
  protocol_version: string;
  timestamp: string;
};

// ============ Contract Package ============

export type ContractPackage = {
  contract_package_hash: string;
  owner_public_key: string;
  access_key: string;
  versions: {
    contract_hash: string;
    contract_version: number;
    protocol_version_major: number;
  }[];
  disabled_versions: {
    contract_hash: string;
    contract_version: number;
    protocol_version_major: number;
  }[];
  groups: {
    group: string;
    keys: string[];
  }[];
  timestamp: string;
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
};

export type BlocksQueryParams = {
  page?: number;
  page_size?: number;
  order_by?: string;
  order_direction?: "ASC" | "DESC";
  proposer?: string;
  era_id?: number;
  hash?: string;
};

export type DeploysQueryParams = {
  page?: number;
  page_size?: number;
  order_by?: string;
  order_direction?: "ASC" | "DESC";
  caller_public_key?: string;
  block_hash?: string;
  deploy_hash?: string;
};

export type ContractsQueryParams = {
  page?: number;
  page_size?: number;
  contract_hash?: string;
  contract_package_hash?: string;
};