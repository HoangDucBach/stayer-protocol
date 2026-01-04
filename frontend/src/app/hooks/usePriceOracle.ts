"use client";

import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { apiClient } from "@/libs/api";

type PriceData = {
  price: string;
  updated_at: number;
  round_id: number;
};

interface OracleResponse {
  price_data: PriceData | null;
  max_age: number | null;
  fallback_price: string | null;
  use_fallback: boolean;
}

type QueryHooksOptions<TData = unknown, TError = Error> = {
  options?: Omit<UseQueryOptions<TData, TError>, "queryKey" | "queryFn">;
};

export function useGetPrice({ options }: QueryHooksOptions<string> = {}) {
  return useQuery({
    queryKey: ["price-oracle", "price"],
    queryFn: async () => {
      const { data } = await apiClient.get<OracleResponse>("/stayer/oracle");
      if (data.use_fallback && data.fallback_price) {
        return data.fallback_price;
      }
      return data.price_data?.price || "0";
    },
    ...options,
  });
}

export function useGetLatestPriceData({
  options,
}: QueryHooksOptions<PriceData> = {}) {
  return useQuery({
    queryKey: ["price-oracle", "latest-price-data"],
    queryFn: async () => {
      const { data } = await apiClient.get<OracleResponse>("/stayer/oracle");
      if (data.use_fallback && data.fallback_price) {
        return {
          price: data.fallback_price,
          updated_at: Date.now(),
          round_id: 0,
        };
      }
      return (
        data.price_data || {
          price: "0",
          updated_at: 0,
          round_id: 0,
        }
      );
    },
    ...options,
  });
}

export function useGetOracleState({
  options,
}: QueryHooksOptions<OracleResponse> = {}) {
  return useQuery({
    queryKey: ["price-oracle", "state"],
    queryFn: async () => {
      const { data } = await apiClient.get<OracleResponse>("/stayer/oracle");
      return data;
    },
    ...options,
  });
}

export function useIsPriceStale({ options }: QueryHooksOptions<boolean> = {}) {
  return useQuery({
    queryKey: ["price-oracle", "is-stale"],
    queryFn: async () => {
      const { data } = await apiClient.get<OracleResponse>("/stayer/oracle");
      if (data.use_fallback) return false;
      if (!data.price_data || !data.max_age) return true;

      const age = Date.now() / 1000 - data.price_data.updated_at;
      return age > data.max_age;
    },
    ...options,
  });
}
