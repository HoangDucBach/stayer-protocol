import { useClickRef } from "@make-software/csprclick-ui";
import { useMutation, useQuery, UseMutationOptions, UseQueryOptions } from "@tanstack/react-query";
import {
  Args,
  CLValue,
  PublicKey,
  ContractCallBuilder,
  HttpHandler,
  RpcClient,
} from "casper-js-sdk";
import { STAYER_VAULT_CONTRACT, CASPER_CHAIN_NAME } from "@/configs/constants";
import { waitForDeployOrTransaction } from "@/libs/casper";
import type {
  Position,
  VaultParams,
  DepositPayload,
  BorrowPayload,
  RepayPayload,
  WithdrawPayload,
  LiquidatePayload,
} from "@/types/core";

// Helper to create RPC client from cspr.click proxy
function createRpcClient(clickRef: ReturnType<typeof useClickRef>) {
  const proxy = clickRef?.getCsprCloudProxy();
  if (!proxy) throw new Error("CSPR.cloud proxy not available");

  const handler = new HttpHandler(proxy.RpcURL);
  handler.setCustomHeaders({ Authorization: proxy.RpcDigestToken });
  return new RpcClient(handler);
}

type HooksOptions<TData = unknown, TError = Error, TVariables = void> = {
  options?: Omit<UseMutationOptions<TData, TError, TVariables>, "mutationFn">;
};

type QueryHooksOptions<TData = unknown, TError = Error> = {
  options?: Omit<UseQueryOptions<TData, TError>, "queryKey" | "queryFn">;
};

export function useDeposit({ options }: HooksOptions<string, Error, DepositPayload> = {}) {
  const clickRef = useClickRef();

  return useMutation({
    mutationFn: async ({ amount, waitForConfirmation }: DepositPayload) => {
      if (!clickRef) throw new Error("Click ref not initialized");

      const activeAccount = clickRef.currentAccount;
      if (!activeAccount) throw new Error("No active account");

      const senderPublicKey = PublicKey.fromHex(activeAccount.public_key);

      const args = Args.fromMap({});

      const transaction = new ContractCallBuilder()
        .from(senderPublicKey)
        .byHash(STAYER_VAULT_CONTRACT)
        .entryPoint("deposit")
        .runtimeArgs(args)
        .chainName(CASPER_CHAIN_NAME)
        .payment(Number(amount))
        .build();

      const result = await clickRef.send(transaction, activeAccount.public_key);
      if (!result) throw new Error("Transaction failed");

      const hash = result.deployHash || result.transactionHash || "";

      if (waitForConfirmation && hash) {
        const txResult = await waitForDeployOrTransaction(hash);
        if (!txResult.executionResult.success) {
          throw new Error(txResult.executionResult.errorMessage || "Transaction execution failed");
        }
      }

      return hash;
    },
    ...options,
  });
}

export function useBorrow({ options }: HooksOptions<string, Error, BorrowPayload> = {}) {
  const clickRef = useClickRef();

  return useMutation({
    mutationFn: async ({ cusdAmount, waitForConfirmation }: BorrowPayload) => {
      if (!clickRef) throw new Error("Click ref not initialized");

      const activeAccount = clickRef.currentAccount;
      if (!activeAccount) throw new Error("No active account");

      const senderPublicKey = PublicKey.fromHex(activeAccount.public_key);

      const args = Args.fromMap({
        cusd_amount: CLValue.newCLUInt256(cusdAmount),
      });

      const transaction = new ContractCallBuilder()
        .from(senderPublicKey)
        .byHash(STAYER_VAULT_CONTRACT)
        .entryPoint("borrow")
        .runtimeArgs(args)
        .chainName(CASPER_CHAIN_NAME)
        .payment(3_000_000_000)
        .build();

      const result = await clickRef.send(transaction, activeAccount.public_key);
      if (!result) throw new Error("Transaction failed");

      const hash = result.deployHash || result.transactionHash || "";

      if (waitForConfirmation && hash) {
        const txResult = await waitForDeployOrTransaction(hash);
        if (!txResult.executionResult.success) {
          throw new Error(txResult.executionResult.errorMessage || "Transaction execution failed");
        }
      }

      return hash;
    },
    ...options,
  });
}

