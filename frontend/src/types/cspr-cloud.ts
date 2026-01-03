// CSPR.cloud REST API Types
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

export type ValidatorAPI = {
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

export type Validator = {
  publicKey: string;
  eraId: number;
  rank: number;
  isActive: boolean;
  fee: number;
  feeChange: number | null;
  totalStake: string;
  selfStake: string;
  selfShare: number;
  networkShare: number;
  delegatorsNumber: number;
  delegatorsStake: string;
  delegatorsChange: number | null;
  performance: number | null;
};

// ============ Validator Performance ============

export type ValidatorPerformanceAPI = {
  public_key: string;
  era_id: number;
  score: number;
};

export type ValidatorPerformance = {
  publicKey: string;
  eraId: number;
  score: number;
};

// ============ Validator Reward ============

export type ValidatorRewardAPI = {
  public_key: string;
  era_id: number;
  amount: string;
  timestamp: string;
};

export type ValidatorReward = {
  publicKey: string;
  eraId: number;
  amount: string;
  timestamp: string;
};

// ============ Account ============

export type AccountAPI = {
  public_key: string;
  account_hash: string;
  balance: string;
  total_balance: string;
  available_balance: string;
  staked_balance: string | null;
  rewards: string | null;
  is_system: boolean;
};

export type Account = {
  publicKey: string;
  accountHash: string;
  balance: string;
  totalBalance: string;
  availableBalance: string;
  stakedBalance: string | null;
  rewards: string | null;
  isSystem: boolean;
};

// ============ Account Info ============

export type AccountInfoAPI = {
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

export type AccountInfo = AccountInfoAPI;

// ============ Block ============

export type BlockAPI = {
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

export type Block = {
  hash: string;
  height: number;
  eraId: number;
  timestamp: string;
  proposer: string;
  stateRootHash: string;
  deployCount: number;
  transferCount: number;
  isSwitchBlock: boolean;
};

// ============ Auction Metrics ============

export type AuctionMetricsAPI = {
  era_id: number;
  validators_count: number;
  validators_count_change: number;
  bidders_count: number;
  bidders_count_change: number;
  total_stake: string;
  total_stake_change: string;
  active_validators_stake: string;
  active_validators_stake_change: string;
  total_bid: string;
  total_bid_change: string;
  average_performance: number | null;
  average_performance_change: number | null;
  delegators_count: number;
  delegators_count_change: number;
  auction_price: string;
  auction_price_change: string;
  era_rewards: string | null;
};

export type AuctionMetrics = {
  eraId: number;
  validatorsCount: number;
  validatorsCountChange: number;
  biddersCount: number;
  biddersCountChange: number;
  totalStake: string;
  totalStakeChange: string;
  activeValidatorsStake: string;
  activeValidatorsStakeChange: string;
  totalBid: string;
  totalBidChange: string;
  averagePerformance: number | null;
  averagePerformanceChange: number | null;
  delegatorsCount: number;
  delegatorsCountChange: number;
  auctionPrice: string;
  auctionPriceChange: string;
  eraRewards: string | null;
};

// ============ CSPR Rate ============

export type CSPRRateAPI = {
  currency_id: string;
  rate: string;
  created: string;
};

export type CSPRRate = {
  currencyId: string;
  rate: string;
  created: string;
};

// ============ CSPR Supply ============

export type CSPRSupplyAPI = {
  total: string;
  circulating: string;
  staked: string;
  staked_differing_from_circulating: string;
  timestamp: string;
};

export type CSPRSupply = {
  total: string;
  circulating: string;
  staked: string;
  stakedDifferingFromCirculating: string;
  timestamp: string;
};

// ============ Delegation ============

export type DelegationAPI = {
  public_key: string;
  validator_public_key: string;
  stake: string;
  bonding_purse: string;
};

export type Delegation = {
  publicKey: string;
  validatorPublicKey: string;
  stake: string;
  bondingPurse: string;
};

// ============ Deploy ============

export type DeployAPI = {
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
};

export type Deploy = {
  deployHash: string;
  blockHash: string;
  callerPublicKey: string;
  executionTypeId: number;
  contractHash: string | null;
  contractPackageHash: string | null;
  cost: string;
  paymentAmount: string;
  errorMessage: string | null;
  timestamp: string;
  status: string;
  args: Record<string, unknown> | null;
};

// ============ Transfer ============

export type TransferAPI = {
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

export type Transfer = {
  deployHash: string;
  blockHash: string;
  fromPublicKey: string | null;
  fromAccountHash: string | null;
  toPublicKey: string | null;
  toAccountHash: string | null;
  amount: string;
  id: number | null;
  timestamp: string;
  toPurse: string | null;
};

// ============ Bidder ============

export type BidderAPI = {
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

export type Bidder = {
  publicKey: string;
  bid: string;
  eraId: number;
  selfStake: string;
  selfStakeChange: string | null;
  delegatorsCount: number;
  delegatorsCountChange: number | null;
  delegatorsStake: string;
  delegatorsStakeChange: string | null;
  inactive: boolean;
  isNew: boolean;
  fee: number;
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
};

export type DeploysQueryParams = {
  page?: number;
  page_size?: number;
  order_by?: string;
  order_direction?: "ASC" | "DESC";
  caller_public_key?: string;
  block_hash?: string;
};
