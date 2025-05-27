import {
  useState,
  createContext,
  useCallback,
  useContext,
  useEffect,
} from "react";
import { useNftContext } from "./NftContext";
import { toast } from "sonner";
import { useFetchNFTMetadata } from "@/hooks/useFetchNFTMetadata";
import { usePublicClient, useReadContract } from "wagmi";
import {
  NFT_MARKETPLACE_CONTRACT_ADDRESS,
  NFT_MARKETPLACE_NFT_ABI,
} from "@/constants";
import { useWallet } from "@/hooks/useWallet";
import { MarketplaceNft } from "@/types";

interface MarketplaceContextType {
  marketplaceNFTs: MarketplaceNft[];
  proceeds: bigint;
  refetchProceeds: () => void;
  checkIsOwner: (tokenId: bigint) => Promise<void>;
  checkItemIsListed: (tokenId: bigint) => Promise<void>;
}

const MarketplaceContext = createContext<MarketplaceContextType>(
  {} as MarketplaceContextType
);

export function MarketplaceProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const publicClient = usePublicClient();
  const { refetchBalance } = useWallet();
  const { address, tokenCounter, refetchMyNFTCount } = useNftContext();
  const {
    getOwnerAddress,
    filterListedTokenIds,
    fetchMarketData,
    getListItem,
  } = useFetchNFTMetadata();

  const [marketplaceNFTs, setMarketplaceNFTs] = useState<MarketplaceNft[]>([]);

  const { data: proceedsData, refetch: refetchProceeds } = useReadContract({
    address: NFT_MARKETPLACE_CONTRACT_ADDRESS,
    abi: NFT_MARKETPLACE_NFT_ABI,
    functionName: "getProceeds",
    args: [address!],
    query: {
      enabled: !!address,
    },
  });

  const proceeds = (proceedsData as bigint) || 0n;

  const checkIsOwner = useCallback(
    async (tokenId: bigint) => {
      // 判断tokenId是否存在
      if (tokenId >= tokenCounter!) {
        toast.error("Invalid token ID.");
        throw new Error("Invalid token ID.");
      }

      // 检查当前用户是否为NFT所有者
      const ownerAddress = await getOwnerAddress(tokenId);
      if (address!.toLowerCase() !== ownerAddress.toLowerCase()) {
        toast.error("You are not the owner of this NFT");
        throw new Error("You are not the owner of this NFT");
      }
    },
    [address, tokenCounter, getOwnerAddress]
  );

  // 检查是否已上架
  const checkItemIsListed = useCallback(
    async (tokenId: bigint) => {
      const listItem = await getListItem(tokenId);
      if (listItem.price > 0n) {
        toast.error("NFT already listed.");
        throw new Error("NFT already listed.");
      }
    },
    [getListItem]
  );

  const fetchMarketNFTs = useCallback(async () => {
    const listedTokenIds = await filterListedTokenIds();
    const metadataPromises = listedTokenIds.map(fetchMarketData);
    const results = await Promise.all(metadataPromises);
    const filteredResults = results.filter(
      (nft) => nft !== null
    ) as MarketplaceNft[];
    setMarketplaceNFTs(filteredResults);
  }, [filterListedTokenIds, fetchMarketData]);

  useEffect(() => {
    fetchMarketNFTs();

    const unWatchItemBought = publicClient?.watchContractEvent({
      address: NFT_MARKETPLACE_CONTRACT_ADDRESS,
      abi: NFT_MARKETPLACE_NFT_ABI,
      eventName: "ItemBought",
      onLogs: async (logs) => {
        console.log("监听购买事件", logs);
        refetchBalance();
        refetchMyNFTCount();
        fetchMarketNFTs();
      },
    });

    const unWatchItemListed = publicClient?.watchContractEvent({
      address: NFT_MARKETPLACE_CONTRACT_ADDRESS,
      abi: NFT_MARKETPLACE_NFT_ABI,
      eventName: "ItemListed",
      onLogs: async (logs) => {
        console.log("监听上架事件", logs);
        fetchMarketNFTs();
      },
    });

    const unWatchItemCanceled = publicClient?.watchContractEvent({
      address: NFT_MARKETPLACE_CONTRACT_ADDRESS,
      abi: NFT_MARKETPLACE_NFT_ABI,
      eventName: "ItemCanceled",
      onLogs: async (logs) => {
        console.log("监听取消事件", logs);
        fetchMarketNFTs();
      },
    });
    return () => {
      unWatchItemBought!();
      unWatchItemListed!();
      unWatchItemCanceled!();
    };
  }, [address, refetchMyNFTCount, refetchBalance]);

  const value = {
    marketplaceNFTs,
    proceeds,
    refetchProceeds,
    checkIsOwner,
    checkItemIsListed,
  };

  return (
    <MarketplaceContext.Provider value={value}>
      {children}
    </MarketplaceContext.Provider>
  );
}

export function useMarketplaceContext() {
  const context = useContext(MarketplaceContext);
  if (!context) {
    throw new Error(
      "useMarketplaceContext must be used within a MarketplaceProvider"
    );
  }
  return context;
}
