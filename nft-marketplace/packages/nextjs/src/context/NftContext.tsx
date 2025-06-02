import {
  useContext,
  createContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import {
  useAccount,
  usePublicClient,
  useReadContract,
  type UseReadContractParameters,
} from "wagmi";
import { Address, WatchContractEventReturnType } from "viem";
import {
  RANDOMIPFSNFT_ABI,
  RANDOMIPFSNFT_CONTRACT_ADDRESS,
} from "@/constants/randomIpfsNft";
import { BigintType, ReRetchType, ActionProgress, UserNft } from "@/types";
import { toast } from "sonner";
import { useFetchNFTMetadata } from "@/hooks/useFetchNFTMetadata";

const randomContractConfig: UseReadContractParameters = {
  address: RANDOMIPFSNFT_CONTRACT_ADDRESS,
  abi: RANDOMIPFSNFT_ABI,
};

interface NftContextType {
  address: Address | undefined;
  mintFee: BigintType;
  tokenCounter: BigintType;
  myNFTCount: BigintType;
  userNFTs: UserNft[];
  isFetching: boolean;
  actionProgress: ActionProgress;
  fetchUserNFTs: (reset?: boolean) => Promise<void>;
  updateUserNFT: (tokenId: bigint, newPrice?: bigint) => void;
  refetchTokenCounter: () => ReRetchType;
  refetchMyNFTCount: () => ReRetchType;
  setActionProgress: (args: ActionProgress) => void;
}

const NftContext = createContext<NftContextType>({} as NftContextType);

export function NftProvider({ children }: { children: React.ReactNode }) {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { fetchOwnerAddress, fetchUserData } = useFetchNFTMetadata();

  const [userNFTs, setUserNFTs] = useState<UserNft[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [actionProgress, setActionProgress] = useState<ActionProgress>({
    stage: "idle",
    progress: 0,
    message: "",
  });

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

  const fetchUserNFTs = useCallback(
    async (reset = false) => {
      if (reset) {
        setUserNFTs([]);
        return;
      }
      
      try {
        const { data: newTokenCounter } = await refetchTokenCounter();
        const results = await Promise.all(
          Array.from({ length: Number(newTokenCounter) }, async (_, i) => {
            const owner = await fetchOwnerAddress(BigInt(i));
            return owner === address ? await fetchUserData(BigInt(i)) : null;
          })
        );

        const filteredResults = results.filter(
          (nft) => nft !== null
        ) as UserNft[];
        setUserNFTs(filteredResults);
      } catch (error) {
        toast.error("Failed to fetch user NFTs");
        throw error;
      } finally {
        setIsFetching(false);
      }
    },
    [address, refetchTokenCounter, fetchOwnerAddress, fetchUserData]
  );

  const updateUserNFT = async (tokenId: bigint, newPrice?: bigint) => {
    setUserNFTs((prevNFTs) =>
      prevNFTs.map((nft) =>
        nft.tokenId === tokenId ? { ...nft, price: newPrice } : nft
      )
    );
  };

  // 获取最新的NFT并添加到列表中
  const fetchNewNFT = async (tokenId: bigint) => {
    const newNFT = await fetchUserData(tokenId);
    setUserNFTs((prevNFTs) => [...prevNFTs, newNFT as UserNft]);
    await refetchMyNFTCount();
  };

  useEffect(() => {
    const init = async () => {
      if (!address) return;
      setIsFetching(true);
      await new Promise((resolve) => setTimeout(resolve, 500));
      await fetchUserNFTs();
      setIsFetching(false);
    };
    init();

    let unWatchRandomMinted: WatchContractEventReturnType | undefined;
    let unWatchCustomMinted: WatchContractEventReturnType | undefined;
    const setEventWatcher = async () => {
      const latestBlockNumber = await publicClient?.getBlockNumber();
      if (!latestBlockNumber) return;

      unWatchRandomMinted = publicClient?.watchContractEvent({
        address: RANDOMIPFSNFT_CONTRACT_ADDRESS,
        abi: RANDOMIPFSNFT_ABI,
        eventName: "NFTMinted",
        fromBlock: latestBlockNumber + 1n, // 从最新区块号开始监听
        onLogs: async (logs) => {
          console.log("NFTMinted event args:", logs);
          const { data: newTokenCounter } = await refetchTokenCounter();
          const newTokenId =
            typeof newTokenCounter === "bigint"
              ? newTokenCounter - 1n
              : undefined;
          if (newTokenId !== undefined) {
            fetchNewNFT(newTokenId);
          }
          setActionProgress({
            stage: "complete",
            progress: 100,
            message: `🎉 Successfully Minted NFT with Token ID:${newTokenId}`,
          });
          toast.success("Mint NFT successfully.");
        },
      });

      unWatchCustomMinted = publicClient?.watchContractEvent({
        address: RANDOMIPFSNFT_CONTRACT_ADDRESS,
        abi: RANDOMIPFSNFT_ABI,
        eventName: "NFTCustomMinted",
        fromBlock: latestBlockNumber + 1n,
        onLogs: async (logs) => {
          console.log("NFTCustomMinted event args:", logs);
          const { data: newTokenCounter } = await refetchTokenCounter();
          const newTokenId =
            typeof newTokenCounter === "bigint"
              ? newTokenCounter - 1n
              : undefined;
          if (newTokenId !== undefined) {
            fetchNewNFT(newTokenId);
          }
          toast.success("Custom Mint NFT successfully.");
        },
      });
    };

    setEventWatcher();

    return () => {
      if (unWatchRandomMinted) unWatchRandomMinted!();
      if (unWatchCustomMinted) unWatchCustomMinted!();
    };
  }, [address, publicClient, refetchTokenCounter]);

  const value = {
    address,
    mintFee: mintFee as BigintType,
    tokenCounter: tokenCounter as BigintType,
    myNFTCount: myNFTCount as BigintType,
    userNFTs,
    isFetching,
    actionProgress,
    refetchTokenCounter,
    refetchMyNFTCount,
    fetchUserNFTs,
    updateUserNFT,
    setActionProgress,
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
