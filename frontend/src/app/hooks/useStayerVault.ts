import { useClickRef } from "@make-software/csprclick-ui";
import { useMutation, useQuery, UseMutationOptions, UseQueryOptions } from "@tanstack/react-query";
import { CLValueBuilder, RuntimeArgs } from "casper-js-sdk";
import { STAYER_VAULT_CONTRACT, CASPER_CHAIN_NAME } from "@/configs/constants";

type Position = {
  owner: string;
  collateral: string;
  debt: string;
  entry_price: string;
  opened_at: number;
};

type VaultParams = {
  ltv: number;
  liq_threshold: number;
  liq_penalty: number;
  stability_fee: number;
  min_collateral: string;
};

type DepositPayload = {
  amount: string;
};

type BorrowPayload = {
  cusdAmount: string;
};

type RepayPayload = {
  cusdAmount: string;
};

type WithdrawPayload = {
  collateralAmount: string;
};

type LiquidatePayload = {
  userAddress: string;
};

type HooksOptions<TData = unknown, TError = Error> = {
  options?: Omit<UseMutationOptions<TData, TError>, "mutationFn">;
};

type QueryHooksOptions<TData = unknown, TError = Error> = {
  options?: Omit<UseQueryOptions<TData, TError>, "queryKey" | "queryFn">;
};

export function useDeposit({ options }: HooksOptions<string> = {}) {
  const clickRef = useClickRef();

  return useMutation({
    mutationFn: async ({ amount }: DepositPayload) => {
      if (!clickRef) throw new Error("Click ref not initialized");

      const deploy = await clickRef.makeDeploy(
        RuntimeArgs.fromMap({}),
        {
          entryPoint: "deposit",
          contractHash: STAYER_VAULT_CONTRACT,
          paymentAmount: amount,
        },
        CASPER_CHAIN_NAME
      );

      const result = await clickRef.send(deploy);
      return result.deployHash;
    },
    ...options,
  });
}

export function useBorrow({ options }: HooksOptions<string> = {}) {
  const clickRef = useClickRef();

  return useMutation({
    mutationFn: async ({ cusdAmount }: BorrowPayload) => {
      if (!clickRef) throw new Error("Click ref not initialized");

      const deploy = await clickRef.makeDeploy(
        RuntimeArgs.fromMap({
          cusd_amount: CLValueBuilder.u256(cusdAmount),
        }),
        {
          entryPoint: "borrow",
          contractHash: STAYER_VAULT_CONTRACT,
        },
        CASPER_CHAIN_NAME
      );

      const result = await clickRef.send(deploy);
      return result.deployHash;
    },
    ...options,
  });
}

export function useRepay({ options }: HooksOptions<string> = {}) {
  const clickRef = useClickRef();

  return useMutation({
    mutationFn: async ({ cusdAmount }: RepayPayload) => {
      if (!clickRef) throw new Error("Click ref not initialized");

      const deploy = await clickRef.makeDeploy(
        RuntimeArgs.fromMap({
          cusd_amount: CLValueBuilder.u256(cusdAmount),
        }),
        {
          entryPoint: "repay",
          contractHash: STAYER_VAULT_CONTRACT,
        },
        CASPER_CHAIN_NAME
      );

      const result = await clickRef.send(deploy);
      return result.deployHash;
    },
    ...options,
  });
}

export function useWithdraw({ options }: HooksOptions<string> = {}) {
  const clickRef = useClickRef();

  return useMutation({
    mutationFn: async ({ collateralAmount }: WithdrawPayload) => {
      if (!clickRef) throw new Error("Click ref not initialized");

      const deploy = await clickRef.makeDeploy(
        RuntimeArgs.fromMap({
          collateral_amount: CLValueBuilder.u256(collateralAmount),
        }),
        {
          entryPoint: "withdraw",
          contractHash: STAYER_VAULT_CONTRACT,
        },
        CASPER_CHAIN_NAME
      );

      const result = await clickRef.send(deploy);
      return result.deployHash;
    },
    ...options,
  });
}

