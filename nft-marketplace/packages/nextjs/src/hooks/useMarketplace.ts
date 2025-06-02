import { Address } from "viem";
import { useWriteContract, usePublicClient } from "wagmi";
import { toast } from "sonner";
import {
  RANDOMIPFSNFT_ABI,
  RANDOMIPFSNFT_CONTRACT_ADDRESS,
  NFTMARKETPLACE_ABI,
  NFTMARKETPLACE_CONTRACT_ADDRESS,
} from "@/constants";
import { useNftContext } from "@/context/NftContext";
import { useMarketplaceContext } from "@/context/MarketplaceContext";
import { useWallet } from "./useWallet";
import { useState } from "react";

const CONTRACT_ADDRESS = NFTMARKETPLACE_CONTRACT_ADDRESS;
const CONTRACT_ABI = NFTMARKETPLACE_ABI;

export function useMarketplace() {
  const { address, setActionProgress } = useNftContext();
  const { refetchBalance } = useWallet();
  const { checkIsOwner, refetchProceeds, checkItemIsListed } =
    useMarketplaceContext();
  const publicClient = usePublicClient();
  const [isListing, setIsListing] = useState(false);

  const { writeContractAsync: writeApprove } = useWriteContract();
  const approveMarketplace = async (tokenId: bigint) => {
    if (!publicClient || !address) {
      throw new Error("Wallet not connected or client not initialized");
    }

    try {
      setIsListing(true);

      // 检查当前tokenId是否已授权
      const { result } = (await publicClient.simulateContract({
        address: RANDOMIPFSNFT_CONTRACT_ADDRESS,
        abi: RANDOMIPFSNFT_ABI,
        functionName: "getApproved",
        args: [tokenId],
        account: address,
      })) as unknown as { result: Address };

      // 未授权时调用approve函数进行授权
      if (result.toLowerCase() !== CONTRACT_ADDRESS.toLowerCase()) {
        console.log("Approving marketplace...");

        setActionProgress({
          stage: "approving",
          progress: 30,
          message: "Approving marketplace and waiting for confirmation...",
        });

        const { request } = await publicClient.simulateContract({
          address: RANDOMIPFSNFT_CONTRACT_ADDRESS,
          abi: RANDOMIPFSNFT_ABI,
          functionName: "approve",
          args: [CONTRACT_ADDRESS, tokenId],
          account: address,
        });

        const hash = await writeApprove(request);
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        
        if (receipt.status === "success") {
          setActionProgress({
            stage: "approving",
            progress: 50,
            message: "Approval confirmed, waiting for list...",
          });
          return true;
        }
      } else {
        console.log("NFT already approved for marketplace.");
        setActionProgress({
          stage: "approving",
          progress: 70,
          message: "NFT already approved, proceeding to list...",
        });
        return true;
      }
    } catch (error) {
      setActionProgress({
        stage: "error",
        progress: 0,
        message: `Failed to approve marketplace: ${error}`,
      });
      throw new Error("Failed to approve marketplace.");
    }
  };

  const { writeContractAsync: writeListItem } = useWriteContract();
  // 上架NFT
  const listNFT = async (tokenId: bigint, price: bigint) => {
    if (!publicClient) {
      throw new Error("Public client is not initialized.");
    }

    try {
      await checkItemIsListed(tokenId);
      await checkIsOwner(tokenId);
      const approvalResult = await approveMarketplace(tokenId);

      if (!approvalResult) {
        throw new Error("Failed to approve marketplace.");
      }

      setActionProgress({
        stage: "listing",
        progress: 70,
        message: "listing NFT to marketplace...",
      });

      const { request } = await publicClient.simulateContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "listItem",
        args: [RANDOMIPFSNFT_CONTRACT_ADDRESS, tokenId, price],
        account: address,
      });

      await writeListItem(request);
    } catch (error) {
      setActionProgress({
        stage: "error",
        progress: 0,
        message: "Failed to listing NFT.",
      });
    } finally {
      setIsListing(false);
    }
  };

  const { writeContractAsync: writeUpdateItem, isPending: isUpdating } =
    useWriteContract();
  // 更新NFT(价格)
  const updateNFT = async (tokenId: bigint, price: bigint) => {
    if (!publicClient) {
      throw new Error("Public client is not initialized.");
    }

    try {
      await checkIsOwner(tokenId);

      setActionProgress({
        stage: "updating",
        progress: 50,
        message: "updating NFT to marketplace...",
      });

      const { request } = await publicClient.simulateContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "updateListing",
        args: [RANDOMIPFSNFT_CONTRACT_ADDRESS, tokenId, price],
        account: address,
      });

      await writeUpdateItem(request);
    } catch (error) {
      setActionProgress({
        stage: "error",
        progress: 0,
        message: "Failed to update NFT.",
      });
    }
  };

  const { writeContractAsync: writeCancelItem, isPending: isCanceling } =
    useWriteContract();
  // 取消上架
  const cancelNFT = async (tokenId: bigint) => {
    if (!publicClient) {
      throw new Error("Public client is not initialized.");
    }

    try {
      await checkIsOwner(tokenId);

      setActionProgress({
        stage: "unListing",
        progress: 50,
        message: "UnListing NFT from marketplace...",
      });

      const { request } = await publicClient.simulateContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "cancelListing",
        args: [RANDOMIPFSNFT_CONTRACT_ADDRESS, tokenId],
        account: address,
      });

      await writeCancelItem(request);
    } catch (error) {
      setActionProgress({
        stage: "error",
        progress: 0,
        message: "Failed to unList NFT.",
      });
    }
  };

  const { writeContractAsync: writeBuyItem, isPending: isBuying } =
    useWriteContract();
  // 购买NFT
  const buyNFT = async (tokenId: bigint, price: bigint) => {
    if (!publicClient) {
      throw new Error("Public client is not initialized.");
    }

    const { request } = await publicClient.simulateContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: "buyItem",
      args: [RANDOMIPFSNFT_CONTRACT_ADDRESS, tokenId],
      value: price ?? 0n,
      account: address,
    });

    await writeBuyItem(request);
  };

  const {
    writeContractAsync: writeWithdrawProceeds,
    isPending: isWithdrawing,
  } = useWriteContract();
  const withdrawProceeds = async () => {
    if (!publicClient) {
      throw new Error("Public client is not initialized.");
    }
    const { request } = await publicClient?.simulateContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: "withdrawProceeds",
      account: address,
    });

    const hash = await writeWithdrawProceeds(request);
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    if (receipt.status === "success") {
      toast.success("withdraw proceeds successfully.");
      refetchBalance();
      refetchProceeds();
    }
  };

  return {
    listNFT,
    isListing,
    updateNFT,
    isUpdating,
    cancelNFT,
    isCanceling,
    buyNFT,
    isBuying,
    withdrawProceeds,
    isWithdrawing,
  };
}
