import { useContext, createContext, useEffect, useState } from "react";
import {
  useAccount,
  usePublicClient,
  useReadContract,
  type UseReadContractParameters,
} from "wagmi";
import { Address, WatchContractEventReturnType } from "viem";
import {
  RANDOM_IPFS_NFT_ABI,
  RANDOM_IPFS_NFT_CONTRACT_ADDRESS,
} from "@/constants/randomIpfsNft";
import { BigintType, ReRetchType } from "@/types";
import { toast } from "sonner";

const randomContractConfig: UseReadContractParameters = {
  address: RANDOM_IPFS_NFT_CONTRACT_ADDRESS,
  abi: RANDOM_IPFS_NFT_ABI,
};

interface NftContextType {
  address: Address | undefined;
  mintFee: BigintType;
  tokenCounter: BigintType;
  myNFTCount: BigintType;
  lastMintedTokenId: BigintType;
  refetchTokenCounter: () => ReRetchType;
  refetchMyNFTCount: () => ReRetchType;
}

const NftContext = createContext<NftContextType>({} as NftContextType);

export function NftProvider({ children }: { children: React.ReactNode }) {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const [lastMintedTokenId, setLastMintedTokenId] =
    useState<BigintType>(undefined);

  useEffect(() => {
    let unwatch: WatchContractEventReturnType | undefined;

    const setEventWatcher = async () => {
      const latestBlockNumber = await publicClient?.getBlockNumber();
      if (!latestBlockNumber) return;

      // 监听NFT铸造成功的NFTMinted事件
      unwatch = publicClient?.watchContractEvent({
        address: RANDOM_IPFS_NFT_CONTRACT_ADDRESS,
        abi: RANDOM_IPFS_NFT_ABI,
        eventName: "NFTMinted",
        fromBlock: latestBlockNumber + 1n, // 从最新区块号开始监听
        onLogs: async (logs) => {
          console.log("NFTMinted event args:", logs);
          const { data: newTokenCounter } = await refetchTokenCounter();
          setLastMintedTokenId(
            typeof newTokenCounter === "bigint"
              ? newTokenCounter - 1n
              : undefined
          );
          toast.success("Mint NFT successfully.");
        },
      });
    };

    setEventWatcher();

    return () => unwatch!();
  }, [publicClient, setLastMintedTokenId]);

  const { data: mintFee } = useReadContract({
    ...randomContractConfig,
    functionName: "getMintFee",
    query: {
      enabled: !!randomContractConfig.address,
    },
  });

  const { data: tokenCounter, refetch: refetchTokenCounter } = useReadContract({
    ...randomContractConfig,
    functionName: "getTokenCounter",
    query: {
      enabled: !!randomContractConfig.address,
    },
  });

  const { data: myNFTCount, refetch: refetchMyNFTCount } = useReadContract({
    ...randomContractConfig,
    functionName: "balanceOf",
    args: [address!],
  });

  const value = {
    address,
    mintFee: mintFee as BigintType,
    tokenCounter: tokenCounter as BigintType,
    myNFTCount: myNFTCount as BigintType,
    lastMintedTokenId,
    refetchTokenCounter,
    refetchMyNFTCount,
  };

  return <NftContext.Provider value={value}>{children}</NftContext.Provider>;
}

export function useNftContext() {
  const context = useContext(NftContext);
  if (!context) {
    throw new Error("useNftContext must be used within a NftProvider");
  }
  return context;
}
