"use client";

import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { apiClient } from "@/libs/api";
import type { ValidatorData } from "@/types/core";

type HookOptions<TData = unknown, TError = Error> = Omit<
  UseQueryOptions<TData, TError>,
  "queryKey" | "queryFn"
>;

interface ValidatorRegistryResponse {
  network_p_avg: number | null;
  last_update_era: number | null;
  validator: ValidatorData | null;
}

/**
 * Get validator data from ValidatorRegistry contract
 */
export function useGetValidator(
  validatorPublicKey: string,
  options?: HookOptions<ValidatorData | null>
) {
  return useQuery({
    queryKey: ["validators", validatorPublicKey],
    queryFn: async () => {
      const { data } = await apiClient.get<ValidatorData>(
        `/stayer/validators/${validatorPublicKey}`
      );
      return data;
    },
    enabled: !!validatorPublicKey,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
}

/**
 * Get network P average from ValidatorRegistry contract
 */
export function useGetNetworkPAvg(options?: HookOptions<number>) {
  return useQuery({
    queryKey: ["validator-registry", "network-p-avg"],
    queryFn: async () => {
      const { data } = await apiClient.get<ValidatorRegistryResponse>(
        "/stayer/validator-registry"
      );
      return data.network_p_avg ?? 0;
    },
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

/**
 * Get last update era from ValidatorRegistry contract
 */
export function useGetLastUpdateEra(options?: HookOptions<number>) {
  return useQuery({
    queryKey: ["validator-registry", "last-update-era"],
    queryFn: async () => {
      const { data } = await apiClient.get<ValidatorRegistryResponse>(
        "/stayer/validator-registry"
      );
      return data.last_update_era ?? 0;
    },
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

/**
 * Get full validator registry state
 */
export function useGetValidatorRegistryState(
  options?: HookOptions<ValidatorRegistryResponse>
) {
  return useQuery({
    queryKey: ["validator-registry", "state"],
    queryFn: async () => {
      const { data } = await apiClient.get<ValidatorRegistryResponse>(
        "/stayer/validator-registry"
      );
      return data;
    },
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

/**
 * Check if a validator is valid in the registry
 * Based on contract logic: p_score > 0 && is_active && era not stale
 */
export function useIsValidValidator(
  validatorPublicKey: string,
  currentEra: number,
  options?: HookOptions<boolean>
) {
  const { data: lastUpdateEra } = useGetLastUpdateEra();
  const { data: validatorData } = useGetValidator(validatorPublicKey);

  const STALE_DATA_ERAS = 3; // From contract

  return useQuery({
    queryKey: [
      "validator-registry",
      "is-valid",
      validatorPublicKey,
      currentEra,
    ],
    queryFn: async () => {
      if (!validatorData) return false;

      const isActive = validatorData.is_active;
      const pScore = validatorData.p_score;
      const dataAge = currentEra - (lastUpdateEra || 0);

      return pScore > 0 && isActive && dataAge <= STALE_DATA_ERAS;
    },
    enabled:
      !!validatorPublicKey && currentEra > 0 && validatorData !== undefined,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}
