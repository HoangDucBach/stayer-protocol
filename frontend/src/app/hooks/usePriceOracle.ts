import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { useClickRef } from "@make-software/csprclick-ui";
import { CLValueBuilder, RuntimeArgs } from "casper-js-sdk";
import { PRICE_ORACLE_CONTRACT } from "@/configs/constants";

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

      const result = await clickRef.callEntrypoint(
        RuntimeArgs.fromMap({}),
        {
          entryPoint: "get_price",
          contractHash: PRICE_ORACLE_CONTRACT,
        }
      );

      return result as string;
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

      const result = await clickRef.callEntrypoint(
        RuntimeArgs.fromMap({}),
        {
          entryPoint: "get_latest_price_data",
          contractHash: PRICE_ORACLE_CONTRACT,
        }
      );

      return result as PriceData;
    },
    enabled: !!clickRef,
    ...options,
  });
}