export function useRepay({ options }: HooksOptions<string, Error, RepayPayload> = {}) {
  const clickRef = useClickRef();

  return useMutation({
    mutationFn: async ({ cusdAmount, waitForConfirmation }: RepayPayload) => {
      if (!clickRef) throw new Error("Click ref not initialized");

      const activeAccount = clickRef.currentAccount;
      if (!activeAccount) throw new Error("No active account");

      const senderPublicKey = PublicKey.fromHex(activeAccount.public_key);

      const args = Args.fromMap({
        cusd_amount: CLValue.newCLUInt256(cusdAmount),
      });

      const transaction = new ContractCallBuilder()
        .from(senderPublicKey)
        .byHash(STAYER_VAULT_CONTRACT)
        .entryPoint("repay")
        .runtimeArgs(args)
        .chainName(CASPER_CHAIN_NAME)
        .payment(3_000_000_000)
        .build();

      const result = await clickRef.send(transaction, activeAccount.public_key);
      if (!result) throw new Error("Transaction failed");

      const hash = result.deployHash || result.transactionHash || "";

      if (waitForConfirmation && hash) {
        const txResult = await waitForDeployOrTransaction(hash);
        if (!txResult.executionResult.success) {
          throw new Error(txResult.executionResult.errorMessage || "Transaction execution failed");
        }
      }

      return hash;
    },
    ...options,
  });
}

export function useWithdraw({ options }: HooksOptions<string, Error, WithdrawPayload> = {}) {
  const clickRef = useClickRef();

  return useMutation({
    mutationFn: async ({ collateralAmount, waitForConfirmation }: WithdrawPayload) => {
      if (!clickRef) throw new Error("Click ref not initialized");

      const activeAccount = clickRef.currentAccount;
      if (!activeAccount) throw new Error("No active account");

      const senderPublicKey = PublicKey.fromHex(activeAccount.public_key);

      const args = Args.fromMap({
        collateral_amount: CLValue.newCLUInt256(collateralAmount),
      });

      const transaction = new ContractCallBuilder()
        .from(senderPublicKey)
        .byHash(STAYER_VAULT_CONTRACT)
        .entryPoint("withdraw")
        .runtimeArgs(args)
        .chainName(CASPER_CHAIN_NAME)
        .payment(3_000_000_000)
        .build();

      const result = await clickRef.send(transaction, activeAccount.public_key);
      if (!result) throw new Error("Transaction failed");

      const hash = result.deployHash || result.transactionHash || "";

      if (waitForConfirmation && hash) {
        const txResult = await waitForDeployOrTransaction(hash);
        if (!txResult.executionResult.success) {
          throw new Error(txResult.executionResult.errorMessage || "Transaction execution failed");
        }
      }

      return hash;
    },
    ...options,
  });
}

