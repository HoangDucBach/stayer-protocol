"use client";

import { useClickRef } from "@make-software/csprclick-ui";
import {
  useMutation,
  useQuery,
  useQueryClient,
  UseMutationOptions,
  UseQueryOptions,
} from "@tanstack/react-query";
import {
  Args,
  CLValue,
  ContractCallBuilder,
  PublicKey,
  TransactionWrapper,
} from "casper-js-sdk";
import { STAYER_VAULT_CONTRACT, CASPER_CHAIN_NAME } from "@/configs/constants";
import { waitForDeployOrTransaction } from "@/libs/casper";
import { apiClient } from "@/libs/api";
import {
  buildOdraProxyTransaction,
  buildDepositInnerArgs,
  buildBorrowInnerArgs,
  buildRepayInnerArgs,
  buildWithdrawInnerArgs,
  buildLiquidateInnerArgs,
  buildApproveInnerArgs,
} from "@/libs/odra-proxy";
import { YSCSPR_CONTRACT } from "@/configs/constants";
import type {
  Position,
  VaultParams,
  DepositPayload,
  BorrowPayload,
  RepayPayload,
  WithdrawPayload,
  LiquidatePayload,
} from "@/types/core";
import BigNumber from "bignumber.js";

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

const DEFAULT_PAYMENT_GAS = 5_000_000_000;

export function useDeposit({
  options,
}: HooksOptions<string, Error, DepositPayload> = {}) {
  const clickRef = useClickRef();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ amount, waitForConfirmation }: DepositPayload) => {
      if (!clickRef) throw new Error("Click ref not initialized");

      const activeAccount = clickRef.currentAccount;
      if (!activeAccount) throw new Error("No active account");

      const senderPublicKey = PublicKey.fromHex(activeAccount.public_key);
      
      const amountInMotes = new BigNumber(amount).multipliedBy(1e9).toString();
      const innerArgs = buildDepositInnerArgs(amountInMotes);

      const transactionJson = await buildOdraProxyTransaction({
        senderPublicKey,
        packageHash: STAYER_VAULT_CONTRACT,
        entryPoint: "deposit",
        innerArgs,
        attachedValue: "0", // No CSPR attached - we're transferring ySCSPR tokens
        paymentAmount: DEFAULT_PAYMENT_GAS,
      });

      const result = await clickRef.send(
        transactionJson,
        activeAccount.public_key
      );
      if (!result) throw new Error("Transaction failed");
      if (result.cancelled) throw new Error("Transaction cancelled by user");


      const hash = result.deployHash || result.transactionHash || "";

      if (waitForConfirmation && hash) {
        const txResult = await waitForDeployOrTransaction(hash);
        if (!txResult.executionResult.success) {
          throw new Error(
            txResult.executionResult.errorMessage ||
              "Transaction execution failed"
          );
        }
      }

      return hash;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["stayer-vault"] });
      queryClient.invalidateQueries({ queryKey: ["yscspr", "balance"] });
    },
    ...options,
  });
}

/**
 * Combined hook that handles both approve and deposit in sequence
 * Step 1: Approve ySCSPR for StayerVault
 * Step 2: Deposit ySCSPR into StayerVault
 */
