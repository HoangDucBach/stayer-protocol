import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { useClickRef } from "@make-software/csprclick-ui";
import { PublicKey, HttpHandler, RpcClient } from "casper-js-sdk";
import { VALIDATOR_REGISTRY_CONTRACT } from "@/configs/constants";
import type { ValidatorData } from "@/types/core";

// Helper to create RPC client from cspr.click proxy
function createRpcClient(clickRef: ReturnType<typeof useClickRef>) {
  const proxy = clickRef?.getCsprCloudProxy();
  if (!proxy) throw new Error("CSPR.cloud proxy not available");

  const handler = new HttpHandler(proxy.RpcURL);
  handler.setCustomHeaders({ Authorization: proxy.RpcDigestToken });
  return new RpcClient(handler);
}

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

      const rpcClient = createRpcClient(clickRef);
      const contractKey = `hash-${VALIDATOR_REGISTRY_CONTRACT}`;

      try {
        // Get validator data from dictionary using public key as key
        const pubKey = PublicKey.fromHex(validatorPublicKey);
        const dictKey = pubKey.toHex();

        const result = await rpcClient.getDictionaryItemByIdentifier(null, {
          contractNamedKey: {
            key: contractKey,
            dictionaryName: "validators",
            dictionaryItemKey: dictKey,
          },
        });

        const storedValue = result.storedValue?.clValue;
        if (!storedValue) return null;

        // Parse validator data from CLValue map
        const mapValue = storedValue.map;
        if (mapValue) {
          return {
            fee: Number(mapValue.get("fee")?.ui32?.toString() || 0),
            is_active: mapValue.get("is_active")?.bool?.toString() === "true",
            decay_factor: Number(mapValue.get("decay_factor")?.ui64?.toString() || 0),
            p_score: Number(mapValue.get("p_score")?.ui64?.toString() || 0),
            updated_era: Number(mapValue.get("updated_era")?.ui64?.toString() || 0),
          } as ValidatorData;
        }

        // Fallback for simple value types
        return {
          fee: 0,
          is_active: true,
          decay_factor: 0,
          p_score: 0,
          updated_era: 0,
        } as ValidatorData;
      } catch {
        return null;
      }
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

      const rpcClient = createRpcClient(clickRef);
      const contractKey = `hash-${VALIDATOR_REGISTRY_CONTRACT}`;

      const result = await rpcClient.queryLatestGlobalState(contractKey, ["network_p_avg"]);
      return Number(result.storedValue?.clValue?.toString() || "0");
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

      const rpcClient = createRpcClient(clickRef);
      const contractKey = `hash-${VALIDATOR_REGISTRY_CONTRACT}`;

      const result = await rpcClient.queryLatestGlobalState(contractKey, ["last_update_era"]);
      return Number(result.storedValue?.clValue?.toString() || "0");
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

      // Get validator data and check if valid based on era and active status
      const rpcClient = createRpcClient(clickRef);
      const contractKey = `hash-${VALIDATOR_REGISTRY_CONTRACT}`;

      try {
        const pubKey = PublicKey.fromHex(validatorPublicKey);
        const dictKey = pubKey.toHex();

        const result = await rpcClient.getDictionaryItemByIdentifier(null, {
          contractNamedKey: {
            key: contractKey,
            dictionaryName: "validators",
            dictionaryItemKey: dictKey,
          },
        });

        const storedValue = result.storedValue?.clValue;
        if (!storedValue) return false;

        // Parse validator data from CLValue map
        const mapValue = storedValue.map;
        if (!mapValue) return false;

        // Check if validator is active and updated recently
        const isActive = mapValue.get("is_active")?.bool?.toString() === "true";
        const updatedEra = Number(mapValue.get("updated_era")?.ui64?.toString() || 0);

        // Valid if active and updated within a reasonable era range
        return isActive && (currentEra - updatedEra) <= 10;
      } catch {
        return false;
      }
    },
    enabled: !!clickRef && !!validatorPublicKey && currentEra > 0,
    ...options,
  });
}
