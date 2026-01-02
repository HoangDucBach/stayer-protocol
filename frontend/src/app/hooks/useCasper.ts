import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { useClickRef } from "@make-software/csprclick-ui";
import {
  HttpHandler,
  RpcClient,
  PurseIdentifier,
  PublicKey,
  BidKindWrapper,
  EraValidators,
  ValidatorWeightAuction,
} from "casper-js-sdk";

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

export type ValidatorBidInfo = {
  publicKey: string;
  stakedAmount: string;
  delegationRate: number;
  inactive: boolean;
};

export type AuctionInfo = {
  stateRootHash: string;
  blockHeight: number;
  eraValidators: {
    eraId: number;
    validatorWeights: { publicKey: string; weight: string }[];
  }[];
  bids: ValidatorBidInfo[];
};

export function useGetAuctionInfo({ options }: QueryHooksOptions<AuctionInfo> = {}) {
  const clickRef = useClickRef();

  return useQuery({
    queryKey: ["casper", "auction-info"],
    queryFn: async () => {
      if (!clickRef) throw new Error("Click ref not initialized");

      const rpcClient = createRpcClient(clickRef);
      const result = await rpcClient.getLatestAuctionInfo();

      const bids: ValidatorBidInfo[] = result.auctionState.bids
        .filter((bidWrapper: BidKindWrapper) => bidWrapper.bid.validator || bidWrapper.bid.unified)
        .map((bidWrapper: BidKindWrapper) => {
          const validator = bidWrapper.bid.validator || bidWrapper.bid.unified;
          return {
            publicKey: bidWrapper.publicKey?.toHex() || "",
            stakedAmount: validator?.stakedAmount?.toString() || "0",
            delegationRate: validator?.delegationRate || 0,
            inactive: validator?.inactive || false,
          };
        });

      const eraValidators = result.auctionState.eraValidators?.map((era: EraValidators) => ({
        eraId: era.eraID,
        validatorWeights: era.validatorWeights.map((v: ValidatorWeightAuction) => ({
          publicKey: v.validator.toHex(),
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
  { options }: QueryHooksOptions<ValidatorBidInfo | null> = {}
) {
  const clickRef = useClickRef();

  return useQuery({
    queryKey: ["casper", "validator-bid", publicKey],
    queryFn: async () => {
      if (!clickRef) throw new Error("Click ref not initialized");

      const rpcClient = createRpcClient(clickRef);
      const result = await rpcClient.getLatestAuctionInfo();

      const bidWrapper = result.auctionState.bids.find(
        (b: BidKindWrapper) => b.publicKey?.toHex().toLowerCase() === publicKey.toLowerCase()
      );

      if (!bidWrapper) return null;

      const validator = bidWrapper.bid.validator || bidWrapper.bid.unified;
      if (!validator) return null;

      return {
        publicKey: bidWrapper.publicKey?.toHex() || "",
        stakedAmount: validator.stakedAmount?.toString() || "0",
        delegationRate: validator.delegationRate || 0,
        inactive: validator.inactive || false,
      } as ValidatorBidInfo;
    },
    enabled: !!clickRef && !!publicKey,
    staleTime: 60000,
    ...options,
  });
}

export function useGetCurrentEra({ options }: QueryHooksOptions<number> = {}) {
  const clickRef = useClickRef();

  return useQuery({
    queryKey: ["casper", "current-era"],
    queryFn: async () => {
      if (!clickRef) throw new Error("Click ref not initialized");

      const rpcClient = createRpcClient(clickRef);
      const result = await rpcClient.getLatestAuctionInfo();

      const eraValidators = result.auctionState.eraValidators || [];
      if (eraValidators.length === 0) return 0;

      return Math.max(...eraValidators.map((e: EraValidators) => e.eraID));
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
  publicKeyHex: string,
  { options }: QueryHooksOptions<AccountBalance> = {}
) {
  const clickRef = useClickRef();

  return useQuery({
    queryKey: ["casper", "account-balance", publicKeyHex],
    queryFn: async () => {
      if (!clickRef) throw new Error("Click ref not initialized");

      const rpcClient = createRpcClient(clickRef);
      const pubKey = PublicKey.fromHex(publicKeyHex);
      const purseIdentifier = PurseIdentifier.fromPublicKey(pubKey);
      const result = await rpcClient.queryLatestBalance(purseIdentifier);

      const balance = result.balance?.toString() || "0";
      const balanceBigInt = BigInt(balance);
      const formatted = (Number(balanceBigInt) / 1e9).toFixed(4);

      return {
        balance,
        balanceFormatted: formatted,
      } as AccountBalance;
    },
    enabled: !!clickRef && !!publicKeyHex,
    ...options,
  });
}

export function useGetLatestBlockInfo({ options }: QueryHooksOptions<{ height: number; hash: string; eraId: number; timestamp: string }> = {}) {
  const clickRef = useClickRef();

  return useQuery({
    queryKey: ["casper", "latest-block"],
    queryFn: async () => {
      if (!clickRef) throw new Error("Click ref not initialized");

      const rpcClient = createRpcClient(clickRef);
      const result = await rpcClient.getLatestBlock();

      return {
        height: result.block?.height || 0,
        hash: result.block?.hash?.toHex() || "",
        eraId: result.block?.eraID || 0,
        timestamp: result.block?.timestamp?.toString() || "",
      };
    },
    enabled: !!clickRef,
    staleTime: 10000,
    ...options,
  });
}
