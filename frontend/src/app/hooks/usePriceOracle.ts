import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { useClickRef } from "@make-software/csprclick-ui";
import { HttpHandler, RpcClient } from "casper-js-sdk";
import { PRICE_ORACLE_CONTRACT } from "@/configs/constants";

// Helper to create RPC client from cspr.click proxy
function createRpcClient(clickRef: ReturnType<typeof useClickRef>) {
  const proxy = clickRef?.getCsprCloudProxy();
  if (!proxy) throw new Error("CSPR.cloud proxy not available");

  const handler = new HttpHandler(proxy.RpcURL);
  handler.setCustomHeaders({ Authorization: proxy.RpcDigestToken });
  return new RpcClient(handler);
}

type PriceData = {
  price: string;
  updated_at: number;
  round_id: number;
};

type QueryHooksOptions<TData = unknown, TError = Error> = {
  options?: Omit<UseQueryOptions<TData, TError>, "queryKey" | "queryFn">;
};

export function useGetPrice({ options }: QueryHooksOptions<string> = {}) {
  const clickRef = useClickRef();

  return useQuery({
    queryKey: ["price-oracle", "price"],
    queryFn: async () => {
      if (!clickRef) throw new Error("Click ref not initialized");

      const rpcClient = createRpcClient(clickRef);
      const contractKey = `hash-${PRICE_ORACLE_CONTRACT.replace("hash-", "")}`;

      const result = await rpcClient.queryLatestGlobalState(contractKey, ["price"]);
      return result.storedValue?.clValue?.toString() || "0";
    },
    enabled: !!clickRef,
    ...options,
  });
}

export function useGetLatestPriceData({ options }: QueryHooksOptions<PriceData> = {}) {
  const clickRef = useClickRef();

  return useQuery({
    queryKey: ["price-oracle", "latest-price-data"],
    queryFn: async () => {
      if (!clickRef) throw new Error("Click ref not initialized");

      const rpcClient = createRpcClient(clickRef);
      const contractKey = `hash-${PRICE_ORACLE_CONTRACT.replace("hash-", "")}`;

      // Query multiple named keys for price data
      const [priceResult, updatedAtResult, roundIdResult] = await Promise.all([
        rpcClient.queryLatestGlobalState(contractKey, ["price"]),
        rpcClient.queryLatestGlobalState(contractKey, ["updated_at"]),
        rpcClient.queryLatestGlobalState(contractKey, ["round_id"]),
      ]);

      return {
        price: priceResult.storedValue?.clValue?.toString() || "0",
        updated_at: Number(updatedAtResult.storedValue?.clValue?.toString() || "0"),
        round_id: Number(roundIdResult.storedValue?.clValue?.toString() || "0"),
      } as PriceData;
    },
    enabled: !!clickRef,
    ...options,
  });
}