export function useLiquidate({ options }: HooksOptions<string> = {}) {
  const clickRef = useClickRef();

  return useMutation({
    mutationFn: async ({ userAddress }: LiquidatePayload) => {
      if (!clickRef) throw new Error("Click ref not initialized");

      const deploy = await clickRef.makeDeploy(
        RuntimeArgs.fromMap({
          user: CLValueBuilder.byteArray(Buffer.from(userAddress, "hex")),
        }),
        {
          entryPoint: "liquidate",
          contractHash: STAYER_VAULT_CONTRACT,
        },
        CASPER_CHAIN_NAME
      );

      const result = await clickRef.send(deploy);
      return result.deployHash;
    },
    ...options,
  });
}

export function useGetPosition(
  userAddress: string,
  { options }: QueryHooksOptions<Position | null> = {}
) {
  const clickRef = useClickRef();

  return useQuery({
    queryKey: ["stayer-vault", "position", userAddress],
    queryFn: async () => {
      if (!clickRef) throw new Error("Click ref not initialized");

      const result = await clickRef.callEntrypoint(
        RuntimeArgs.fromMap({
          user: CLValueBuilder.byteArray(Buffer.from(userAddress, "hex")),
        }),
        {
          entryPoint: "get_position",
          contractHash: STAYER_VAULT_CONTRACT,
        }
      );

      return result as Position | null;
    },
    enabled: !!clickRef && !!userAddress,
    ...options,
  });
}

export function useGetVaultParams({ options }: QueryHooksOptions<VaultParams> = {}) {
  const clickRef = useClickRef();

  return useQuery({
    queryKey: ["stayer-vault", "params"],
    queryFn: async () => {
      if (!clickRef) throw new Error("Click ref not initialized");

      const result = await clickRef.callEntrypoint(
        RuntimeArgs.fromMap({}),
        {
          entryPoint: "get_params",
          contractHash: STAYER_VAULT_CONTRACT,
        }
      );

      return result as VaultParams;
    },
    enabled: !!clickRef,
    ...options,
  });
}

export function useGetTotalCollateral({ options }: QueryHooksOptions<string> = {}) {
  const clickRef = useClickRef();

  return useQuery({
    queryKey: ["stayer-vault", "total-collateral"],
    queryFn: async () => {
      if (!clickRef) throw new Error("Click ref not initialized");

      const result = await clickRef.callEntrypoint(
        RuntimeArgs.fromMap({}),
        {
          entryPoint: "get_total_collateral",
          contractHash: STAYER_VAULT_CONTRACT,
        }
      );

      return result as string;
    },
    enabled: !!clickRef,
    ...options,
  });
}

export function useGetTotalDebt({ options }: QueryHooksOptions<string> = {}) {
  const clickRef = useClickRef();

  return useQuery({
    queryKey: ["stayer-vault", "total-debt"],
    queryFn: async () => {
      if (!clickRef) throw new Error("Click ref not initialized");

      const result = await clickRef.callEntrypoint(
        RuntimeArgs.fromMap({}),
        {
          entryPoint: "get_total_debt",
          contractHash: STAYER_VAULT_CONTRACT,
        }
      );

      return result as string;
    },
    enabled: !!clickRef,
    ...options,
  });
}

export function useCalculateHealthFactor(
  userAddress: string,
  { options }: QueryHooksOptions<string> = {}
) {
  const clickRef = useClickRef();

  return useQuery({
    queryKey: ["stayer-vault", "health-factor", userAddress],
    queryFn: async () => {
      if (!clickRef) throw new Error("Click ref not initialized");

      const result = await clickRef.callEntrypoint(
        RuntimeArgs.fromMap({
          user: CLValueBuilder.byteArray(Buffer.from(userAddress, "hex")),
        }),
        {
          entryPoint: "calculate_health_factor",
          contractHash: STAYER_VAULT_CONTRACT,
        }
      );

      return result as string;
    },
    enabled: !!clickRef && !!userAddress,
    ...options,
  });
}
