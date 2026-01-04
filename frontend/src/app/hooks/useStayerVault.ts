"use client";

import { useClickRef } from "@make-software/csprclick-ui";
import {
  useMutation,
  useQuery,
  UseMutationOptions,
  UseQueryOptions,
} from "@tanstack/react-query";
import {
  Args,
  CLValue,
  PublicKey,
  ContractCallBuilder,
  TransactionWrapper,
} from "casper-js-sdk";
import { STAYER_VAULT_CONTRACT, CASPER_CHAIN_NAME } from "@/configs/constants";
import { waitForDeployOrTransaction } from "@/libs/casper";
import { apiClient } from "@/libs/api";
import type {
  Position,
  VaultParams,
  DepositPayload,
  BorrowPayload,
  RepayPayload,
  WithdrawPayload,
  LiquidatePayload,
} from "@/types/core";

type HooksOptions<TData = unknown, TError = Error, TVariables = void> = {
  options?: Omit<UseMutationOptions<TData, TError, TVariables>, "mutationFn">;
};

type QueryHooksOptions<TData = unknown, TError = Error> = {
  options?: Omit<UseQueryOptions<TData, TError>, "queryKey" | "queryFn">;
};

interface VaultResponse {
  total_collateral: string;
  total_debt: string;
  params: VaultParams | null;
  paused: boolean;
  position: Position | null;
}

// ============== Mutations (keep SDK) ==============

export function useDeposit({
  options,
}: HooksOptions<string, Error, DepositPayload> = {}) {
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

      const wrapper = transaction.getTransactionWrapper();
      const transactionJson = TransactionWrapper.toJSON(wrapper) as object;

      const result = await clickRef.send(transactionJson, activeAccount.public_key);
      if (!result) throw new Error("Transaction failed");

      const hash = result.deployHash || result.transactionHash || "";

      if (waitForConfirmation && hash) {
        const txResult = await waitForDeployOrTransaction(hash);
        if (!txResult.executionResult.success) {
          throw new Error(
            txResult.executionResult.errorMessage || "Transaction execution failed"
          );
        }
      }

      return hash;
    },
    ...options,
  });
}

export function useBorrow({
  options,
}: HooksOptions<string, Error, BorrowPayload> = {}) {
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

      const wrapper = transaction.getTransactionWrapper();
      const transactionJson = TransactionWrapper.toJSON(wrapper) as object;

      const result = await clickRef.send(transactionJson, activeAccount.public_key);
      if (!result) throw new Error("Transaction failed");

      const hash = result.deployHash || result.transactionHash || "";

      if (waitForConfirmation && hash) {
        const txResult = await waitForDeployOrTransaction(hash);
        if (!txResult.executionResult.success) {
          throw new Error(
            txResult.executionResult.errorMessage || "Transaction execution failed"
          );
        }
      }

      return hash;
    },
    ...options,
  });
}

export function useRepay({
  options,
}: HooksOptions<string, Error, RepayPayload> = {}) {
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

      const wrapper = transaction.getTransactionWrapper();
      const transactionJson = TransactionWrapper.toJSON(wrapper) as object;

      const result = await clickRef.send(transactionJson, activeAccount.public_key);
      if (!result) throw new Error("Transaction failed");

      const hash = result.deployHash || result.transactionHash || "";

      if (waitForConfirmation && hash) {
        const txResult = await waitForDeployOrTransaction(hash);
        if (!txResult.executionResult.success) {
          throw new Error(
            txResult.executionResult.errorMessage || "Transaction execution failed"
          );
        }
      }

      return hash;
    },
    ...options,
  });
}

export function useWithdraw({
  options,
}: HooksOptions<string, Error, WithdrawPayload> = {}) {
  const clickRef = useClickRef();

  return useMutation({
    mutationFn: async ({
      collateralAmount,
      waitForConfirmation,
    }: WithdrawPayload) => {
      if (!clickRef) throw new Error("Click ref not initialized");

      const activeAccount = clickRef.currentAccount;
      if (!activeAccount) throw new Error("No active account");

      const senderPublicKey = PublicKey.fromHex(activeAccount.public_key);

      const args = Args.fromMap({
        yscspr_amount: CLValue.newCLUInt256(collateralAmount),
      });

      const transaction = new ContractCallBuilder()
        .from(senderPublicKey)
        .byHash(STAYER_VAULT_CONTRACT)
        .entryPoint("withdraw")
        .runtimeArgs(args)
        .chainName(CASPER_CHAIN_NAME)
        .payment(3_000_000_000)
        .build();

      const wrapper = transaction.getTransactionWrapper();
      const transactionJson = TransactionWrapper.toJSON(wrapper) as object;

      const result = await clickRef.send(transactionJson, activeAccount.public_key);
      if (!result) throw new Error("Transaction failed");

      const hash = result.deployHash || result.transactionHash || "";

      if (waitForConfirmation && hash) {
        const txResult = await waitForDeployOrTransaction(hash);
        if (!txResult.executionResult.success) {
          throw new Error(
            txResult.executionResult.errorMessage || "Transaction execution failed"
          );
        }
      }

      return hash;
    },
    ...options,
  });
}

