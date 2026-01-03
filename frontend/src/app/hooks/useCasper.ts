"use client";

import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { csprApiClient } from "@/libs/cspr-cloud";
import {
  Account,
  AuctionMetrics,
  Block,
  Validator,
  PaginatedResponse,
  SingleResponse,
  ValidatorsQueryParams,
  BlocksQueryParams,
  Delegation,
  DelegatorReward,
  ValidatorReward,
} from "@/types/cspr";

// Re-export types for convenience
export type {
  Account,
  AuctionMetrics,
  Block,
  Validator,
  Delegation,
  DelegatorReward,
  ValidatorReward,
  PaginatedResponse,
  SingleResponse,
} from "@/types/cspr";

// ============ Common Types ============

type HookOptions<TData = unknown, TError = Error> = Omit<
  UseQueryOptions<TData, TError>,
  "queryKey" | "queryFn"
>;

// ============ Validators ============

export type ValidatorsPayload = ValidatorsQueryParams & {
  includes?: string; // e.g. "account_info,average_performance,cspr_name"
};

export function useGetValidators(
  payload: ValidatorsPayload = {},
  options?: HookOptions<PaginatedResponse<Validator>>
) {
  const {
    era_id,
    public_key,
    is_active,
    page = 1,
    page_size = 100,
    order_by = "total_stake",
    order_direction = "DESC",
    includes,
  } = payload;

  return useQuery({
    queryKey: ["casper", "validators", payload],
    queryFn: async () => {
      // If no era_id, get current era first
      let eraId = era_id;
      if (!eraId) {
        const auctionRes = await csprApiClient.get<SingleResponse<AuctionMetrics>>(
          "/auction-metrics"
        );
        eraId = auctionRes.data.data.current_era_id;
      }
      console.log("Current Era ID:", eraId);
      const params: Record<string, any> = {
        era_id: eraId,
        page,
        page_size,
        order_by,
        order_direction,
      };

      if (public_key) params.public_key = public_key;
      if (is_active !== undefined) params.is_active = is_active;
      if (includes) params.includes = includes;

      const result = await csprApiClient.get<PaginatedResponse<Validator>>(
        "/validators",
        { params }
      );

      return result.data;
    },
    staleTime: 60000,
    ...options,
  });
}

export function useGetValidator(
  publicKey: string,
  payload: Omit<ValidatorsPayload, "public_key"> = {},
  options?: HookOptions<Validator | null>
) {
  return useQuery({
    queryKey: ["casper", "validator", publicKey, payload],
    queryFn: async () => {
      // Get current era if not provided
      let eraId = payload.era_id;
      if (!eraId) {
        const auctionRes = await csprApiClient.get<SingleResponse<AuctionMetrics>>(
          "/auction-metrics"
        );
        eraId = auctionRes.data.data.current_era_id;
      }

      const params: Record<string, any> = {
        era_id: eraId,
        public_key: publicKey,
      };
      if (payload.includes) params.includes = payload.includes;

      const result = await csprApiClient.get<PaginatedResponse<Validator>>(
        "/validators",
        { params }
      );

      return result.data.data.length > 0 ? result.data.data[0] : null;
    },
    enabled: !!publicKey,
    staleTime: 60000,
    ...options,
  });
}

// ============ Auction Metrics / Era ============

export function useGetAuctionMetrics(
  options?: HookOptions<AuctionMetrics>
) {
  return useQuery({
    queryKey: ["casper", "auction-metrics"],
    queryFn: async () => {
      const result = await csprApiClient.get<SingleResponse<AuctionMetrics>>(
        "/auction-metrics"
      );
      return result.data.data;
    },
    staleTime: 30000,
    ...options,
  });
}

export function useGetCurrentEra(options?: HookOptions<number>) {
  return useQuery({
    queryKey: ["casper", "current-era"],
    queryFn: async () => {
      const result = await csprApiClient.get<SingleResponse<AuctionMetrics>>(
        "/auction-metrics"
      );
      return result.data.data.current_era_id;
    },
    staleTime: 30000,
    ...options,
  });
}

// ============ Account ============

export type AccountPayload = {
  includes?: string; // e.g. "delegations,unbonding_delegations"
};

export function useGetAccount(
  accountIdentifier: string, // public_key or account_hash
  payload: AccountPayload = {},
  options?: HookOptions<Account | null>
) {
  return useQuery({
    queryKey: ["casper", "account", accountIdentifier, payload],
    queryFn: async () => {
      try {
        const params: Record<string, any> = {};
        if (payload.includes) params.includes = payload.includes;

        const result = await csprApiClient.get<SingleResponse<Account>>(
          `/accounts/${accountIdentifier}`,
          { params }
        );
        return result.data.data;
      } catch {
        return null;
      }
    },
    enabled: !!accountIdentifier,
    staleTime: 30000,
    ...options,
  });
}

