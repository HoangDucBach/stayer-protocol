import { useClickRef } from "@make-software/csprclick-ui";
import { useMutation, useQuery, UseMutationOptions, UseQueryOptions } from "@tanstack/react-query";
import { RuntimeArgs, CLValueBuilder, CLPublicKey } from "casper-js-sdk";
import { LIQUID_STAKING_CONTRACT, CASPER_CHAIN_NAME } from "@/configs/constants";

type StakePayload = {
  validatorPublicKey: string;
  amount: string;
  currentEra: number;
};

type UnstakePayload = {
  validatorPublicKey: string;
  yscspr_amount: string;
  currentEra: number;
};

type ClaimPayload = {
  requestId: number;
};

type HooksOptions<TData = unknown, TError = Error> = {
  options?: Omit<UseMutationOptions<TData, TError>, "mutationFn">;
};

type QueryHooksOptions<TData = unknown, TError = Error> = {
  options?: Omit<UseQueryOptions<TData, TError>, "queryKey" | "queryFn">;
};

export function useStake({ options }: HooksOptions<string> = {}) {
  const clickRef = useClickRef();

  return useMutation({
    mutationFn: async ({ validatorPublicKey, amount, currentEra }: StakePayload) => {
      if (!clickRef) throw new Error("Click ref not initialized");

      const deploy = await clickRef.makeDeploy(
        RuntimeArgs.fromMap({
          validator_pubkey: CLValueBuilder.key(CLPublicKey.fromHex(validatorPublicKey)),
          current_era: CLValueBuilder.u64(currentEra),
        }),
        {
          entryPoint: "stake",
          contractHash: LIQUID_STAKING_CONTRACT,
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

export function useUnstake({ options }: HooksOptions<string> = {}) {
  const clickRef = useClickRef();

  return useMutation({
    mutationFn: async ({ validatorPublicKey, yscspr_amount, currentEra }: UnstakePayload) => {
      if (!clickRef) throw new Error("Click ref not initialized");

      const deploy = await clickRef.makeDeploy(
        RuntimeArgs.fromMap({
          validator_pubkey: CLValueBuilder.key(CLPublicKey.fromHex(validatorPublicKey)),
          yscspr_amount: CLValueBuilder.u256(yscspr_amount),
          current_era: CLValueBuilder.u64(currentEra),
        }),
        {
          entryPoint: "unstake",
          contractHash: LIQUID_STAKING_CONTRACT,
        },
        CASPER_CHAIN_NAME
      );

      const result = await clickRef.send(deploy);
      return result.deployHash;
    },
    ...options,
  });
}

export function useClaim({ options }: HooksOptions<string> = {}) {
  const clickRef = useClickRef();

  return useMutation({
    mutationFn: async ({ requestId }: ClaimPayload) => {
      if (!clickRef) throw new Error("Click ref not initialized");

      const deploy = await clickRef.makeDeploy(
        RuntimeArgs.fromMap({
          request_id: CLValueBuilder.u64(requestId),
        }),
        {
          entryPoint: "claim_withdrawal",
          contractHash: LIQUID_STAKING_CONTRACT,
        },
        CASPER_CHAIN_NAME
      );

      const result = await clickRef.send(deploy);
      return result.deployHash;
    },
    ...options,
  });
}

type StatsResult = {
  total_staked: string;
  total_pending_withdrawal: string;
  cumulative_rewards: string;
  exchange_rate: string;
};

export function useGetStats({ options }: QueryHooksOptions<StatsResult> = {}) {
  const clickRef = useClickRef();

  return useQuery({
    queryKey: ["liquid-staking", "stats"],
    queryFn: async () => {
      if (!clickRef) throw new Error("Click ref not initialized");

      const result = await clickRef.callEntrypoint(
        RuntimeArgs.fromMap({}),
        {
          entryPoint: "get_stats",
          contractHash: LIQUID_STAKING_CONTRACT,
        }
      );

      return result as StatsResult;
    },
    enabled: !!clickRef,
    ...options,
  });
}

type UserStakeResult = {
  amount: string;
};

export function useGetUserStake(
  userAddress: string,
  validatorPublicKey: string,
  { options }: QueryHooksOptions<UserStakeResult> = {}
) {
  const clickRef = useClickRef();

  return useQuery({
    queryKey: ["liquid-staking", "user-stake", userAddress, validatorPublicKey],
    queryFn: async () => {
      if (!clickRef) throw new Error("Click ref not initialized");

      const result = await clickRef.callEntrypoint(
        RuntimeArgs.fromMap({
          user: CLValueBuilder.byteArray(Buffer.from(userAddress, "hex")),
          validator: CLValueBuilder.key(CLPublicKey.fromHex(validatorPublicKey)),
        }),
        {
          entryPoint: "get_user_stake",
          contractHash: LIQUID_STAKING_CONTRACT,
        }
      );

      return result as UserStakeResult;
    },
    enabled: !!clickRef && !!userAddress && !!validatorPublicKey,
    ...options,
  });
}

type WithdrawalRequest = {
  user: string;
  amount: string;
  unlock_era: number;
  status: "Pending" | "Claimed";
};

export function useGetWithdrawalRequest(
  requestId: number,
  { options }: QueryHooksOptions<WithdrawalRequest> = {}
) {
  const clickRef = useClickRef();

  return useQuery({
    queryKey: ["liquid-staking", "withdrawal-request", requestId],
    queryFn: async () => {
      if (!clickRef) throw new Error("Click ref not initialized");

      const result = await clickRef.callEntrypoint(
        RuntimeArgs.fromMap({
          request_id: CLValueBuilder.u64(requestId),
        }),
        {
          entryPoint: "get_withdrawal_request",
          contractHash: LIQUID_STAKING_CONTRACT,
        }
      );

      return result as WithdrawalRequest;
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

      const result = await clickRef.callEntrypoint(
        RuntimeArgs.fromMap({}),
        {
          entryPoint: "get_exchange_rate",
          contractHash: LIQUID_STAKING_CONTRACT,
        }
      );

      return result as string;
    },
    enabled: !!clickRef,
    ...options,
  });
}