export function useLiquidate({
  options,
}: HooksOptions<string, Error, LiquidatePayload> = {}) {
  const clickRef = useClickRef();

  return useMutation({
    mutationFn: async ({
      userAddress,
      debtToCover,
      waitForConfirmation,
    }: LiquidatePayload) => {
      if (!clickRef) throw new Error("Click ref not initialized");

      const activeAccount = clickRef.currentAccount;
      if (!activeAccount) throw new Error("No active account");

      const senderPublicKey = PublicKey.fromHex(activeAccount.public_key);

      const args = Args.fromMap({
        user: CLValue.newCLByteArray(Buffer.from(userAddress, "hex")),
        debt_to_cover: CLValue.newCLUInt256(debtToCover),
      });

      const transaction = new ContractCallBuilder()
        .from(senderPublicKey)
        .byHash(STAYER_VAULT_CONTRACT)
        .entryPoint("liquidate")
        .runtimeArgs(args)
        .chainName(CASPER_CHAIN_NAME)
        .payment(5_000_000_000)
        .build();

      const wrapper = transaction.getTransactionWrapper();
      const transactionJson = TransactionWrapper.toJSON(wrapper) as object;

      const result = await clickRef.send(transactionJson, activeAccount.public_key);
      if (!result) throw new Error("Transaction failed");

      const hash = result.deployHash || result.transactionHash || "";

      if (waitForConfirmation && hash) {
        const txResult = await waitForDeployOrTransaction(hash);
        if (!txResult.executionResult.success) {
          throw new Error(
            txResult.executionResult.errorMessage || "Transaction execution failed"
          );
        }
      }

      return hash;
    },
    ...options,
  });
}

// ============== Queries (use apiClient) ==============

export function useGetPosition(
  userAddress: string,
  { options }: QueryHooksOptions<Position | null> = {}
) {
  return useQuery({
    queryKey: ["stayer-vault", "position", userAddress],
    queryFn: async () => {
      const { data } = await apiClient.get<VaultResponse>("/stayer/vault", {
        params: { user: userAddress },
      });
      return data.position;
    },
    enabled: !!userAddress,
    ...options,
  });
}

export function useGetVaultParams({ options }: QueryHooksOptions<VaultParams | null> = {}) {
  return useQuery({
    queryKey: ["stayer-vault", "params"],
    queryFn: async () => {
      const { data } = await apiClient.get<VaultResponse>("/stayer/vault");
      return data.params;
    },
    ...options,
  });
}

export function useGetVaultState({ options }: QueryHooksOptions<VaultResponse> = {}) {
  return useQuery({
    queryKey: ["stayer-vault", "state"],
    queryFn: async () => {
      const { data } = await apiClient.get<VaultResponse>("/stayer/vault");
      return data;
    },
    ...options,
  });
}

export function useGetTotalCollateral({ options }: QueryHooksOptions<string> = {}) {
  return useQuery({
    queryKey: ["stayer-vault", "total-collateral"],
    queryFn: async () => {
      const { data } = await apiClient.get<VaultResponse>("/stayer/vault");
      return data.total_collateral;
    },
    ...options,
  });
}

export function useGetTotalDebt({ options }: QueryHooksOptions<string> = {}) {
  return useQuery({
    queryKey: ["stayer-vault", "total-debt"],
    queryFn: async () => {
      const { data } = await apiClient.get<VaultResponse>("/stayer/vault");
      return data.total_debt;
    },
    ...options,
  });
}

export function useIsVaultPaused({ options }: QueryHooksOptions<boolean> = {}) {
  return useQuery({
    queryKey: ["stayer-vault", "paused"],
    queryFn: async () => {
      const { data } = await apiClient.get<VaultResponse>("/stayer/vault");
      return data.paused;
    },
    ...options,
  });
}

export function useCalculateHealthFactor(
  userAddress: string,
  { options }: QueryHooksOptions<string> = {}
) {
  return useQuery({
    queryKey: ["stayer-vault", "health-factor", userAddress],
    queryFn: async () => {
      const { data } = await apiClient.get<VaultResponse>("/stayer/vault", {
        params: { user: userAddress },
      });

      const position = data.position;
      const params = data.params;

      if (!position || !params) return "0";

      const collateral = BigInt(position.collateral);
      const debt = BigInt(position.debt);

      if (debt === BigInt(0)) return "MAX";

      // Health factor = (collateral * liq_threshold) / (debt * 10000)
      const healthFactor =
        (collateral * BigInt(params.liq_threshold)) / (debt * BigInt(10000));

      return healthFactor.toString();
    },
    enabled: !!userAddress,
    ...options,
  });
}
