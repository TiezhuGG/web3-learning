import { useCallback } from "react";
import { Address } from "viem";
import { useWriteContract, usePublicClient } from "wagmi";
import { toast } from "sonner";
import {
  NFT_MARKETPLACE_NFT_ABI,
  NFT_MARKETPLACE_CONTRACT_ADDRESS,
} from "@/constants/nftMarketplace";
import {
  RANDOM_IPFS_NFT_ABI,
  RANDOM_IPFS_NFT_CONTRACT_ADDRESS,
} from "@/constants";
import { useNftContext } from "@/context/NftContext";
import { useMarketplaceContext } from "@/context/MarketplaceContext";
import { useWallet } from "./useWallet";

const CONTRACT_ADDRESS = NFT_MARKETPLACE_CONTRACT_ADDRESS;
const CONTRACT_ABI = NFT_MARKETPLACE_NFT_ABI;

export function useMarketplace() {
  const { address } = useNftContext();
  const { refetchBalance } = useWallet();
  const { checkIsOwner, refetchProceeds, checkItemIsListed } =
    useMarketplaceContext();
  const publicClient = usePublicClient();

  const { writeContractAsync: writeApprove, isPending: isApproving } =
    useWriteContract();
  const approveMarketplace = async (tokenId: bigint) => {
    try {
      if (!publicClient || !address) {
        throw new Error("Wallet not connected or client not initialized");
      }

      // 检查当前tokenId是否已授权
      const { result } = (await publicClient.simulateContract({
        address: RANDOM_IPFS_NFT_CONTRACT_ADDRESS,
        abi: RANDOM_IPFS_NFT_ABI,
        functionName: "getApproved",
        args: [tokenId],
        account: address,
      })) as { result: Address };

      // 未授权时调用approve函数进行授权
      if (result.toLowerCase() !== CONTRACT_ADDRESS.toLowerCase()) {
        console.log("Approving marketplace...");

        const { request } = await publicClient.simulateContract({
          address: RANDOM_IPFS_NFT_CONTRACT_ADDRESS,
          abi: RANDOM_IPFS_NFT_ABI,
          functionName: "approve",
          args: [CONTRACT_ADDRESS, tokenId],
          account: address,
        });

        await writeApprove(request);
      }
    } catch (error) {
      throw new Error("Failed to approve marketplace.");
    }
  };

  const { writeContractAsync: writeListItem, isPending: isListing } =
    useWriteContract();
  // 上架NFT
  const listNFT = async (tokenId: bigint, price: bigint) => {
    if (!publicClient) {
      throw new Error("Public client is not initialized.");
    }

    await checkItemIsListed(tokenId);
    await checkIsOwner(tokenId);
    await approveMarketplace(tokenId);

    const { request } = await publicClient.simulateContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: "listItem",
      args: [RANDOM_IPFS_NFT_CONTRACT_ADDRESS, tokenId, price],
      account: address,
    });
    const hash = await writeListItem(request);
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    if (receipt.status === "success") {
      toast.success("list NFT successfully.");
    }
  };

  const { writeContractAsync: writeUpdateItem, isPending: isUpdating } =
    useWriteContract();
  // 更新NFT(价格)
  const updateNFT = async (tokenId: bigint, price: bigint) => {
    if (!publicClient) {
      throw new Error("Public client is not initialized.");
    }

    await checkIsOwner(tokenId);

    const { request } = await publicClient.simulateContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: "updateListing",
      args: [RANDOM_IPFS_NFT_CONTRACT_ADDRESS, tokenId, price],
      account: address,
    });

    const hash = await writeUpdateItem(request);
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    if (receipt.status === "success") {
      toast.success("update NFT price successfully.");
    }
  };

  const { writeContractAsync: writeCancelItem, isPending: isCanceling } =
    useWriteContract();
  // 取消上架
  const cancelNFT = async (tokenId: bigint) => {
    if (!publicClient) {
      throw new Error("Public client is not initialized.");
    }

    await checkIsOwner(tokenId);

    const { request } = await publicClient.simulateContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: "cancelListing",
      args: [RANDOM_IPFS_NFT_CONTRACT_ADDRESS, tokenId],
      account: address,
    });

    const hash = await writeCancelItem(request);
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    if (receipt.status === "success") {
      toast.success("cancel NFT successfully.");
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
      args: [RANDOM_IPFS_NFT_CONTRACT_ADDRESS, tokenId],
      value: price ?? 0n,
      account: address,
    });

    const hash = await writeBuyItem(request);
    const receipt = await publicClient.waitForTransactionReceipt({
      hash,
    });
    if (receipt.status === "success") {
      toast.success("Buy NFT successfully.");
    }
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
    isApproving,
    withdrawProceeds,
    isWithdrawing,
  };
}