export function useLiquidate({ options }: HooksOptions<string, Error, LiquidatePayload> = {}) {
  const clickRef = useClickRef();

  return useMutation({
    mutationFn: async ({ userAddress, waitForConfirmation }: LiquidatePayload) => {
      if (!clickRef) throw new Error("Click ref not initialized");

      const activeAccount = clickRef.currentAccount;
      if (!activeAccount) throw new Error("No active account");

      const senderPublicKey = PublicKey.fromHex(activeAccount.public_key);

      const args = Args.fromMap({
        user: CLValue.newCLByteArray(Buffer.from(userAddress, "hex")),
      });

      const transaction = new ContractCallBuilder()
        .from(senderPublicKey)
        .byHash(STAYER_VAULT_CONTRACT)
        .entryPoint("liquidate")
        .runtimeArgs(args)
        .chainName(CASPER_CHAIN_NAME)
        .payment(5_000_000_000)
        .build();

      const result = await clickRef.send(transaction, activeAccount.public_key);
      if (!result) throw new Error("Transaction failed");

      const hash = result.deployHash || result.transactionHash || "";

      if (waitForConfirmation && hash) {
        const txResult = await waitForDeployOrTransaction(hash);
        if (!txResult.executionResult.success) {
          throw new Error(txResult.executionResult.errorMessage || "Transaction execution failed");
        }
      }

      return hash;
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

      const rpcClient = createRpcClient(clickRef);
      const contractKey = `hash-${STAYER_VAULT_CONTRACT}`;

      try {
        const result = await rpcClient.getDictionaryItemByIdentifier(null, {
          contractNamedKey: {
            key: contractKey,
            dictionaryName: "positions",
            dictionaryItemKey: userAddress,
          },
        });

        const storedValue = result.storedValue?.clValue;
        if (!storedValue) return null;

        // Parse the position data from CLValue map
        // The structure depends on how the contract stores positions
        const mapValue = storedValue.map;
        if (mapValue) {
          // For map type storage
          return {
            owner: mapValue.get("owner")?.stringVal?.toString() || userAddress,
            collateral: mapValue.get("collateral")?.ui256?.toString() || "0",
            debt: mapValue.get("debt")?.ui256?.toString() || "0",
            entry_price: mapValue.get("entry_price")?.ui256?.toString() || "0",
            opened_at: Number(mapValue.get("opened_at")?.ui64?.toString() || 0),
          } as Position;
        }

        // Fallback: try to parse from any type
        return {
          owner: userAddress,
          collateral: storedValue.toString() || "0",
          debt: "0",
          entry_price: "0",
          opened_at: 0,
        } as Position;
      } catch {
        return null;
      }
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

      const rpcClient = createRpcClient(clickRef);
      const contractKey = `hash-${STAYER_VAULT_CONTRACT}`;

      const [ltvResult, liqThresholdResult, liqPenaltyResult, stabilityFeeResult, minCollateralResult] =
        await Promise.all([
          rpcClient.queryLatestGlobalState(contractKey, ["ltv"]),
          rpcClient.queryLatestGlobalState(contractKey, ["liq_threshold"]),
          rpcClient.queryLatestGlobalState(contractKey, ["liq_penalty"]),
          rpcClient.queryLatestGlobalState(contractKey, ["stability_fee"]),
          rpcClient.queryLatestGlobalState(contractKey, ["min_collateral"]),
        ]);

      return {
        ltv: Number(ltvResult.storedValue?.clValue?.toString() || "0"),
        liq_threshold: Number(liqThresholdResult.storedValue?.clValue?.toString() || "0"),
        liq_penalty: Number(liqPenaltyResult.storedValue?.clValue?.toString() || "0"),
        stability_fee: Number(stabilityFeeResult.storedValue?.clValue?.toString() || "0"),
        min_collateral: minCollateralResult.storedValue?.clValue?.toString() || "0",
      } as VaultParams;
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

      const rpcClient = createRpcClient(clickRef);
      const contractKey = `hash-${STAYER_VAULT_CONTRACT}`;

      const result = await rpcClient.queryLatestGlobalState(contractKey, ["total_collateral"]);
      return result.storedValue?.clValue?.toString() || "0";
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

      const rpcClient = createRpcClient(clickRef);
      const contractKey = `hash-${STAYER_VAULT_CONTRACT}`;

      const result = await rpcClient.queryLatestGlobalState(contractKey, ["total_debt"]);
      return result.storedValue?.clValue?.toString() || "0";
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

      // Health factor calculation needs to be done client-side
      // since Casper doesn't have view functions
      const rpcClient = createRpcClient(clickRef);
      const contractKey = `hash-${STAYER_VAULT_CONTRACT}`;

      try {
        // Get position data
        const positionResult = await rpcClient.getDictionaryItemByIdentifier(null, {
          contractNamedKey: {
            key: contractKey,
            dictionaryName: "positions",
            dictionaryItemKey: userAddress,
          },
        });

        const storedValue = positionResult.storedValue?.clValue;
        if (!storedValue) return "0";

        // Parse the position data from CLValue map
        let collateral = 0;
        let debt = 0;
        const mapValue = storedValue.map;
        if (mapValue) {
          collateral = Number(mapValue.get("collateral")?.ui256?.toString() || 0);
          debt = Number(mapValue.get("debt")?.ui256?.toString() || 0);
        }

        if (debt === 0) return "MAX";

        // Get liquidation threshold
        const liqThresholdResult = await rpcClient.queryLatestGlobalState(contractKey, ["liq_threshold"]);
        const liqThreshold = Number(liqThresholdResult.storedValue?.clValue?.toString() || "80") / 100;

        // Simple health factor calculation: (collateral * liq_threshold) / debt
        const healthFactor = (collateral * liqThreshold) / debt;
        return healthFactor.toFixed(4);
      } catch {
        return "0";
      }
    },
    enabled: !!clickRef && !!userAddress,
    ...options,
  });
}
