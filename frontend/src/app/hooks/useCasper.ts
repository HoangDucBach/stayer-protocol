import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { useClickRef } from "@make-software/csprclick-ui";
import { useMemo } from "react";
import {
  createCSPRCloudClient,
  type Validator,
  type ValidatorPerformance,
  type ValidatorReward,
  type Account,
  type Block,
  type AuctionMetrics,
  type CSPRRate,
  type CSPRSupply,
  type Delegation,
  type Bidder,
  type ValidatorsQueryParams,
} from "@/libs/cspr-cloud";

// ============ Types ============

type QueryHooksOptions<TData = unknown, TError = Error> = {
  options?: Omit<UseQueryOptions<TData, TError>, "queryKey" | "queryFn">;
};

// ============ Hook to create client ============

function useCSPRCloudClient() {
  const clickRef = useClickRef();

  return useMemo(() => {
    if (!clickRef) return null;
    const proxy = clickRef.getCsprCloudProxy();
    if (!proxy) return null;
    proxy.fetch("/validators").then((res) => console.log("abc", res));
    return createCSPRCloudClient(proxy);
  }, [clickRef]);
}

// ============ Validators Hooks ============

export function useGetValidators(
  params?: ValidatorsQueryParams,
  {
    options,
  }: QueryHooksOptions<{
    data: Validator[];
    pageCount: number;
    itemCount: number;
  }> = {}
) {
  const client = useCSPRCloudClient();

  return useQuery({
    queryKey: ["casper", "validators", params],
    queryFn: () => client!.getValidators(params),
    enabled: !!client,
    staleTime: 60000,
    ...options,
  });
}

export function useGetValidator(
  publicKey: string,
  { options }: QueryHooksOptions<Validator | null> = {}
) {
  const client = useCSPRCloudClient();

  return useQuery({
    queryKey: ["casper", "validator", publicKey],
    queryFn: async () => {
      try {
        return await client!.getValidator(publicKey);
      } catch {
        return null;
      }
    },
    enabled: !!client && !!publicKey,
    staleTime: 60000,
    ...options,
  });
}

export function useGetValidatorPerformance(
  publicKey: string,
  params?: { page?: number; page_size?: number },
  { options }: QueryHooksOptions<ValidatorPerformance[]> = {}
) {
  const client = useCSPRCloudClient();

  return useQuery({
    queryKey: ["casper", "validator-performance", publicKey, params],
    queryFn: () => client!.getValidatorPerformance(publicKey, params),
    enabled: !!client && !!publicKey,
    staleTime: 60000,
    ...options,
  });
}

export function useGetValidatorRewards(
  publicKey: string,
  params?: { page?: number; page_size?: number },
  { options }: QueryHooksOptions<ValidatorReward[]> = {}
) {
  const client = useCSPRCloudClient();

  return useQuery({
    queryKey: ["casper", "validator-rewards", publicKey, params],
    queryFn: () => client!.getValidatorRewards(publicKey, params),
    enabled: !!client && !!publicKey,
    staleTime: 60000,
    ...options,
  });
}

export function useGetValidatorTotalRewards(
  publicKey: string,
  { options }: QueryHooksOptions<string> = {}
) {
  const client = useCSPRCloudClient();

  return useQuery({
    queryKey: ["casper", "validator-total-rewards", publicKey],
    queryFn: () => client!.getValidatorTotalRewards(publicKey),
    enabled: !!client && !!publicKey,
    staleTime: 60000,
    ...options,
  });
}

export function useGetValidatorDelegations(
  publicKey: string,
  params?: { page?: number; page_size?: number },
  { options }: QueryHooksOptions<Delegation[]> = {}
) {
  const client = useCSPRCloudClient();

  return useQuery({
    queryKey: ["casper", "validator-delegations", publicKey, params],
    queryFn: () => client!.getValidatorDelegations(publicKey, params),
    enabled: !!client && !!publicKey,
    staleTime: 60000,
    ...options,
  });
}

// ============ Account Hooks ============

export function useGetAccount(
  publicKey: string,
  { options }: QueryHooksOptions<Account | null> = {}
) {
  const client = useCSPRCloudClient();

  return useQuery({
    queryKey: ["casper", "account", publicKey],
    queryFn: async () => {
      try {
        return await client!.getAccount(publicKey);
      } catch {
        return null;
      }
    },
    enabled: !!client && !!publicKey,
    staleTime: 30000,
    ...options,
  });
}

export function useGetAccountBalance(
  publicKey: string,
  {
    options,
  }: QueryHooksOptions<{
    balance: string;
    balanceFormatted: string;
  } | null> = {}
) {
  const client = useCSPRCloudClient();

  return useQuery({
    queryKey: ["casper", "account-balance", publicKey],
    queryFn: async () => {
      try {
        const account = await client!.getAccount(publicKey);
        const balance = account.balance || "0";
        const balanceBigInt = BigInt(balance);
        const formatted = (Number(balanceBigInt) / 1e9).toFixed(4);
        return {
          balance,
          balanceFormatted: formatted,
        };
      } catch {
        return null;
      }
    },
    enabled: !!client && !!publicKey,
    staleTime: 30000,
    ...options,
  });
}

