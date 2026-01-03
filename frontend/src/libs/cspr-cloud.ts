import axios, { AxiosInstance } from "axios";
import { ICsprCloudProxy } from "@make-software/csprclick-core-types";
import { CASPER_CLOUD_ENDPOINT } from "@/configs/constants";
import type {
  PaginatedResponse,
  SingleResponse,
  ValidatorAPI,
  Validator,
  ValidatorPerformanceAPI,
  ValidatorPerformance,
  ValidatorRewardAPI,
  ValidatorReward,
  AccountAPI,
  Account,
  AccountInfoAPI,
  AccountInfo,
  BlockAPI,
  Block,
  AuctionMetricsAPI,
  AuctionMetrics,
  CSPRRateAPI,
  CSPRRate,
  CSPRSupplyAPI,
  CSPRSupply,
  DelegationAPI,
  Delegation,
  BidderAPI,
  Bidder,
  ValidatorsQueryParams,
  AccountQueryParams,
  BlocksQueryParams,
} from "@/types/cspr-cloud";

// ============ Mappers ============

function mapValidator(v: ValidatorAPI): Validator {
  return {
    publicKey: v.public_key,
    eraId: v.era_id,
    rank: v.rank,
    isActive: v.is_active,
    fee: v.fee,
    feeChange: v.fee_change,
    totalStake: v.total_stake,
    selfStake: v.self_stake,
    selfShare: v.self_share,
    networkShare: v.network_share,
    delegatorsNumber: v.delegators_number,
    delegatorsStake: v.delegators_stake,
    delegatorsChange: v.delegators_change,
    performance: v.performance,
  };
}

function mapValidatorPerformance(v: ValidatorPerformanceAPI): ValidatorPerformance {
  return {
    publicKey: v.public_key,
    eraId: v.era_id,
    score: v.score,
  };
}

function mapValidatorReward(v: ValidatorRewardAPI): ValidatorReward {
  return {
    publicKey: v.public_key,
    eraId: v.era_id,
    amount: v.amount,
    timestamp: v.timestamp,
  };
}

function mapAccount(a: AccountAPI): Account {
  return {
    publicKey: a.public_key,
    accountHash: a.account_hash,
    balance: a.balance,
    totalBalance: a.total_balance,
    availableBalance: a.available_balance,
    stakedBalance: a.staked_balance,
    rewards: a.rewards,
    isSystem: a.is_system,
  };
}

function mapBlock(b: BlockAPI): Block {
  return {
    hash: b.hash,
    height: b.height,
    eraId: b.era_id,
    timestamp: b.timestamp,
    proposer: b.proposer,
    stateRootHash: b.state_root_hash,
    deployCount: b.deploy_count,
    transferCount: b.transfer_count,
    isSwitchBlock: b.is_switch_block,
  };
}

function mapAuctionMetrics(m: AuctionMetricsAPI): AuctionMetrics {
  return {
    eraId: m.era_id,
    validatorsCount: m.validators_count,
    validatorsCountChange: m.validators_count_change,
    biddersCount: m.bidders_count,
    biddersCountChange: m.bidders_count_change,
    totalStake: m.total_stake,
    totalStakeChange: m.total_stake_change,
    activeValidatorsStake: m.active_validators_stake,
    activeValidatorsStakeChange: m.active_validators_stake_change,
    totalBid: m.total_bid,
    totalBidChange: m.total_bid_change,
    averagePerformance: m.average_performance,
    averagePerformanceChange: m.average_performance_change,
    delegatorsCount: m.delegators_count,
    delegatorsCountChange: m.delegators_count_change,
    auctionPrice: m.auction_price,
    auctionPriceChange: m.auction_price_change,
    eraRewards: m.era_rewards,
  };
}

function mapCSPRRate(r: CSPRRateAPI): CSPRRate {
  return {
    currencyId: r.currency_id,
    rate: r.rate,
    created: r.created,
  };
}

function mapCSPRSupply(s: CSPRSupplyAPI): CSPRSupply {
  return {
    total: s.total,
    circulating: s.circulating,
    staked: s.staked,
    stakedDifferingFromCirculating: s.staked_differing_from_circulating,
    timestamp: s.timestamp,
  };
}

function mapDelegation(d: DelegationAPI): Delegation {
  return {
    publicKey: d.public_key,
    validatorPublicKey: d.validator_public_key,
    stake: d.stake,
    bondingPurse: d.bonding_purse,
  };
}

