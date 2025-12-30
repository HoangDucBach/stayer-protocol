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
import { CUSD_CONTRACT, CASPER_CHAIN_NAME } from "@/configs/constants";
import { waitForDeployOrTransaction } from "@/libs/casper";
import type { TransferPayload, ApprovePayload } from "@/types/core";

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

export function useTransfer({ options }: HooksOptions<string, Error, TransferPayload> = {}) {
  const clickRef = useClickRef();

  return useMutation({
    mutationFn: async ({ recipient, amount, waitForConfirmation }: TransferPayload) => {
      if (!clickRef) throw new Error("Click ref not initialized");

      const activeAccount = clickRef.currentAccount;
      if (!activeAccount) throw new Error("No active account");

      const senderPublicKey = PublicKey.fromHex(activeAccount.public_key);

      const args = Args.fromMap({
        recipient: CLValue.newCLByteArray(Buffer.from(recipient, "hex")),
        amount: CLValue.newCLUInt256(amount),
      });

      const transaction = new ContractCallBuilder()
        .from(senderPublicKey)
        .byHash(CUSD_CONTRACT)
        .entryPoint("transfer")
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

export function useApprove({ options }: HooksOptions<string, Error, ApprovePayload> = {}) {
  const clickRef = useClickRef();

  return useMutation({
    mutationFn: async ({ spender, amount, waitForConfirmation }: ApprovePayload) => {
      if (!clickRef) throw new Error("Click ref not initialized");

      const activeAccount = clickRef.currentAccount;
      if (!activeAccount) throw new Error("No active account");

      const senderPublicKey = PublicKey.fromHex(activeAccount.public_key);

      const args = Args.fromMap({
        spender: CLValue.newCLByteArray(Buffer.from(spender, "hex")),
        amount: CLValue.newCLUInt256(amount),
      });

      const transaction = new ContractCallBuilder()
        .from(senderPublicKey)
        .byHash(CUSD_CONTRACT)
        .entryPoint("approve")
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

export function useBalanceOf(
  owner: string,
  { options }: QueryHooksOptions<string> = {}
) {
  const clickRef = useClickRef();

  return useQuery({
    queryKey: ["cusd", "balance", owner],
    queryFn: async () => {
      if (!clickRef) throw new Error("Click ref not initialized");

      const rpcClient = createRpcClient(clickRef);
      const contractKey = `hash-${CUSD_CONTRACT}`;

      try {
        const result = await rpcClient.getDictionaryItemByIdentifier(null, {
          contractNamedKey: {
            key: contractKey,
            dictionaryName: "balances",
            dictionaryItemKey: owner,
          },
        });

        return result.storedValue?.clValue?.toString() || "0";
      } catch {
        return "0";
      }
    },
    enabled: !!clickRef && !!owner,
    ...options,
  });
}

export function useTotalSupply({ options }: QueryHooksOptions<string> = {}) {
  const clickRef = useClickRef();

  return useQuery({
    queryKey: ["cusd", "total-supply"],
    queryFn: async () => {
      if (!clickRef) throw new Error("Click ref not initialized");

      const rpcClient = createRpcClient(clickRef);
      const contractKey = `hash-${CUSD_CONTRACT}`;

      const result = await rpcClient.queryLatestGlobalState(contractKey, ["total_supply"]);
      return result.storedValue?.clValue?.toString() || "0";
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
    queryKey: ["cusd", "allowance", owner, spender],
    queryFn: async () => {
      if (!clickRef) throw new Error("Click ref not initialized");

      const rpcClient = createRpcClient(clickRef);
      const contractKey = `hash-${CUSD_CONTRACT}`;

      try {
        // Allowance dictionary key is typically owner_spender
        const dictKey = `${owner}_${spender}`;
        const result = await rpcClient.getDictionaryItemByIdentifier(null, {
          contractNamedKey: {
            key: contractKey,
            dictionaryName: "allowances",
            dictionaryItemKey: dictKey,
          },
        });

        return result.storedValue?.clValue?.toString() || "0";
      } catch {
        return "0";
      }
    },
    enabled: !!clickRef && !!owner && !!spender,
    ...options,
  });
}

export function useTokenName({ options }: QueryHooksOptions<string> = {}) {
  const clickRef = useClickRef();

  return useQuery({
    queryKey: ["cusd", "name"],
    queryFn: async () => {
      if (!clickRef) throw new Error("Click ref not initialized");

      const rpcClient = createRpcClient(clickRef);
      const contractKey = `hash-${CUSD_CONTRACT}`;

      const result = await rpcClient.queryLatestGlobalState(contractKey, ["name"]);
      return result.storedValue?.clValue?.toString() || "CUSD";
    },
    enabled: !!clickRef,
    staleTime: Infinity,
    ...options,
  });
}

export function useTokenSymbol({ options }: QueryHooksOptions<string> = {}) {
  const clickRef = useClickRef();

  return useQuery({
    queryKey: ["cusd", "symbol"],
    queryFn: async () => {
      if (!clickRef) throw new Error("Click ref not initialized");

      const rpcClient = createRpcClient(clickRef);
      const contractKey = `hash-${CUSD_CONTRACT}`;

      const result = await rpcClient.queryLatestGlobalState(contractKey, ["symbol"]);
      return result.storedValue?.clValue?.toString() || "CUSD";
    },
    enabled: !!clickRef,
    staleTime: Infinity,
    ...options,
  });
}

export function useTokenDecimals({ options }: QueryHooksOptions<number> = {}) {
  const clickRef = useClickRef();

  return useQuery({
    queryKey: ["cusd", "decimals"],
    queryFn: async () => {
      if (!clickRef) throw new Error("Click ref not initialized");

      const rpcClient = createRpcClient(clickRef);
      const contractKey = `hash-${CUSD_CONTRACT}`;

      const result = await rpcClient.queryLatestGlobalState(contractKey, ["decimals"]);
      return Number(result.storedValue?.clValue?.toString() || "9");
    },
    enabled: !!clickRef,
    staleTime: Infinity,
    ...options,
  });
}
