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
  PublicKey,
  TransactionWrapper,
} from "casper-js-sdk";
import { CUSD_CONTRACT, CASPER_CHAIN_NAME } from "@/configs/constants";
import { waitForDeployOrTransaction } from "@/libs/casper";
import { apiClient } from "@/libs/api";
import {
  buildOdraProxyTransaction,
  buildTransferInnerArgs,
  buildApproveInnerArgs,
} from "@/libs/odra-proxy";
import type { TransferPayload, ApprovePayload } from "@/types/core";

type HooksOptions<TData = unknown, TError = Error, TVariables = void> = {
  options?: Omit<UseMutationOptions<TData, TError, TVariables>, "mutationFn">;
};

type QueryHooksOptions<TData = unknown, TError = Error> = {
  options?: Omit<UseQueryOptions<TData, TError>, "queryKey" | "queryFn">;
};

interface TokenResponse {
  name: string;
  symbol: string;
  decimals: number;
  total_supply: string;
  balance: string | null;
  is_authorized: boolean | null;
}

// ============== Mutations (keep SDK) ==============

export function useTransfer({
  options,
}: HooksOptions<string, Error, TransferPayload> = {}) {
  const clickRef = useClickRef();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      recipient,
      amount,
      waitForConfirmation,
    }: TransferPayload) => {
      if (!clickRef) throw new Error("Click ref not initialized");

      const activeAccount = clickRef.currentAccount;
      if (!activeAccount) throw new Error("No active account");

      const senderPublicKey = PublicKey.fromHex(activeAccount.public_key);

      const innerArgs = buildTransferInnerArgs(recipient, amount);

      const transactionJson = await buildOdraProxyTransaction({
        senderPublicKey,
        packageHash: CUSD_CONTRACT,
        entryPoint: "transfer",
        innerArgs,
        attachedValue: "0",
        paymentAmount: 3_000_000_000,
      });

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
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["cusd", "balance"] });
    },
    ...options,
  });
}

export function useApprove({
  options,
}: HooksOptions<string, Error, ApprovePayload> = {}) {
  const clickRef = useClickRef();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      spender,
      amount,
      waitForConfirmation,
    }: ApprovePayload) => {
      if (!clickRef) throw new Error("Click ref not initialized");

      const activeAccount = clickRef.currentAccount;
      if (!activeAccount) throw new Error("No active account");

      const senderPublicKey = PublicKey.fromHex(activeAccount.public_key);

      const innerArgs = buildApproveInnerArgs(spender, amount);

      const transactionJson = await buildOdraProxyTransaction({
        senderPublicKey,
        packageHash: CUSD_CONTRACT,
        entryPoint: "approve",
        innerArgs,
        attachedValue: "0",
        paymentAmount: 3_000_000_000,
      });

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
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["cusd"] });
    },
    ...options,
  });
}

// ============== Queries (use apiClient) ==============

interface FungibleTokenOwnership {
  data: Array<{
    contract_package_hash: string;
    balance: string;
  }>;
}

export function useBalanceOf(
  owner: string,
  { options }: QueryHooksOptions<string> = {}
) {
  return useQuery({
    queryKey: ["cusd", "balance", owner],
    queryFn: async () => {
      const contractHash = CUSD_CONTRACT.replace("hash-", "");
      const { data } = await apiClient.get<FungibleTokenOwnership>(
        `/casper/accounts/${owner}/ft-token-ownership`
      );

      const token = data.data?.find(
        (t) => t.contract_package_hash === contractHash
      );
      return token?.balance || "0";
    },
    enabled: !!owner,
    ...options,
  });
}

export function useTotalSupply({ options }: QueryHooksOptions<string> = {}) {
  return useQuery({
    queryKey: ["cusd", "total-supply"],
    queryFn: async () => {
      const { data } = await apiClient.get<TokenResponse>("/stayer/cusd");
      return data.total_supply;
    },
    ...options,
  });
}

export function useTokenInfo({
  options,
}: QueryHooksOptions<{ name: string; symbol: string; decimals: number }> = {}) {
  return useQuery({
    queryKey: ["cusd", "info"],
    queryFn: async () => {
      const { data } = await apiClient.get<TokenResponse>("/stayer/cusd");
      return {
        name: data.name,
        symbol: data.symbol,
        decimals: data.decimals,
      };
    },
    staleTime: Infinity,
    ...options,
  });
}

export function useTokenName({ options }: QueryHooksOptions<string> = {}) {
  return useQuery({
    queryKey: ["cusd", "name"],
    queryFn: async () => {
      const { data } = await apiClient.get<TokenResponse>("/stayer/cusd");
      return data.name;
    },
    staleTime: Infinity,
    ...options,
  });
}

export function useTokenSymbol({ options }: QueryHooksOptions<string> = {}) {
  return useQuery({
    queryKey: ["cusd", "symbol"],
    queryFn: async () => {
      const { data } = await apiClient.get<TokenResponse>("/stayer/cusd");
      return data.symbol;
    },
    staleTime: Infinity,
    ...options,
  });
}

export function useTokenDecimals({ options }: QueryHooksOptions<number> = {}) {
  return useQuery({
    queryKey: ["cusd", "decimals"],
    queryFn: async () => {
      const { data } = await apiClient.get<TokenResponse>("/stayer/cusd");
      return data.decimals;
    },
    staleTime: Infinity,
    ...options,
  });
}

export function useIsAuthorized(
  address: string,
  { options }: QueryHooksOptions<boolean> = {}
) {
  return useQuery({
    queryKey: ["cusd", "is-authorized", address],
    queryFn: async () => {
      const { data } = await apiClient.get<TokenResponse>("/stayer/cusd", {
        params: { check_authorized: address },
      });
      return data.is_authorized || false;
    },
    enabled: !!address,
    ...options,
  });
}
