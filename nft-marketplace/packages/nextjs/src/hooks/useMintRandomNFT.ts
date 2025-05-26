import {
  RANDOM_IPFS_NFT_ABI,
  RANDOM_IPFS_NFT_CONTRACT_ADDRESS,
} from "@/constants";
import { useCallback, useState } from "react";
import {
  useAccount,
  useWriteContract,
  useReadContract,
  usePublicClient,
  type UseReadContractParameters,
} from "wagmi";
import { formatEther } from "viem";
import { BigintType } from "@/types";
import { useChainlinkVRF2_5Mock } from "./useChainlinkVRF2_5Mock";
import { toast } from "sonner";

const CONTRACT_ADDRESS = RANDOM_IPFS_NFT_CONTRACT_ADDRESS;
const CONTRACT_ABI = RANDOM_IPFS_NFT_ABI;

export const randomContractConfig: UseReadContractParameters = {
  address: CONTRACT_ADDRESS,
  abi: CONTRACT_ABI,
};

export function useMintRandomNFT() {
  const { address, chainId } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  const [lastMintedTokenId, setLastMintedTokenId] = useState<bigint | null>(
    null
  );
  const [isMinting, setIsMinting] = useState(false);

  const { data: mintFeeData } = useReadContract({
    ...randomContractConfig,
    functionName: "getMintFee",
  });

  const mintFee = mintFeeData as BigintType;

  const { data: tokenCounterData, refetch: refetchTokenCounter } =
    useReadContract({
      ...randomContractConfig,
      functionName: "getTokenCounter",
    });

  const tokenCounter = tokenCounterData as BigintType;

  const { data: subscriptionId } = useReadContract({
    ...randomContractConfig,
    functionName: "s_subscriptionId",
  });

  const { data: balance } = useReadContract({
    ...randomContractConfig,
    functionName: "balanceOf",
    args: [address!],
    query: {
      enabled: !!address,
    },
  });

  const {
    getRequestIdBySimulate,
    // getRequestIdByDecodeLog,
    requestFulfillRandomWords,
  } = useChainlinkVRF2_5Mock({
    mintFee,
  });

  const handleMintNFT = useCallback(async () => {
    try {
      // 检查用户余额
      const balance = await publicClient?.getBalance({ address: address! });
      if (balance! < mintFee!) {
        throw new Error(
          `Insufficient balance. You need at least ${formatEther(
            mintFee!
          )} ETH.`
        );
      }

      // 本地链模拟Chainlink VRF
      if (chainId == 31337) {
        setIsMinting(true);

        const requestId = await getRequestIdBySimulate();
        const result = await requestFulfillRandomWords(requestId!);
        if (result) {
          setIsMinting(false);
          const { data: newTokenCounter } = await refetchTokenCounter();
          setLastMintedTokenId(
            typeof newTokenCounter === "bigint" ? newTokenCounter - 1n : null
          );
          toast.success("Mint NFT successfully.");
        }
        return;
      }

      // 其他链使用真实的Chainlink VRF
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "requestNft",
        value: mintFee,
      });

      const receipt = await publicClient?.waitForTransactionReceipt({ hash });
      if (receipt?.status === "success") {
        setIsMinting(false);
        toast.success("Mint NFT successfully.");
      }
    } catch (error) {
      setIsMinting(false);
      throw new Error("Failed to mint NFT");
    }
  }, [address, chainId, tokenCounter]);

  // const approveMarketplace = useCallback(
  //   async (tokenId: bigint, marketplaceAddress: string) => {
  //     if (!address) throw new Error("No wallet connected");

  //     const hash = await writeContractAsync({
  //       address: CONTRACT_ADDRESS,
  //       abi: CONTRACT_ABI,
  //       functionName: "approve",
  //       args: [marketplaceAddress, tokenId],
  //     });

  //     return hash;
  //   },
  //   [address, writeContractAsync]
  // );

  return {
    chainId,
    mintFee,
    tokenCounter,
    balance,
    isMinting,
    lastMintedTokenId,
    handleMintNFT,
    refetchTokenCounter,
    // approveMarketplace,
  };
}
