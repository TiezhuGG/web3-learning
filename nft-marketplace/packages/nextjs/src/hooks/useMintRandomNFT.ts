import { useCallback, useState } from "react";
import { formatEther } from "viem";
import { toast } from "sonner";
import {
  useAccount,
  useWriteContract,
  usePublicClient,
  type UseReadContractParameters,
} from "wagmi";
import { RANDOMIPFSNFT_ABI, RANDOMIPFSNFT_CONTRACT_ADDRESS } from "@/constants";
import { useNftContext } from "@/context/NftContext";
import { useChainlinkVRF2_5Mock } from "./useChainlinkVRF2_5Mock";
import { useWallet } from "./useWallet";

const CONTRACT_ADDRESS = RANDOMIPFSNFT_CONTRACT_ADDRESS;
const CONTRACT_ABI = RANDOMIPFSNFT_ABI;

export const randomContractConfig: UseReadContractParameters = {
  address: CONTRACT_ADDRESS,
  abi: CONTRACT_ABI,
};

export function useMintRandomNFT() {
  const { refetchBalance } = useWallet();
  const { address, chainId } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  const [isMinting, setIsMinting] = useState(false);
  const { mintFee, setActionProgress } = useNftContext();

  const {
    getRequestIdBySimulate,
    // getRequestIdByDecodeLog,
    requestFulfillRandomWords,
  } = useChainlinkVRF2_5Mock({
    mintFee,
  });

  // 检查用户余额是否足够
  const checkBalance = async () => {
    const balance = await publicClient?.getBalance({ address: address! });
    if (balance! < mintFee!) {
      toast.error(
        `Insufficient balance. You need at least ${formatEther(mintFee!)} ETH.`
      );
      throw new Error(
        `Insufficient balance. You need at least ${formatEther(mintFee!)} ETH.`
      );
    }
  };

  const handleCustomMintNFT = async (tokenUri: string) => {
    await checkBalance();
    if (!publicClient) {
      throw new Error("Public client is not initialized.");
    }

    try {
      setIsMinting(true);

      const { request } = await publicClient?.simulateContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "customMintNft",
        args: [tokenUri],
        value: mintFee,
        account: address,
      });

      if (!request) {
        throw new Error("Contract simulation failed");
      }

      const hash = await writeContractAsync(request);

      await publicClient.waitForTransactionReceipt({ hash });

      refetchBalance();
    } catch (error) {
      toast.error("Failed to mint NFT. Please try minting again.");
      throw error;
    } finally {
      setIsMinting(false);
    }
  };

  const handleMintNFT = async () => {
    await checkBalance();

    try {
      setIsMinting(true);

      // 本地链模拟Chainlink VRF
      if (chainId == 31337) {
        const requestId = await getRequestIdBySimulate();
        setActionProgress({
          stage: "minting",
          progress: 50,
          message: "Minting Random NFT, Please Waiting...",
        });
        await requestFulfillRandomWords(requestId!);
        setActionProgress({
          stage: "minting",
          progress: 75,
          message: "Minting Random NFT, Please Waiting...",
        });
        return;
      }

      // 其他链使用真实的Chainlink VRF
      await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "requestNft",
        value: mintFee,
      });

      setActionProgress({
        stage: "minting",
        progress: 50,
        message: "Minting Random NFT, Please Waiting...",
      });

      toast.info("Minting request sent. Please Waiting...");
      refetchBalance(); // 刷新余额,mintFee已支付
    } catch (error) {
      setActionProgress({
        stage: "error",
        progress: 0,
        message: "Failed to mint NFT...",
      });
      throw error;
    } finally {
      setIsMinting(false);
    }
  };

  return {
    isMinting,
    handleMintNFT,
    handleCustomMintNFT,
  };
}