export function useGetAccountDelegations(
  publicKey: string,
  params?: { page?: number; page_size?: number },
  { options }: QueryHooksOptions<Delegation[]> = {}
) {
  const client = useCSPRCloudClient();

  return useQuery({
    queryKey: ["casper", "account-delegations", publicKey, params],
    queryFn: () => client!.getAccountDelegations(publicKey, params),
    enabled: !!client && !!publicKey,
    staleTime: 60000,
    ...options,
  });
}

// ============ Block Hooks ============

export function useGetLatestBlock({ options }: QueryHooksOptions<Block> = {}) {
  const client = useCSPRCloudClient();

  return useQuery({
    queryKey: ["casper", "latest-block"],
    queryFn: () => client!.getLatestBlock(),
    enabled: !!client,
    staleTime: 10000,
    ...options,
  });
}

export function useGetBlock(
  hashOrHeight: string | number,
  { options }: QueryHooksOptions<Block | null> = {}
) {
  const client = useCSPRCloudClient();

  return useQuery({
    queryKey: ["casper", "block", hashOrHeight],
    queryFn: async () => {
      try {
        return await client!.getBlock(hashOrHeight);
      } catch {
        return null;
      }
    },
    enabled: !!client && !!hashOrHeight,
    staleTime: Infinity, // Blocks are immutable
    ...options,
  });
}

// ============ Auction Metrics Hooks ============

export function useGetAuctionMetrics(
  eraId?: number,
  { options }: QueryHooksOptions<AuctionMetrics> = {}
) {
  const client = useCSPRCloudClient();

  return useQuery({
    queryKey: ["casper", "auction-metrics", eraId],
    queryFn: () => client!.getAuctionMetrics(eraId),
    enabled: !!client,
    staleTime: 60000,
    ...options,
  });
}

export function useGetCurrentEra({ options }: QueryHooksOptions<number> = {}) {
  const client = useCSPRCloudClient();

  return useQuery({
    queryKey: ["casper", "current-era"],
    queryFn: async () => {
      const metrics = await client!.getAuctionMetrics();
      return metrics.eraId;
    },
    enabled: !!client,
    staleTime: 30000,
    ...options,
  });
}

// ============ Bidders Hooks ============

export function useGetBidders(
  params?: { page?: number; page_size?: number; is_active?: boolean },
  {
    options,
  }: QueryHooksOptions<{
    data: Bidder[];
    pageCount: number;
    itemCount: number;
  }> = {}
) {
  const client = useCSPRCloudClient();

  return useQuery({
    queryKey: ["casper", "bidders", params],
    queryFn: () => client!.getBidders(params),
    enabled: !!client,
    staleTime: 60000,
    ...options,
  });
}

export function useGetBidder(
  publicKey: string,
  { options }: QueryHooksOptions<Bidder | null> = {}
) {
  const client = useCSPRCloudClient();

  return useQuery({
    queryKey: ["casper", "bidder", publicKey],
    queryFn: async () => {
      try {
        return await client!.getBidder(publicKey);
      } catch {
        return null;
      }
    },
    enabled: !!client && !!publicKey,
    staleTime: 60000,
    ...options,
  });
}

// ============ CSPR Rate Hooks ============

export function useGetCSPRRate(
  currencyId: string = "1",
  { options }: QueryHooksOptions<CSPRRate> = {}
) {
  const client = useCSPRCloudClient();

  return useQuery({
    queryKey: ["casper", "cspr-rate", currencyId],
    queryFn: () => client!.getCSPRRate(currencyId),
    enabled: !!client,
    staleTime: 60000,
    ...options,
  });
}

export function useGetCSPRRates({
  options,
}: QueryHooksOptions<CSPRRate[]> = {}) {
  const client = useCSPRCloudClient();

  return useQuery({
    queryKey: ["casper", "cspr-rates"],
    queryFn: () => client!.getCSPRRates(),
    enabled: !!client,
    staleTime: 60000,
    ...options,
  });
}

// ============ CSPR Supply Hooks ============

export function useGetCSPRSupply({
  options,
}: QueryHooksOptions<CSPRSupply> = {}) {
  const client = useCSPRCloudClient();

  return useQuery({
    queryKey: ["casper", "cspr-supply"],
    queryFn: () => client!.getCSPRSupply(),
    enabled: !!client,
    staleTime: 60000,
    ...options,
  });
}

// ============ Re-export types ============

export type {
  Validator,
  ValidatorPerformance,
  ValidatorReward,
  Account,
  Block,
  AuctionMetrics,
  CSPRRate,
  CSPRSupply,
  Delegation,
  Bidder,
  ValidatorsQueryParams,
};