function mapBidder(b: BidderAPI): Bidder {
  return {
    publicKey: b.public_key,
    bid: b.bid,
    eraId: b.era_id,
    selfStake: b.self_stake,
    selfStakeChange: b.self_stake_change,
    delegatorsCount: b.delegators_count,
    delegatorsCountChange: b.delegators_count_change,
    delegatorsStake: b.delegators_stake,
    delegatorsStakeChange: b.delegators_stake_change,
    inactive: b.inactive,
    isNew: b.is_new,
    fee: b.fee,
  };
}

// ============ Query String Builder ============

function buildQueryString(params?: Record<string, unknown>): string {
  if (!params) return "";
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  });
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
}

// ============ CSPR.cloud REST API Client ============

export class CSPRCloudClient {
  private axiosInstance: AxiosInstance;

  constructor(proxy: ICsprCloudProxy) {
    this.axiosInstance = axios.create({
      baseURL: CASPER_CLOUD_ENDPOINT,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Intercept requests to use proxy.fetch
    this.axiosInstance.interceptors.request.use(async (config) => {
      const url = `${config.baseURL}${config.url}`;
      const response = await proxy.fetch(url, {
        method: config.method?.toUpperCase() || "GET",
        headers: config.headers as Record<string, string>,
        body: config.data ? JSON.stringify(config.data) : undefined,
      });

      if (response.error) {
        throw new Error(response.error.message || "API Error");
      }

      // Axios expects the response to be handled in response interceptor
      // So we store the data in a custom property
      (config as any).__proxyResponse = response.data;
      return config;
    });

    // Intercept responses to return proxy data
    this.axiosInstance.interceptors.response.use(
      (response) => {
        const proxyResponse = (response.config as any).__proxyResponse;
        if (proxyResponse) {
          response.data = proxyResponse;
        }
        return response;
      },
      (error) => Promise.reject(error)
    );
  }

  // ============ Validators ============

  async getValidators(params?: ValidatorsQueryParams): Promise<{
    data: Validator[];
    pageCount: number;
    itemCount: number;
  }> {
    const response = await this.axiosInstance.get<PaginatedResponse<ValidatorAPI>>(
      `/validators${buildQueryString(params)}`
    );
    return {
      data: response.data.data.map(mapValidator),
      pageCount: response.data.page_count,
      itemCount: response.data.item_count,
    };
  }

  async getValidator(publicKey: string): Promise<Validator> {
    const response = await this.axiosInstance.get<SingleResponse<ValidatorAPI>>(
      `/validators/${publicKey}`
    );
    return mapValidator(response.data.data);
  }

  async getValidatorPerformance(
    publicKey: string,
    params?: { page?: number; page_size?: number }
  ): Promise<ValidatorPerformance[]> {
    const response = await this.axiosInstance.get<PaginatedResponse<ValidatorPerformanceAPI>>(
      `/validators/${publicKey}/performance${buildQueryString(params)}`
    );
    return response.data.data.map(mapValidatorPerformance);
  }

  async getValidatorRewards(
    publicKey: string,
    params?: { page?: number; page_size?: number }
  ): Promise<ValidatorReward[]> {
    const response = await this.axiosInstance.get<PaginatedResponse<ValidatorRewardAPI>>(
      `/validators/${publicKey}/rewards${buildQueryString(params)}`
    );
    return response.data.data.map(mapValidatorReward);
  }

  async getValidatorTotalRewards(publicKey: string): Promise<string> {
    const response = await this.axiosInstance.get<{ data: string }>(
      `/validators/${publicKey}/total-rewards`
    );
    return response.data.data;
  }

  async getValidatorDelegations(
    publicKey: string,
    params?: { page?: number; page_size?: number }
  ): Promise<Delegation[]> {
    const response = await this.axiosInstance.get<PaginatedResponse<DelegationAPI>>(
      `/validators/${publicKey}/delegations${buildQueryString(params)}`
    );
    return response.data.data.map(mapDelegation);
  }

  // ============ Accounts ============

  async getAccount(publicKey: string): Promise<Account> {
    const response = await this.axiosInstance.get<SingleResponse<AccountAPI>>(
      `/accounts/${publicKey}`
    );
    return mapAccount(response.data.data);
  }

  async getAccounts(params?: AccountQueryParams): Promise<{
    data: Account[];
    pageCount: number;
    itemCount: number;
  }> {
    const response = await this.axiosInstance.get<PaginatedResponse<AccountAPI>>(
      `/accounts${buildQueryString(params)}`
    );
    return {
      data: response.data.data.map(mapAccount),
      pageCount: response.data.page_count,
      itemCount: response.data.item_count,
    };
  }

  async getAccountInfo(accountHash: string): Promise<AccountInfo> {
    const response = await this.axiosInstance.get<SingleResponse<AccountInfoAPI>>(
      `/account-info/${accountHash}`
    );
    return response.data.data;
  }

  async getAccountDelegations(
    publicKey: string,
    params?: { page?: number; page_size?: number }
  ): Promise<Delegation[]> {
    const response = await this.axiosInstance.get<PaginatedResponse<DelegationAPI>>(
      `/accounts/${publicKey}/delegations${buildQueryString(params)}`
    );
    return response.data.data.map(mapDelegation);
  }

  // ============ Blocks ============

  async getBlocks(params?: BlocksQueryParams): Promise<{
    data: Block[];
    pageCount: number;
    itemCount: number;
  }> {
    const response = await this.axiosInstance.get<PaginatedResponse<BlockAPI>>(
      `/blocks${buildQueryString(params)}`
    );
    return {
      data: response.data.data.map(mapBlock),
      pageCount: response.data.page_count,
      itemCount: response.data.item_count,
    };
  }

  async getBlock(hashOrHeight: string | number): Promise<Block> {
    const response = await this.axiosInstance.get<SingleResponse<BlockAPI>>(
      `/blocks/${hashOrHeight}`
    );
    return mapBlock(response.data.data);
  }

  async getLatestBlock(): Promise<Block> {
    const response = await this.axiosInstance.get<PaginatedResponse<BlockAPI>>(
      `/blocks?page=1&page_size=1&order_direction=DESC`
    );
    if (response.data.data.length === 0) {
      throw new Error("No blocks found");
    }
    return mapBlock(response.data.data[0]);
  }

  // ============ Auction Metrics ============

  async getAuctionMetrics(eraId?: number): Promise<AuctionMetrics> {
    const endpoint = eraId !== undefined
      ? `/auction-metrics/${eraId}`
      : `/auction-metrics`;
    const response = await this.axiosInstance.get<SingleResponse<AuctionMetricsAPI>>(endpoint);
    return mapAuctionMetrics(response.data.data);
  }

  // ============ Bidders ============

  async getBidders(params?: { page?: number; page_size?: number; is_active?: boolean }): Promise<{
    data: Bidder[];
    pageCount: number;
    itemCount: number;
  }> {
    const response = await this.axiosInstance.get<PaginatedResponse<BidderAPI>>(
      `/bidders${buildQueryString(params)}`
    );
    return {
      data: response.data.data.map(mapBidder),
      pageCount: response.data.page_count,
      itemCount: response.data.item_count,
    };
  }

  async getBidder(publicKey: string): Promise<Bidder> {
    const response = await this.axiosInstance.get<SingleResponse<BidderAPI>>(
      `/bidders/${publicKey}`
    );
    return mapBidder(response.data.data);
  }

  // ============ CSPR Rate ============

  async getCSPRRate(currencyId: string = "1"): Promise<CSPRRate> {
    const response = await this.axiosInstance.get<SingleResponse<CSPRRateAPI>>(
      `/rates/${currencyId}/amount`
    );
    return mapCSPRRate(response.data.data);
  }

  async getCSPRRates(): Promise<CSPRRate[]> {
    const response = await this.axiosInstance.get<PaginatedResponse<CSPRRateAPI>>(`/rates`);
    return response.data.data.map(mapCSPRRate);
  }

  // ============ CSPR Supply ============

  async getCSPRSupply(): Promise<CSPRSupply> {
    const response = await this.axiosInstance.get<SingleResponse<CSPRSupplyAPI>>(`/supply`);
    return mapCSPRSupply(response.data.data);
  }
}

// ============ Factory Function ============

export function createCSPRCloudClient(proxy: ICsprCloudProxy): CSPRCloudClient {
  return new CSPRCloudClient(proxy);
}

// ============ Re-export Types ============

export {
  type Validator,
  type ValidatorPerformance,
  type ValidatorReward,
  type Account,
  type AccountInfo,
  type Block,
  type AuctionMetrics,
  type CSPRRate,
  type CSPRSupply,
  type Delegation,
  type Bidder,
  type ValidatorsQueryParams,
  type AccountQueryParams,
  type BlocksQueryParams,
};
