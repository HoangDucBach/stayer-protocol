import { useClickRef } from "@make-software/csprclick-ui";
import { useMutation, useQuery, UseMutationOptions, UseQueryOptions } from "@tanstack/react-query";
import { CLValueBuilder, RuntimeArgs } from "casper-js-sdk";
import { YSCSPR_CONTRACT, CASPER_CHAIN_NAME } from "@/configs/constants";

type TransferPayload = {
  recipient: string;
  amount: string;
};

type ApprovePayload = {
  spender: string;
  amount: string;
};

type HooksOptions<TData = unknown, TError = Error> = {
  options?: Omit<UseMutationOptions<TData, TError>, "mutationFn">;
};

type QueryHooksOptions<TData = unknown, TError = Error> = {
  options?: Omit<UseQueryOptions<TData, TError>, "queryKey" | "queryFn">;
};

export function useTransfer({ options }: HooksOptions<string> = {}) {
  const clickRef = useClickRef();

  return useMutation({
    mutationFn: async ({ recipient, amount }: TransferPayload) => {
      if (!clickRef) throw new Error("Click ref not initialized");

      const deploy = await clickRef.makeDeploy(
        RuntimeArgs.fromMap({
          recipient: CLValueBuilder.byteArray(Buffer.from(recipient, "hex")),
          amount: CLValueBuilder.u256(amount),
        }),
        {
          entryPoint: "transfer",
          contractHash: YSCSPR_CONTRACT,
        },
        CASPER_CHAIN_NAME
      );

      const result = await clickRef.send(deploy);
      return result.deployHash;
    },
    ...options,
  });
}

export function useApprove({ options }: HooksOptions<string> = {}) {
  const clickRef = useClickRef();

  return useMutation({
    mutationFn: async ({ spender, amount }: ApprovePayload) => {
      if (!clickRef) throw new Error("Click ref not initialized");

      const deploy = await clickRef.makeDeploy(
        RuntimeArgs.fromMap({
          spender: CLValueBuilder.byteArray(Buffer.from(spender, "hex")),
          amount: CLValueBuilder.u256(amount),
        }),
        {
          entryPoint: "approve",
          contractHash: YSCSPR_CONTRACT,
        },
        CASPER_CHAIN_NAME
      );

      const result = await clickRef.send(deploy);
      return result.deployHash;
    },
    ...options,
  });
}

export function useBalanceOf(
  owner: string,
  { options }: QueryHooksOptions<string> = {}
) {
  const clickRef = useClickRef();

  return useQuery({
    queryKey: ["yscspr", "balance", owner],
    queryFn: async () => {
      if (!clickRef) throw new Error("Click ref not initialized");

      const result = await clickRef.callEntrypoint(
        RuntimeArgs.fromMap({
          address: CLValueBuilder.byteArray(Buffer.from(owner, "hex")),
        }),
        {
          entryPoint: "balance_of",
          contractHash: YSCSPR_CONTRACT,
        }
      );

      return result as string;
    },
    enabled: !!clickRef && !!owner,
    ...options,
  });
}

export function useTotalSupply({ options }: QueryHooksOptions<string> = {}) {
  const clickRef = useClickRef();

  return useQuery({
    queryKey: ["yscspr", "total-supply"],
    queryFn: async () => {
      if (!clickRef) throw new Error("Click ref not initialized");

      const result = await clickRef.callEntrypoint(
        RuntimeArgs.fromMap({}),
        {
          entryPoint: "total_supply",
          contractHash: YSCSPR_CONTRACT,
        }
      );

      return result as string;
    },
    enabled: !!clickRef,
    ...options,
  });
}

export function useAllowance(
  owner: string,
  spender: string,
  { options }: QueryHooksOptions<string> = {}
) {
  const clickRef = useClickRef();

  return useQuery({
    queryKey: ["yscspr", "allowance", owner, spender],
    queryFn: async () => {
      if (!clickRef) throw new Error("Click ref not initialized");

      const result = await clickRef.callEntrypoint(
        RuntimeArgs.fromMap({
          owner: CLValueBuilder.byteArray(Buffer.from(owner, "hex")),
          spender: CLValueBuilder.byteArray(Buffer.from(spender, "hex")),
        }),
        {
          entryPoint: "allowance",
          contractHash: YSCSPR_CONTRACT,
        }
      );

      return result as string;
    },
    enabled: !!clickRef && !!owner && !!spender,
    ...options,
  });
}

export function useTokenName({ options }: QueryHooksOptions<string> = {}) {
  const clickRef = useClickRef();

  return useQuery({
    queryKey: ["yscspr", "name"],
    queryFn: async () => {
      if (!clickRef) throw new Error("Click ref not initialized");

      const result = await clickRef.callEntrypoint(
        RuntimeArgs.fromMap({}),
        {
          entryPoint: "name",
          contractHash: YSCSPR_CONTRACT,
        }
      );

      return result as string;
    },
    enabled: !!clickRef,
    staleTime: Infinity,
    ...options,
  });
}

export function useTokenSymbol({ options }: QueryHooksOptions<string> = {}) {
  const clickRef = useClickRef();

  return useQuery({
    queryKey: ["yscspr", "symbol"],
    queryFn: async () => {
      if (!clickRef) throw new Error("Click ref not initialized");

      const result = await clickRef.callEntrypoint(
        RuntimeArgs.fromMap({}),
        {
          entryPoint: "symbol",
          contractHash: YSCSPR_CONTRACT,
        }
      );

      return result as string;
    },
    enabled: !!clickRef,
    staleTime: Infinity,
    ...options,
  });
}

export function useTokenDecimals({ options }: QueryHooksOptions<number> = {}) {
  const clickRef = useClickRef();

  return useQuery({
    queryKey: ["yscspr", "decimals"],
    queryFn: async () => {
      if (!clickRef) throw new Error("Click ref not initialized");

      const result = await clickRef.callEntrypoint(
        RuntimeArgs.fromMap({}),
        {
          entryPoint: "decimals",
          contractHash: YSCSPR_CONTRACT,
        }
      );

      return result as number;
    },
    enabled: !!clickRef,
    staleTime: Infinity,
    ...options,
  });
}
