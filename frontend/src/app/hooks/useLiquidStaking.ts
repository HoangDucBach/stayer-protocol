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
import { LIQUID_STAKING_CONTRACT, CASPER_CHAIN_NAME } from "@/configs/constants";
import { waitForDeployOrTransaction } from "@/libs/casper";
import type {
  StakePayload,
  UnstakePayload,
  ClaimPayload,
  LiquidStakingStats,
  UserStake,
  WithdrawalRequest,
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

export function useStake({ options }: HooksOptions<string, Error, StakePayload> = {}) {
  const clickRef = useClickRef();

  return useMutation({
    mutationFn: async ({ validatorPublicKey, amount, currentEra, waitForConfirmation }: StakePayload) => {
      if (!clickRef) throw new Error("Click ref not initialized");

      const activeAccount = clickRef.currentAccount;
      if (!activeAccount) throw new Error("No active account");

      const senderPublicKey = PublicKey.fromHex(activeAccount.public_key);

      const args = Args.fromMap({
        validator_pubkey: CLValue.newCLPublicKey(PublicKey.fromHex(validatorPublicKey)),
        current_era: CLValue.newCLUint64(currentEra),
      });

      const transaction = new ContractCallBuilder()
        .from(senderPublicKey)
        .byHash(LIQUID_STAKING_CONTRACT)
        .entryPoint("stake")
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

export function useUnstake({ options }: HooksOptions<string, Error, UnstakePayload> = {}) {
  const clickRef = useClickRef();

  return useMutation({
    mutationFn: async ({ validatorPublicKey, yscspr_amount, currentEra, waitForConfirmation }: UnstakePayload) => {
      if (!clickRef) throw new Error("Click ref not initialized");

      const activeAccount = clickRef.currentAccount;
      if (!activeAccount) throw new Error("No active account");

      const senderPublicKey = PublicKey.fromHex(activeAccount.public_key);

      const args = Args.fromMap({
        validator_pubkey: CLValue.newCLPublicKey(PublicKey.fromHex(validatorPublicKey)),
        yscspr_amount: CLValue.newCLUInt256(yscspr_amount),
        current_era: CLValue.newCLUint64(currentEra),
      });

      const transaction = new ContractCallBuilder()
        .from(senderPublicKey)
        .byHash(LIQUID_STAKING_CONTRACT)
        .entryPoint("unstake")
        .runtimeArgs(args)
        .chainName(CASPER_CHAIN_NAME)
        .payment(3_000_000_000) // 3 CSPR for gas
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

export function useClaim({ options }: HooksOptions<string, Error, ClaimPayload> = {}) {
  const clickRef = useClickRef();

  return useMutation({
    mutationFn: async ({ requestId, waitForConfirmation }: ClaimPayload) => {
      if (!clickRef) throw new Error("Click ref not initialized");

      const activeAccount = clickRef.currentAccount;
      if (!activeAccount) throw new Error("No active account");

      const senderPublicKey = PublicKey.fromHex(activeAccount.public_key);

      const args = Args.fromMap({
        request_id: CLValue.newCLUint64(requestId),
      });

      const transaction = new ContractCallBuilder()
        .from(senderPublicKey)
        .byHash(LIQUID_STAKING_CONTRACT)
        .entryPoint("claim_withdrawal")
        .runtimeArgs(args)
        .chainName(CASPER_CHAIN_NAME)
        .payment(3_000_000_000) // 3 CSPR for gas
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

export function useGetStats({ options }: QueryHooksOptions<LiquidStakingStats> = {}) {
  const clickRef = useClickRef();

  return useQuery({
    queryKey: ["liquid-staking", "stats"],
    queryFn: async () => {
      if (!clickRef) throw new Error("Click ref not initialized");

      const rpcClient = createRpcClient(clickRef);
      const contractKey = `hash-${LIQUID_STAKING_CONTRACT}`;

      // Query each named key from the contract
      const [totalStakedResult, pendingWithdrawalResult, rewardsResult, exchangeRateResult] =
        await Promise.all([
          rpcClient.queryLatestGlobalState(contractKey, ["total_staked"]),
          rpcClient.queryLatestGlobalState(contractKey, ["total_pending_withdrawal"]),
          rpcClient.queryLatestGlobalState(contractKey, ["cumulative_rewards"]),
          rpcClient.queryLatestGlobalState(contractKey, ["exchange_rate"]),
        ]);

      return {
        total_staked: totalStakedResult.storedValue?.clValue?.toString() || "0",
        total_pending_withdrawal: pendingWithdrawalResult.storedValue?.clValue?.toString() || "0",
        cumulative_rewards: rewardsResult.storedValue?.clValue?.toString() || "0",
        exchange_rate: exchangeRateResult.storedValue?.clValue?.toString() || "1000000000",
      } as LiquidStakingStats;
    },
    enabled: !!clickRef,
    ...options,
  });
}

export function useGetUserStake(
  userAddress: string,
  validatorPublicKey: string,
  { options }: QueryHooksOptions<UserStake> = {}
) {
  const clickRef = useClickRef();

  return useQuery({
    queryKey: ["liquid-staking", "user-stake", userAddress, validatorPublicKey],
    queryFn: async () => {
      if (!clickRef) throw new Error("Click ref not initialized");

      const rpcClient = createRpcClient(clickRef);

      // Query user stakes dictionary
      // Dictionary key is typically a hash of user + validator
      const dictKey = `${userAddress}_${validatorPublicKey}`;
      const contractKey = `hash-${LIQUID_STAKING_CONTRACT}`;

      try {
        const result = await rpcClient.getDictionaryItemByIdentifier(null, {
          contractNamedKey: {
            key: contractKey,
            dictionaryName: "user_stakes",
            dictionaryItemKey: dictKey,
          },
        });

        return {
          amount: result.storedValue?.clValue?.toString() || "0",
        } as UserStake;
      } catch {
        return { amount: "0" } as UserStake;
      }
    },
    enabled: !!clickRef && !!userAddress && !!validatorPublicKey,
    ...options,
  });
}

export function useGetWithdrawalRequest(
  requestId: number,
  { options }: QueryHooksOptions<WithdrawalRequest> = {}
) {
  const clickRef = useClickRef();

  return useQuery({
    queryKey: ["liquid-staking", "withdrawal-request", requestId],
    queryFn: async () => {
      if (!clickRef) throw new Error("Click ref not initialized");

      const rpcClient = createRpcClient(clickRef);
      const contractKey = `hash-${LIQUID_STAKING_CONTRACT}`;

      try {
        const result = await rpcClient.getDictionaryItemByIdentifier(null, {
          contractNamedKey: {
            key: contractKey,
            dictionaryName: "withdrawal_requests",
            dictionaryItemKey: requestId.toString(),
          },
        });

        // Parse the stored value - adjust based on actual contract storage format
        const storedValue = result.storedValue?.clValue;
        if (!storedValue) {
          return {
            user: "",
            amount: "0",
            unlock_era: 0,
            status: "Pending",
          } as WithdrawalRequest;
        }

        // Parse from CLValue map
        const mapValue = storedValue.map;
        if (mapValue) {
          return {
            user: mapValue.get("user")?.stringVal?.toString() || "",
            amount: mapValue.get("amount")?.ui256?.toString() || "0",
            unlock_era: Number(mapValue.get("unlock_era")?.ui64?.toString() || 0),
            status: (mapValue.get("status")?.stringVal?.toString() as "Pending" | "Claimed") || "Pending",
          } as WithdrawalRequest;
        }

        return {
          user: "",
          amount: storedValue.toString() || "0",
          unlock_era: 0,
          status: "Pending",
        } as WithdrawalRequest;
      } catch {
        return {
          user: "",
          amount: "0",
          unlock_era: 0,
          status: "Pending",
        } as WithdrawalRequest;
      }
    },
    enabled: !!clickRef && requestId > 0,
    ...options,
  });
}

export function useGetExchangeRate({ options }: QueryHooksOptions<string> = {}) {
  const clickRef = useClickRef();

  return useQuery({
    queryKey: ["liquid-staking", "exchange-rate"],
    queryFn: async () => {
      if (!clickRef) throw new Error("Click ref not initialized");

      const rpcClient = createRpcClient(clickRef);
      const contractKey = `hash-${LIQUID_STAKING_CONTRACT}`;

      const result = await rpcClient.queryLatestGlobalState(contractKey, ["exchange_rate"]);
      return result.storedValue?.clValue?.toString() || "1000000000";
    },
    enabled: !!clickRef,
    ...options,
  });
}
