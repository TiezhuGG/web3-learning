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
  NFTMARKETPLACE_CONTRACT_ADDRESS,
  NFTMARKETPLACE_ABI,
} from "@/constants";
import { useWallet } from "@/hooks/useWallet";
import { MarketplaceNft } from "@/types";
import { WatchContractEventReturnType } from "viem";

interface MarketplaceContextType {
  marketplaceNFTs: MarketplaceNft[];
  proceeds: bigint;
  refetchProceeds: () => void;
  checkIsOwner: (tokenId: bigint) => Promise<void>;
  checkItemIsListed: (tokenId: bigint) => Promise<void>;
  fetchMarketNFTs: () => Promise<void>;
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
  const {
    address,
    tokenCounter,
    refetchMyNFTCount,
    fetchUserNFTs,
    updateUserNFT,
    setActionProgress,
  } = useNftContext();
  const {
    fetchOwnerAddress,
    filterListedTokenIds,
    fetchMarketData,
    fetchListing,
  } = useFetchNFTMetadata();

  const [marketplaceNFTs, setMarketplaceNFTs] = useState<MarketplaceNft[]>([]);

  const { data: proceedsData, refetch: refetchProceeds } = useReadContract({
    address: NFTMARKETPLACE_CONTRACT_ADDRESS,
    abi: NFTMARKETPLACE_ABI,
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
      const ownerAddress = await fetchOwnerAddress(tokenId);
      if (address!.toLowerCase() !== ownerAddress.toLowerCase()) {
        toast.error("You are not the owner of this NFT");
        throw new Error("You are not the owner of this NFT");
      }
    },
    [address, tokenCounter, fetchOwnerAddress]
  );

  // 检查是否已上架
  const checkItemIsListed = useCallback(
    async (tokenId: bigint) => {
      const listItem = await fetchListing(tokenId);
      if (listItem.price > 0n) {
        toast.error("NFT already listed.");
        throw new Error("NFT already listed.");
      }
    },
    [fetchListing]
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

  const updateMarketNFT = async (nft: MarketplaceNft | null) => {
    setMarketplaceNFTs((prevNFTs) => {
      if (!nft) {
        return prevNFTs;
      }

      // 检查NFT是否已在市场中售卖
      const existingIndex = prevNFTs.findIndex(
        (item) => item.tokenId === nft.tokenId
      );

      if (existingIndex !== -1) {
        // NFT存在就更新
        return prevNFTs.map((item, index) =>
          existingIndex === index ? nft : item
        );
      } else {
        // 不存在就添加
        return [...prevNFTs, nft];
      }
    });
  };

  useEffect(() => {
    fetchMarketNFTs();

    let unWatchItemBought: WatchContractEventReturnType | undefined;
    let unWatchItemListed: WatchContractEventReturnType | undefined;
    let unWatchItemCanceled: WatchContractEventReturnType | undefined;

    const setEventWatcher = async () => {
      const latestBlockNumber = await publicClient?.getBlockNumber();
      if (!latestBlockNumber) return;

      unWatchItemBought = publicClient?.watchContractEvent({
        address: NFTMARKETPLACE_CONTRACT_ADDRESS,
        abi: NFTMARKETPLACE_ABI,
        eventName: "ItemBought",
        fromBlock: latestBlockNumber + 1n,
        onLogs: async (logs) => {
          console.log("ItemBought", logs);

          const args = (logs[0] as any).args;
          const { tokenId } = args;
          setMarketplaceNFTs((prevNFTs) =>
            prevNFTs.filter((nft) => nft.tokenId !== tokenId)
          );
          await fetchUserNFTs();
          await refetchBalance();
          await refetchMyNFTCount();
          toast.success("Buy NFT successfully.");
        },
      });

      unWatchItemListed = publicClient?.watchContractEvent({
        address: NFTMARKETPLACE_CONTRACT_ADDRESS,
        abi: NFTMARKETPLACE_ABI,
        eventName: "ItemListed",
        fromBlock: latestBlockNumber + 1n,
        onLogs: async (logs) => {
          console.log("ItemListed", logs);

          const args = (logs[0] as any).args;
          const { tokenId, price } = args;
          // 获取该NFT的完整市场数据
          const listedNFTData = await fetchMarketData(tokenId);
          if (listedNFTData) {
            await updateMarketNFT(listedNFTData); // 更新到市场列表
          }

          await updateUserNFT(tokenId, price);

          setActionProgress({
            stage: "complete",
            progress: 100,
            message: "🎉 Listing NFT to marketplace successfully.",
          });
          await refetchBalance();
          toast.success("update NFT status successfully.");
        },
      });

      unWatchItemCanceled = publicClient?.watchContractEvent({
        address: NFTMARKETPLACE_CONTRACT_ADDRESS,
        abi: NFTMARKETPLACE_ABI,
        eventName: "ItemCanceled",
        fromBlock: latestBlockNumber + 1n,
        onLogs: async (logs) => {
          console.log("ItemCanceled", logs);

          const args = (logs[0] as any).args;
          const { tokenId } = args;
          setMarketplaceNFTs((prevNFTs) =>
            prevNFTs.filter((nft) => nft.tokenId !== tokenId)
          );

          await updateUserNFT(tokenId);

          setActionProgress({
            stage: "complete",
            progress: 100,
            message: "🎉 UnList NFT to marketplace successfully.",
          });
          await refetchBalance();
          toast.success("unList NFT successfully.");
        },
      });
    };

    setEventWatcher();

    return () => {
      if (unWatchItemBought) unWatchItemBought();
      if (unWatchItemListed) unWatchItemListed();
      if (unWatchItemCanceled) unWatchItemCanceled();
    };
  }, [address, publicClient, refetchMyNFTCount, refetchBalance]);

  const value = {
    marketplaceNFTs,
    proceeds,
    refetchProceeds,
    checkIsOwner,
    checkItemIsListed,
    fetchMarketNFTs,
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