export function useDepositWithApproval({
  options,
}: HooksOptions<string, Error, DepositPayload> = {}) {
  const clickRef = useClickRef();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ amount, waitForConfirmation }: DepositPayload) => {
      if (!clickRef) throw new Error("Click ref not initialized");

      const activeAccount = clickRef.currentAccount;
      if (!activeAccount) throw new Error("No active account");

      const senderPublicKey = PublicKey.fromHex(activeAccount.public_key);
      const amountInMotes = new BigNumber(amount).multipliedBy(1e9).toString();

      // Step 1: Approve ySCSPR for StayerVault
      const vaultPackageHash = STAYER_VAULT_CONTRACT.replace("hash-", "");
      const approveInnerArgs = buildApproveInnerArgs(vaultPackageHash, amountInMotes);

      const approveTransactionJson = await buildOdraProxyTransaction({
        senderPublicKey,
        packageHash: YSCSPR_CONTRACT,
        entryPoint: "approve",
        innerArgs: approveInnerArgs,
        attachedValue: "0",
        paymentAmount: 3_000_000_000,
      });

      const approveResult = await clickRef.send(
        approveTransactionJson,
        activeAccount.public_key
      );
      if (!approveResult) throw new Error("Approve transaction failed");
      if (approveResult.cancelled) throw new Error("Approve cancelled by user");

      const approveHash = approveResult.deployHash || approveResult.transactionHash || "";

      // Wait for approve to complete
      if (approveHash) {
        const approveTxResult = await waitForDeployOrTransaction(approveHash);
        if (!approveTxResult.executionResult.success) {
          throw new Error(
            approveTxResult.executionResult.errorMessage ||
              "Approve transaction failed"
          );
        }
      }

      // Step 2: Deposit ySCSPR into StayerVault
      const depositInnerArgs = buildDepositInnerArgs(amountInMotes);

      const depositTransactionJson = await buildOdraProxyTransaction({
        senderPublicKey,
        packageHash: STAYER_VAULT_CONTRACT,
        entryPoint: "deposit",
        innerArgs: depositInnerArgs,
        attachedValue: "0",
        paymentAmount: DEFAULT_PAYMENT_GAS,
      });

      const depositResult = await clickRef.send(
        depositTransactionJson,
        activeAccount.public_key
      );
      if (!depositResult) throw new Error("Deposit transaction failed");
      if (depositResult.cancelled) throw new Error("Deposit cancelled by user");

      const depositHash = depositResult.deployHash || depositResult.transactionHash || "";

      if (waitForConfirmation && depositHash) {
        const depositTxResult = await waitForDeployOrTransaction(depositHash);
        if (!depositTxResult.executionResult.success) {
          throw new Error(
            depositTxResult.executionResult.errorMessage ||
              "Deposit transaction failed"
          );
        }
      }

      return depositHash;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["stayer-vault"] });
      queryClient.invalidateQueries({ queryKey: ["yscspr", "balance"] });
    },
    ...options,
  });
}

export function useBorrow({
  options,
}: HooksOptions<string, Error, BorrowPayload> = {}) {
  const clickRef = useClickRef();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ cusdAmount, waitForConfirmation }: BorrowPayload) => {
      if (!clickRef) throw new Error("Click ref not initialized");

      const activeAccount = clickRef.currentAccount;
      if (!activeAccount) throw new Error("No active account");

      const senderPublicKey = PublicKey.fromHex(activeAccount.public_key);

      // Convert cUSD amount to motes (multiply by 10^9)
      const amountInMotes = new BigNumber(cusdAmount).multipliedBy(1e9).toFixed(0);
      const innerArgs = buildBorrowInnerArgs(amountInMotes);

      const transactionJson = await buildOdraProxyTransaction({
        senderPublicKey,
        packageHash: STAYER_VAULT_CONTRACT,
        entryPoint: "borrow",
        innerArgs,
        attachedValue: "0",
        paymentAmount: 3_000_000_000,
      });

      const result = await clickRef.send(
        transactionJson,
        activeAccount.public_key
      );
      if (!result) throw new Error("Transaction failed");
      if (result.cancelled) throw new Error("Transaction cancelled by user");

      const hash = result.deployHash || result.transactionHash || "";

      if (waitForConfirmation && hash) {
        const txResult = await waitForDeployOrTransaction(hash);
        if (!txResult.executionResult.success) {
          throw new Error(
            txResult.executionResult.errorMessage ||
              "Transaction execution failed"
          );
        }
      }

      return hash;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["stayer-vault"] });
      queryClient.invalidateQueries({ queryKey: ["cusd", "balance"] });
    },
    ...options,
  });
}

export function useRepay({
  options,
}: HooksOptions<string, Error, RepayPayload> = {}) {
  const clickRef = useClickRef();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ cusdAmount, waitForConfirmation }: RepayPayload) => {
      if (!clickRef) throw new Error("Click ref not initialized");

      const activeAccount = clickRef.currentAccount;
      if (!activeAccount) throw new Error("No active account");

      const senderPublicKey = PublicKey.fromHex(activeAccount.public_key);

      // Convert cUSD amount to motes (multiply by 10^9)
      const amountInMotes = new BigNumber(cusdAmount).multipliedBy(1e9).toFixed(0);
      const innerArgs = buildRepayInnerArgs(amountInMotes);

      const transactionJson = await buildOdraProxyTransaction({
        senderPublicKey,
        packageHash: STAYER_VAULT_CONTRACT,
        entryPoint: "repay",
        innerArgs,
        attachedValue: "0",
        paymentAmount: 3_000_000_000,
      });

      const result = await clickRef.send(
        transactionJson,
        activeAccount.public_key
      );
      if (!result) throw new Error("Transaction failed");
      if (result.cancelled) throw new Error("Transaction cancelled by user");

      const hash = result.deployHash || result.transactionHash || "";

      if (waitForConfirmation && hash) {
        const txResult = await waitForDeployOrTransaction(hash);
        if (!txResult.executionResult.success) {
          throw new Error(
            txResult.executionResult.errorMessage ||
              "Transaction execution failed"
          );
        }
      }

      return hash;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["stayer-vault"] });
      queryClient.invalidateQueries({ queryKey: ["cusd", "balance"] });
    },
    ...options,
  });
}

