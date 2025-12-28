import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { useClickRef } from "@make-software/csprclick-ui";
import { CLPublicKey, CLValueBuilder, RuntimeArgs } from "casper-js-sdk";
import { VALIDATOR_REGISTRY_CONTRACT } from "@/configs/constants";

type ValidatorData = {
  fee: number;
  is_active: boolean;
  decay_factor: number;
  p_score: number;
  updated_era: number;
};

type QueryHooksOptions<TData = unknown, TError = Error> = {
  options?: Omit<UseQueryOptions<TData, TError>, "queryKey" | "queryFn">;
};

export function useGetValidator(
  validatorPublicKey: string,
  { options }: QueryHooksOptions<ValidatorData | null> = {}
) {
  const clickRef = useClickRef();

  return useQuery({
    queryKey: ["validator-registry", "validator", validatorPublicKey],
    queryFn: async () => {
      if (!clickRef) throw new Error("Click ref not initialized");

      const result = await clickRef.callEntrypoint(
        RuntimeArgs.fromMap({
          pubkey: CLValueBuilder.key(CLPublicKey.fromHex(validatorPublicKey)),
        }),
        {
          entryPoint: "get_validator",
          contractHash: VALIDATOR_REGISTRY_CONTRACT,
        }
      );

      return result as ValidatorData | null;
    },
    enabled: !!clickRef && !!validatorPublicKey,
    ...options,
  });
}

export function useGetNetworkPAvg({ options }: QueryHooksOptions<number> = {}) {
  const clickRef = useClickRef();

  return useQuery({
    queryKey: ["validator-registry", "network-p-avg"],
    queryFn: async () => {
      if (!clickRef) throw new Error("Click ref not initialized");

      const result = await clickRef.callEntrypoint(
        RuntimeArgs.fromMap({}),
        {
          entryPoint: "get_network_p_avg",
          contractHash: VALIDATOR_REGISTRY_CONTRACT,
        }
      );

      return result as number;
    },
    enabled: !!clickRef,
    ...options,
  });
}

export function useGetLastUpdateEra({ options }: QueryHooksOptions<number> = {}) {
  const clickRef = useClickRef();

  return useQuery({
    queryKey: ["validator-registry", "last-update-era"],
    queryFn: async () => {
      if (!clickRef) throw new Error("Click ref not initialized");

      const result = await clickRef.callEntrypoint(
        RuntimeArgs.fromMap({}),
        {
          entryPoint: "get_last_update_era",
          contractHash: VALIDATOR_REGISTRY_CONTRACT,
        }
      );

      return result as number;
    },
    enabled: !!clickRef,
    ...options,
  });
}

export function useIsValidValidator(
  validatorPublicKey: string,
  currentEra: number,
  { options }: QueryHooksOptions<boolean> = {}
) {
  const clickRef = useClickRef();

  return useQuery({
    queryKey: ["validator-registry", "is-valid", validatorPublicKey, currentEra],
    queryFn: async () => {
      if (!clickRef) throw new Error("Click ref not initialized");

      const result = await clickRef.callEntrypoint(
        RuntimeArgs.fromMap({
          pubkey: CLValueBuilder.key(CLPublicKey.fromHex(validatorPublicKey)),
          current_era: CLValueBuilder.u64(currentEra),
        }),
        {
          entryPoint: "is_valid",
          contractHash: VALIDATOR_REGISTRY_CONTRACT,
        }
      );

      return result as boolean;
    },
    enabled: !!clickRef && !!validatorPublicKey && currentEra > 0,
    ...options,
  });
}
