import { useCallback, useState } from "react";
import { formatEther } from "viem";
import { toast } from "sonner";
import {
  useAccount,
  useWriteContract,
  usePublicClient,
  type UseReadContractParameters,
} from "wagmi";
import {
  RANDOM_IPFS_NFT_ABI,
  RANDOM_IPFS_NFT_CONTRACT_ADDRESS,
} from "@/constants";
import { useNftContext } from "@/context/NftContext";
import { useChainlinkVRF2_5Mock } from "./useChainlinkVRF2_5Mock";
import { useWallet } from "./useWallet";

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
  const [lastMintedTokenId, setLastMintedTokenId] = useState<bigint | null>(
    null
  );
  const [isMinting, setIsMinting] = useState(false);
  const { mintFee, tokenCounter, refetchTokenCounter } = useNftContext();

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
      setIsMinting(true);

      // 本地链模拟Chainlink VRF
      if (chainId == 31337) {
        const requestId = await getRequestIdBySimulate();
        const result = await requestFulfillRandomWords(requestId!);
        if (result) {
          refetchBalance();
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
      
      toast.info("Minting request sent. Please Waiting...");
      refetchBalance(); // 刷新余额,mintFee已支付
      
      const receipt = await publicClient?.waitForTransactionReceipt({ hash });
      if (receipt?.status === "success") {
        console.log("NFT request transaction confirmed:", receipt);
        // 监听NFT铸造成功的NFTMinted事件 
        publicClient?.watchContractEvent({
          address: CONTRACT_ADDRESS,
          abi: CONTRACT_ABI,
          eventName: "NFTMinted",
          onLogs: async (logs) => {
            const { args } = (logs[0] as any).args;
            console.log('NFTMinted event args:', args);
            const { data: newTokenCounter } = await refetchTokenCounter();
            setLastMintedTokenId(
              typeof newTokenCounter === "bigint" ? newTokenCounter - 1n : null
            );
            toast.success("Mint NFT successfully.");
          }
        })
      }
    } catch (error) {
      toast.error('Failed to mint NFT.')
      throw error;
    } finally {
      setIsMinting(false);
    }
  }, [
    address,
    chainId,
    tokenCounter,
    mintFee,
    publicClient,
    refetchTokenCounter,
    writeContractAsync,
    getRequestIdBySimulate,
    requestFulfillRandomWords
  ]);

  return {
    isMinting,
    lastMintedTokenId,
    handleMintNFT,
  };
}
