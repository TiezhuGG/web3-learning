import {
  NFT_MARKETPLACE_CONTRACT_ADDRESS,
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
import { Address, formatEther } from "viem";
import { BigintType } from "@/types";
import { useChainlinkVRF2_5Mock } from "./useChainlinkVRF2_5Mock";
import { toast } from "sonner";
import { useWallet } from "./useWallet";
import { useFetchNFTMetadata } from "./useFetchNFTMetadata";

const CONTRACT_ADDRESS = RANDOM_IPFS_NFT_CONTRACT_ADDRESS;
const CONTRACT_ABI = RANDOM_IPFS_NFT_ABI;

export const randomContractConfig: UseReadContractParameters = {
  address: CONTRACT_ADDRESS,
  abi: CONTRACT_ABI,
};

export function useMintRandomNFT() {
  const { refetchBalance } = useWallet();
  const { address, chainId } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  const { getOwnerAddress } = useFetchNFTMetadata();
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

  const { data: myNFTCount } = useReadContract({
    ...randomContractConfig,
    functionName: "balanceOf",
    args: [address!],
  });

  const {
    getRequestIdBySimulate,
    // getRequestIdByDecodeLog,
    requestFulfillRandomWords,
  } = useChainlinkVRF2_5Mock({
    mintFee,
  });

  const handleMintNFT = useCallback(async () => {
    // 检查用户余额
    const balance = await publicClient?.getBalance({ address: address! });
    if (balance! < mintFee!) {
      toast.error(
        `Insufficient balance. You need at least ${formatEther(mintFee!)} ETH.`
      );
      throw new Error(
        `Insufficient balance. You need at least ${formatEther(mintFee!)} ETH.`
      );
    }

    try {
      // 本地链模拟Chainlink VRF
      if (chainId == 31337) {
        setIsMinting(true);

        const requestId = await getRequestIdBySimulate();
        const result = await requestFulfillRandomWords(requestId!);
        if (result) {
          refetchBalance();
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
        refetchBalance();
        setIsMinting(false);
        toast.success("Mint NFT successfully.");
      }
    } catch (error) {
      setIsMinting(false);
      throw new Error("Failed to mint NFT");
    }
  }, [address, chainId, tokenCounter]);

  const { writeContractAsync: writeApprove, isPending: isApproving } =
    useWriteContract();

  const approveMarketplace = useCallback(
    async (tokenId: bigint) => {
      try {
        if (!publicClient || !address) {
          throw new Error("Wallet not connected or client not initialized");
        }

        // 检查当前用户是否为NFT所有者
        const ownerAddress = await getOwnerAddress(tokenId);
        if (address.toLowerCase() !== ownerAddress.toLowerCase()) {
          toast.error("You are not the owner of this NFT");
          throw new Error("You are not the owner of this NFT");
        }

        // 检查当前tokenId是否已授权
        const { result } = (await publicClient.simulateContract({
          address: CONTRACT_ADDRESS,
          abi: CONTRACT_ABI,
          functionName: "getApproved",
          args: [tokenId],
          account: address,
        })) as { result: Address };

        // 未授权时调用approve函数进行授权
        if (
          result.toLowerCase() !==
          NFT_MARKETPLACE_CONTRACT_ADDRESS.toLowerCase()
        ) {
          console.log("Approving marketplace...", isApproving);

          const { request } = await publicClient.simulateContract({
            address: CONTRACT_ADDRESS,
            abi: CONTRACT_ABI,
            functionName: "approve",
            args: [NFT_MARKETPLACE_CONTRACT_ADDRESS, tokenId],
            account: address,
          });

          const hash = await writeApprove(request);
          return hash;
        }
      } catch (error) {
        throw new Error("Failed to approve marketplace.");
      }
    },
    [address, writeContractAsync, publicClient]
  );

  return {
    chainId,
    mintFee,
    tokenCounter,
    myNFTCount,
    isMinting,
    lastMintedTokenId,
    handleMintNFT,
    refetchTokenCounter,
    approveMarketplace,
    isApproving,
  };
}
