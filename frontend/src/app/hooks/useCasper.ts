import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { useClickRef } from "@make-software/csprclick-ui";
import { HttpHandler, RpcClient } from "casper-js-sdk";

function createRpcClient(clickRef: ReturnType<typeof useClickRef>) {
  const proxy = clickRef?.getCsprCloudProxy();
  if (!proxy) throw new Error("CSPR.cloud proxy not available");

  const handler = new HttpHandler(proxy.RpcURL);
  handler.setCustomHeaders({ Authorization: proxy.RpcDigestToken });
  return new RpcClient(handler);
}

type QueryHooksOptions<TData = unknown, TError = Error> = {
  options?: Omit<UseQueryOptions<TData, TError>, "queryKey" | "queryFn">;
};

export type ValidatorBid = {
  publicKey: string;
  stakedAmount: string;
  delegationRate: number;
  inactive: boolean;
  delegatorsCount: number;
  totalDelegated: string;
};

export type AuctionInfo = {
  stateRootHash: string;
  blockHeight: number;
  eraValidators: {
    eraId: number;
    validatorWeights: { publicKey: string; weight: string }[];
  }[];
  bids: ValidatorBid[];
};

export function useGetAuctionInfo({ options }: QueryHooksOptions<AuctionInfo> = {}) {
  const clickRef = useClickRef();

  return useQuery({
    queryKey: ["casper", "auction-info"],
    queryFn: async () => {
      if (!clickRef) throw new Error("Click ref not initialized");

      const rpcClient = createRpcClient(clickRef);
      const result = await rpcClient.getStateAuctionInfo();

      const bids: ValidatorBid[] = result.auctionState.bids.map((bid) => {
        const delegators = bid.bid.delegators || [];
        const totalDelegated = delegators.reduce(
          (sum, d) => sum + BigInt(d.stakedAmount?.toString() || "0"),
          BigInt(0)
        );

        return {
          publicKey: bid.publicKey.toHex(),
          stakedAmount: bid.bid.stakedAmount?.toString() || "0",
          delegationRate: bid.bid.delegationRate || 0,
          inactive: bid.bid.inactive || false,
          delegatorsCount: delegators.length,
          totalDelegated: totalDelegated.toString(),
        };
      });

      const eraValidators = result.auctionState.eraValidators?.map((era) => ({
        eraId: era.eraId,
        validatorWeights: era.validatorWeights.map((v) => ({
          publicKey: v.publicKey.toHex(),
          weight: v.weight.toString(),
        })),
      })) || [];

      return {
        stateRootHash: result.auctionState.stateRootHash || "",
        blockHeight: result.auctionState.blockHeight || 0,
        eraValidators,
        bids,
      } as AuctionInfo;
    },
    enabled: !!clickRef,
    staleTime: 60000,
    ...options,
  });
}

export function useGetValidatorBid(
  publicKey: string,
  { options }: QueryHooksOptions<ValidatorBid | null> = {}
) {
  const clickRef = useClickRef();

  return useQuery({
    queryKey: ["casper", "validator-bid", publicKey],
    queryFn: async () => {
      if (!clickRef) throw new Error("Click ref not initialized");

      const rpcClient = createRpcClient(clickRef);
      const result = await rpcClient.getStateAuctionInfo();

      const bid = result.auctionState.bids.find(
        (b) => b.publicKey.toHex().toLowerCase() === publicKey.toLowerCase()
      );

      if (!bid) return null;

      const delegators = bid.bid.delegators || [];
      const totalDelegated = delegators.reduce(
        (sum, d) => sum + BigInt(d.stakedAmount?.toString() || "0"),
        BigInt(0)
      );

      return {
        publicKey: bid.publicKey.toHex(),
        stakedAmount: bid.bid.stakedAmount?.toString() || "0",
        delegationRate: bid.bid.delegationRate || 0,
        inactive: bid.bid.inactive || false,
        delegatorsCount: delegators.length,
        totalDelegated: totalDelegated.toString(),
      } as ValidatorBid;
    },
    enabled: !!clickRef && !!publicKey,
    staleTime: 60000,
    ...options,
  });
}

export type EraInfo = {
  eraId: number;
};

export function useGetCurrentEra({ options }: QueryHooksOptions<number> = {}) {
  const clickRef = useClickRef();

  return useQuery({
    queryKey: ["casper", "current-era"],
    queryFn: async () => {
      if (!clickRef) throw new Error("Click ref not initialized");

      const rpcClient = createRpcClient(clickRef);
      const result = await rpcClient.getStateAuctionInfo();

      const eraValidators = result.auctionState.eraValidators || [];
      if (eraValidators.length === 0) return 0;

      return Math.max(...eraValidators.map((e) => e.eraId));
    },
    enabled: !!clickRef,
    staleTime: 30000,
    ...options,
  });
}

export type AccountBalance = {
  balance: string;
  balanceFormatted: string;
};

export function useGetAccountBalance(
  publicKey: string,
  { options }: QueryHooksOptions<AccountBalance> = {}
) {
  const clickRef = useClickRef();

  return useQuery({
    queryKey: ["casper", "account-balance", publicKey],
    queryFn: async () => {
      if (!clickRef) throw new Error("Click ref not initialized");

      const rpcClient = createRpcClient(clickRef);
      const result = await rpcClient.getAccountBalance(publicKey);

      const balance = result.balance?.toString() || "0";
      const balanceBigInt = BigInt(balance);
      const formatted = (Number(balanceBigInt) / 1e9).toFixed(4);

      return {
        balance,
        balanceFormatted: formatted,
      } as AccountBalance;
    },
    enabled: !!clickRef && !!publicKey,
    ...options,
  });
}

export function useGetLatestBlockInfo({ options }: QueryHooksOptions<{ height: number; hash: string; timestamp: string }> = {}) {
  const clickRef = useClickRef();

  return useQuery({
    queryKey: ["casper", "latest-block"],
    queryFn: async () => {
      if (!clickRef) throw new Error("Click ref not initialized");

      const rpcClient = createRpcClient(clickRef);
      const result = await rpcClient.getLatestBlock();

      return {
        height: result.block?.header?.height || 0,
        hash: result.block?.hash?.toHex() || "",
        timestamp: result.block?.header?.timestamp?.toString() || "",
      };
    },
    enabled: !!clickRef,
    staleTime: 10000,
    ...options,
  });
}
