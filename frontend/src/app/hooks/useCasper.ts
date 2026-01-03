import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import {
  Account,
  AuctionMetrics,
  Block,
  Validator,
} from "@/types/cspr";

// Re-export for backward compatibility
export type { Validator, Account, Block, AuctionMetrics } from "@/types/cspr";

// ============ Types ============

type QueryHooksOptions<TData = unknown, TError = Error> = {
  options?: Omit<UseQueryOptions<TData, TError>, "queryKey" | "queryFn">;
};

export type ValidatorsResponse = {
  data: Validator[];
  item_count: number;
  page_count: number;
  era_id: number;
};

export type EraResponse = {
  currentEra: number;
  auctionMetrics: AuctionMetrics;
};

export type AccountResponse = Account & {
  balanceFormatted: string;
};

export type BlockResponse = Block;

// ============ API Fetchers ============

async function fetchFromAPI<T>(endpoint: string): Promise<T> {
  const response = await fetch(endpoint);
  const json = await response.json();

  if (!response.ok) {
    throw new Error(json.error || "API Error");
  }

  return json.data;
}

// ============ Validators Hooks ============

// Get all validators for the current era
export function useGetValidators({
  options,
}: QueryHooksOptions<ValidatorsResponse> = {}) {
  return useQuery({
    queryKey: ["casper", "validators"],
    queryFn: async () => {
      const response = await fetch("/api/casper/validators");
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || "API Error");
      return json as ValidatorsResponse;
    },
    staleTime: 60000,
    ...options,
  });
}

// Get single validator by public key
export function useGetValidator(
  publicKey: string,
  { options }: QueryHooksOptions<Validator | null> = {}
) {
  return useQuery({
    queryKey: ["casper", "validator", publicKey],
    queryFn: async () => {
      const response = await fetch(
        `/api/casper/validators?public_key=${publicKey}`
      );
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || "API Error");
      const validators = json.data as Validator[];
      return validators.length > 0 ? validators[0] : null;
    },
    enabled: !!publicKey,
    staleTime: 60000,
    ...options,
  });
}

// ============ Era Hooks ============

export function useGetCurrentEra({ options }: QueryHooksOptions<number> = {}) {
  return useQuery({
    queryKey: ["casper", "current-era"],
    queryFn: async () => {
      const data = await fetchFromAPI<EraResponse>("/api/casper/era");
      return data.currentEra;
    },
    staleTime: 30000,
    ...options,
  });
}

export function useGetAuctionMetrics({
  options,
}: QueryHooksOptions<AuctionMetrics> = {}) {
  return useQuery({
    queryKey: ["casper", "auction-metrics"],
    queryFn: async () => {
      const data = await fetchFromAPI<EraResponse>("/api/casper/era");
      return data.auctionMetrics;
    },
    staleTime: 30000,
    ...options,
  });
}

// ============ Account Hooks ============

export function useGetAccount(
  publicKey: string,
  { options }: QueryHooksOptions<AccountResponse | null> = {}
) {
  return useQuery({
    queryKey: ["casper", "account", publicKey],
    queryFn: async () => {
      try {
        return await fetchFromAPI<AccountResponse>(
          `/api/casper/account?public_key=${publicKey}`
        );
      } catch {
        return null;
      }
    },
    enabled: !!publicKey,
    staleTime: 30000,
    ...options,
  });
}

// Alias for backward compatibility
export const useGetAccountBalance = useGetAccount;

// ============ Block Hooks ============

export function useGetLatestBlock({
  options,
}: QueryHooksOptions<BlockResponse> = {}) {
  return useQuery({
    queryKey: ["casper", "latest-block"],
    queryFn: () => fetchFromAPI<BlockResponse>("/api/casper/block"),
    staleTime: 10000,
    ...options,
  });
}

// Alias for backward compatibility
export const useGetLatestBlockInfo = useGetLatestBlock;