// Helper to format balance
export function formatBalance(balance: string): string {
  const balanceBigInt = BigInt(balance || "0");
  return (Number(balanceBigInt) / 1e9).toFixed(4);
}

// ============ Block ============

export type BlockPayload = BlocksQueryParams;

export function useGetBlocks(
  payload: BlockPayload = {},
  options?: HookOptions<PaginatedResponse<Block>>
) {
  const {
    page = 1,
    page_size = 10,
    order_by = "block_height",
    order_direction = "DESC",
    proposer,
    era_id,
    hash,
    includes,
  } = payload;

  return useQuery({
    queryKey: ["casper", "blocks", payload],
    queryFn: async () => {
      const params: Record<string, any> = {
        page,
        page_size,
        order_by,
        order_direction,
      };

      if (proposer) params.proposer_public_key = proposer;
      if (era_id) params.era_id = era_id;
      if (hash) params.block_hash = hash;
      if (includes) params.includes = includes;

      const result = await csprApiClient.get<PaginatedResponse<Block>>(
        "/blocks",
        { params }
      );
      return result.data;
    },
    staleTime: 10000,
    ...options,
  });
}

export function useGetLatestBlock(
  payload: Omit<BlockPayload, "page" | "page_size"> = {},
  options?: HookOptions<Block | null>
) {
  return useQuery({
    queryKey: ["casper", "latest-block", payload],
    queryFn: async () => {
      const params: Record<string, any> = {
        page: 1,
        page_size: 1,
        order_by: "block_height",
        order_direction: "DESC",
      };

      if (payload.includes) params.includes = payload.includes;

      const result = await csprApiClient.get<PaginatedResponse<Block>>(
        "/blocks",
        { params }
      );

      return result.data.data.length > 0 ? result.data.data[0] : null;
    },
    staleTime: 10000,
    ...options,
  });
}

// ============ Delegations ============

export type DelegationsPayload = {
  page?: number;
  page_size?: number;
  validator_public_key?: string;
  includes?: string; // e.g. "validator,delegator"
};

export function useGetAccountDelegations(
  publicKey: string,
  payload: DelegationsPayload = {},
  options?: HookOptions<PaginatedResponse<Delegation>>
) {
  const { page = 1, page_size = 100, validator_public_key, includes } = payload;

  return useQuery({
    queryKey: ["casper", "account-delegations", publicKey, payload],
    queryFn: async () => {
      const params: Record<string, any> = { page, page_size };
      if (validator_public_key) params.validator_public_key = validator_public_key;
      if (includes) params.includes = includes;

      const result = await csprApiClient.get<PaginatedResponse<Delegation>>(
        `/accounts/${publicKey}/delegations`,
        { params }
      );
      return result.data;
    },
    enabled: !!publicKey,
    staleTime: 60000,
    ...options,
  });
}

// ============ Rewards ============

export type RewardsPayload = {
  page?: number;
  page_size?: number;
};

export function useGetDelegatorRewards(
  publicKey: string,
  payload: RewardsPayload = {},
  options?: HookOptions<PaginatedResponse<DelegatorReward>>
) {
  const { page = 1, page_size = 100 } = payload;

  return useQuery({
    queryKey: ["casper", "delegator-rewards", publicKey, payload],
    queryFn: async () => {
      const result = await csprApiClient.get<PaginatedResponse<DelegatorReward>>(
        `/delegators/${publicKey}/rewards`,
        { params: { page, page_size } }
      );
      return result.data;
    },
    enabled: !!publicKey,
    staleTime: 60000,
    ...options,
  });
}

export function useGetValidatorRewards(
  publicKey: string,
  payload: RewardsPayload = {},
  options?: HookOptions<PaginatedResponse<ValidatorReward>>
) {
  const { page = 1, page_size = 100 } = payload;

  return useQuery({
    queryKey: ["casper", "validator-rewards", publicKey, payload],
    queryFn: async () => {
      const result = await csprApiClient.get<PaginatedResponse<ValidatorReward>>(
        `/validators/${publicKey}/rewards`,
        { params: { page, page_size } }
      );
      return result.data;
    },
    enabled: !!publicKey,
    staleTime: 60000,
    ...options,
  });
}
