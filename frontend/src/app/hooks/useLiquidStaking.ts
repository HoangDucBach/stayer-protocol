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
  TransactionWrapper,
} from "casper-js-sdk";
import {
  LIQUID_STAKING_CONTRACT,
  CASPER_CHAIN_NAME,
} from "@/configs/constants";
import { waitForDeployOrTransaction } from "@/libs/casper";
import { apiClient } from "@/libs/api";
import {
  buildOdraProxyTransaction,
  buildStakeInnerArgs,
  buildUnstakeInnerArgs,
  buildClaimInnerArgs,
} from "@/libs/odra-proxy";
import type {
  StakePayload,
  UnstakePayload,
  ClaimPayload,
  LiquidStakingStats,
  WithdrawalRequest,
} from "@/types/core";
import BigNumber from "bignumber.js";

type HooksOptions<TData = unknown, TError = Error, TVariables = void> = {
  options?: Omit<UseMutationOptions<TData, TError, TVariables>, "mutationFn">;
};

type QueryHooksOptions<TData = unknown, TError = Error> = {
  options?: Omit<UseQueryOptions<TData, TError>, "queryKey" | "queryFn">;
};

interface LiquidStakingResponse {
  total_staked: string;
  total_pending_withdrawal: string;
  next_request_id: number;
  last_harvest_era: number;
  cumulative_rewards: string;
  treasury_rewards: string;
  withdrawal_request: WithdrawalRequest | null;
}

const DEFAULT_PAYMENT_GAS = 10_000_000_000;

// ============== Mutations (keep SDK) ==============

export function useStake({
  options,
}: HooksOptions<string, Error, StakePayload> = {}) {
  const clickRef = useClickRef();

  const handleStake = async ({
    validatorPublicKey,
    amount, // in CSPR
    currentEra,
    waitForConfirmation,
  }: StakePayload) => {
    if (!clickRef) throw new Error("Click ref not initialized");

    const activeAccount = clickRef.currentAccount;
    if (!activeAccount) throw new Error("No active account");

    const senderPublicKey = PublicKey.fromHex(activeAccount.public_key);

    // Build inner args for stake function
    const innerArgs = buildStakeInnerArgs(validatorPublicKey, currentEra);

    const amountToMotes = BigNumber(amount).multipliedBy(1e9);

    // Build transaction using Odra proxy (required for payable functions)
    const transactionJson = await buildOdraProxyTransaction({
      senderPublicKey,
      packageHash: LIQUID_STAKING_CONTRACT,
      entryPoint: "stake",
      innerArgs,
      attachedValue: amountToMotes.toString(),
      paymentAmount: DEFAULT_PAYMENT_GAS,
    });

    const result = await clickRef.send(
      transactionJson,
      activeAccount.public_key
    );
    console.log("Transaction result:", result);
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
  };

  return useMutation({
    mutationFn: handleStake,
    ...options,
  });
}

export function useUnstake({
  options,
}: HooksOptions<string, Error, UnstakePayload> = {}) {
  const clickRef = useClickRef();

  return useMutation({
    mutationFn: async ({
      validatorPublicKey,
      yscspr_amount,
      currentEra,
      waitForConfirmation,
    }: UnstakePayload) => {
      if (!clickRef) throw new Error("Click ref not initialized");

      const activeAccount = clickRef.currentAccount;
      if (!activeAccount) throw new Error("No active account");

      const senderPublicKey = PublicKey.fromHex(activeAccount.public_key);

      const innerArgs = buildUnstakeInnerArgs(validatorPublicKey, yscspr_amount, currentEra);

      const transactionJson = await buildOdraProxyTransaction({
        senderPublicKey,
        packageHash: LIQUID_STAKING_CONTRACT,
        entryPoint: "unstake",
        innerArgs,
        attachedValue: "0",
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
    ...options,
  });
}

export function useClaim({
  options,
}: HooksOptions<string, Error, ClaimPayload> = {}) {
  const clickRef = useClickRef();

  return useMutation({
    mutationFn: async ({ currentEra, waitForConfirmation }: ClaimPayload) => {
      if (!clickRef) throw new Error("Click ref not initialized");

      const activeAccount = clickRef.currentAccount;
      if (!activeAccount) throw new Error("No active account");

      const senderPublicKey = PublicKey.fromHex(activeAccount.public_key);

      const innerArgs = buildClaimInnerArgs(currentEra);

      const transactionJson = await buildOdraProxyTransaction({
        senderPublicKey,
        packageHash: LIQUID_STAKING_CONTRACT,
        entryPoint: "claim",
        innerArgs,
        attachedValue: "0",
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
    ...options,
  });
}

// ============== Queries (use apiClient) ==============

export function useGetStats({
  options,
}: QueryHooksOptions<LiquidStakingStats> = {}) {
  return useQuery({
    queryKey: ["liquid-staking", "stats"],
    queryFn: async () => {
      const { data } = await apiClient.get<LiquidStakingResponse>(
        "/stayer/liquid-staking"
      );
      return {
        total_staked: data.total_staked,
        total_pending_withdrawal: data.total_pending_withdrawal,
        cumulative_rewards: data.cumulative_rewards,
        exchange_rate: "1000000000", // Default 1:1, computed from total_staked / yscspr_supply
      };
    },
    ...options,
  });
}

export function useGetLiquidStakingState({
  options,
}: QueryHooksOptions<LiquidStakingResponse> = {}) {
  return useQuery({
    queryKey: ["liquid-staking", "state"],
    queryFn: async () => {
      const { data } = await apiClient.get<LiquidStakingResponse>(
        "/stayer/liquid-staking"
      );
      return data;
    },
    ...options,
  });
}

export function useGetWithdrawalRequest(
  requestId: number,
  { options }: QueryHooksOptions<WithdrawalRequest | null> = {}
) {
  return useQuery({
    queryKey: ["liquid-staking", "withdrawal-request", requestId],
    queryFn: async () => {
      const { data } = await apiClient.get<LiquidStakingResponse>(
        "/stayer/liquid-staking",
        { params: { request_id: requestId } }
      );
      return data.withdrawal_request;
    },
    enabled: requestId > 0,
    ...options,
  });
}

export function useGetExchangeRate({
  options,
}: QueryHooksOptions<string> = {}) {
  return useQuery({
    queryKey: ["liquid-staking", "exchange-rate"],
    queryFn: async () => {
      // Exchange rate = total_staked / yscspr_total_supply
      // For now return a simple ratio, can be enhanced with yscspr supply
      return "1000000000"; // 1:1 as default
    },
    ...options,
  });
}

export function useGetTotalStaked({ options }: QueryHooksOptions<string> = {}) {
  return useQuery({
    queryKey: ["liquid-staking", "total-staked"],
    queryFn: async () => {
      const { data } = await apiClient.get<LiquidStakingResponse>(
        "/stayer/liquid-staking"
      );
      return data.total_staked;
    },
    ...options,
  });
}