export function useWithdraw({
  options,
}: HooksOptions<string, Error, WithdrawPayload> = {}) {
  const clickRef = useClickRef();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      collateralAmount,
      waitForConfirmation,
    }: WithdrawPayload) => {
      if (!clickRef) throw new Error("Click ref not initialized");

      const activeAccount = clickRef.currentAccount;
      if (!activeAccount) throw new Error("No active account");

      const senderPublicKey = PublicKey.fromHex(activeAccount.public_key);

      // Convert ySCSPR amount to motes (multiply by 10^9)
      const amountInMotes = new BigNumber(collateralAmount).multipliedBy(1e9).toFixed(0);
      const innerArgs = buildWithdrawInnerArgs(amountInMotes);

      const transactionJson = await buildOdraProxyTransaction({
        senderPublicKey,
        packageHash: STAYER_VAULT_CONTRACT,
        entryPoint: "withdraw",
        innerArgs,
        attachedValue: "0",
        paymentAmount: 3_000_000_000,
      });

      const result = await clickRef.send(
        transactionJson,
        activeAccount.public_key
      );
      if (!result) throw new Error("Transaction failed");
      if (result.cancelled) throw new Error("Transaction cancelled by user");

      const hash = result.deployHash || result.transactionHash || "";

      if (waitForConfirmation && hash) {
        const txResult = await waitForDeployOrTransaction(hash);
        if (!txResult.executionResult.success) {
          throw new Error(
            txResult.executionResult.errorMessage ||
              "Transaction execution failed"
          );
        }
      }

      return hash;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["stayer-vault"] });
      queryClient.invalidateQueries({ queryKey: ["yscspr", "balance"] });
    },
    ...options,
  });
}

export function useLiquidate({
  options,
}: HooksOptions<string, Error, LiquidatePayload> = {}) {
  const clickRef = useClickRef();
  const queryClient = useQueryClient();

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

      // Convert cUSD debtToCover to motes (multiply by 10^9)
      const debtInMotes = new BigNumber(debtToCover).multipliedBy(1e9).toFixed(0);
      const innerArgs = buildLiquidateInnerArgs(userAddress, debtInMotes);

      const transactionJson = await buildOdraProxyTransaction({
        senderPublicKey,
        packageHash: STAYER_VAULT_CONTRACT,
        entryPoint: "liquidate",
        innerArgs,
        attachedValue: "0",
        paymentAmount: 5_000_000_000,
      });

      const result = await clickRef.send(
        transactionJson,
        activeAccount.public_key
      );
      if (!result) throw new Error("Transaction failed");

      const hash = result.deployHash || result.transactionHash || "";

      if (waitForConfirmation && hash) {
        const txResult = await waitForDeployOrTransaction(hash);
        if (!txResult.executionResult.success) {
          throw new Error(
            txResult.executionResult.errorMessage ||
              "Transaction execution failed"
          );
        }
      }

      return hash;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["stayer-vault"] });
      queryClient.invalidateQueries({ queryKey: ["cusd", "balance"] });
      queryClient.invalidateQueries({ queryKey: ["yscspr", "balance"] });
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
      console.log("Position data:", data.position);
      return data.position;
    },
    enabled: !!userAddress,
    ...options,
  });
}

export function useGetVaultParams({
  options,
}: QueryHooksOptions<VaultParams | null> = {}) {
  return useQuery({
    queryKey: ["stayer-vault", "params"],
    queryFn: async () => {
      const { data } = await apiClient.get<VaultResponse>("/stayer/vault");
      console.log("Vault params data:", data);
      return data.params;
    },
    ...options,
  });
}

export function useGetVaultState({
  options,
}: QueryHooksOptions<VaultResponse> = {}) {
  return useQuery({
    queryKey: ["stayer-vault", "state"],
    queryFn: async () => {
      const { data } = await apiClient.get<VaultResponse>("/stayer/vault");
      return data;
    },
    ...options,
  });
}

export function useGetTotalCollateral({
  options,
}: QueryHooksOptions<string> = {}) {
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
