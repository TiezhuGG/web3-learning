import { publicClient } from "@/lib/wagmi";
import {
  NFT_MARKETPLACE_NFT_ABI,
  NFT_MARKETPLACE_CONTRACT_ADDRESS,
} from "@/constants/nftMarketplace";
import { useCallback, useEffect, useState } from "react";
import { Address, parseEther } from "viem";
import {
  useAccount,
  useWriteContract,
  useReadContract,
  useWaitForTransactionReceipt,
  UseReadContractParameters,
  usePublicClient,
} from "wagmi";
import {
  RANDOM_IPFS_NFT_ABI,
  RANDOM_IPFS_NFT_CONTRACT_ADDRESS,
} from "@/constants";
import { NftMetadata } from "@/types";
import { ReadContractParameters } from "viem";
import { toast } from "sonner";
import { randomContractConfig, useMintRandomNFT } from "./useMintRandomNFT";
import { useFetchNFTMetadata } from "./useFetchNFTMetadata";
import { useGallery } from "./useGallery";
import { useWallet } from "./useWallet";

const CONTRACT_ADDRESS = NFT_MARKETPLACE_CONTRACT_ADDRESS;
const CONTRACT_ABI = NFT_MARKETPLACE_NFT_ABI;

const marketContractConfig: UseReadContractParameters = {
  address: CONTRACT_ADDRESS,
  abi: CONTRACT_ABI,
};
const publicContractConfig: ReadContractParameters = {
  address: CONTRACT_ADDRESS,
  abi: CONTRACT_ABI,
  functionName: "",
};

export interface Listing {
  price: bigint;
  seller: string;
}

const GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_PINATA_CLOUD_IPFS;

export function useMarketplace() {
  const { address } = useAccount();
  const { refetchBalance } = useWallet();
  const { tokenCounter } = useMintRandomNFT();
  const { writeContractAsync } = useWriteContract();
  const { getOwnerAddress, fetchNFTMetadata } = useFetchNFTMetadata();
  const { setUserNFTs } = useGallery();
  const publicClient = usePublicClient();

  const getListItem = async (tokenId: bigint) => {
    const listItem = await publicClient?.readContract({
      ...publicContractConfig,
      functionName: "getListing",
      args: [RANDOM_IPFS_NFT_CONTRACT_ADDRESS, tokenId],
    });
    return listItem;
  };

  const checkIsOwner = async (tokenId: bigint) => {
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
  };

  const { writeContractAsync: writeApprove, isPending: isApproving } =
    useWriteContract();

  const approveMarketplace = useCallback(
    async (tokenId: bigint) => {
      try {
        if (!publicClient || !address) {
          throw new Error("Wallet not connected or client not initialized");
        }

        await checkIsOwner(tokenId);

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
          console.log("Approving marketplace...", isApproving);

          const { request } = await publicClient.simulateContract({
            address: RANDOM_IPFS_NFT_CONTRACT_ADDRESS,
            abi: RANDOM_IPFS_NFT_ABI,
            functionName: "approve",
            args: [CONTRACT_ADDRESS, tokenId],
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

  const { writeContractAsync: writeListItem, isPending: isListing } =
    useWriteContract();
  // 上架NFT
  const listNFT = useCallback(
    async (tokenId: bigint, price: bigint) => {
      if (!publicClient) {
        throw new Error("Public client is not initialized.");
      }

      await approveMarketplace(tokenId);

      const { request } = await publicClient.simulateContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "listItem",
        args: [RANDOM_IPFS_NFT_CONTRACT_ADDRESS, tokenId, price],
        account: address,
      });

      await writeListItem(request);
    },
    [address, publicClient, writeListItem]
  );

  const { writeContractAsync: writeUpdateItem, isPending: isUpdating } =
    useWriteContract();
  // 更新NFT(价格)
  const updateNFT = useCallback(
    async (tokenId: bigint, price: bigint) => {
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

      await writeUpdateItem(request);
    },
    [address, publicClient, writeUpdateItem]
  );

  const { writeContractAsync: writeCancelItem, isPending: isCanceling } =
    useWriteContract();
  // 取消上架
  const cancelNFT = useCallback(
    async (tokenId: bigint) => {
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

      await writeCancelItem(request);
    },
    [address, publicClient, writeCancelItem]
  );

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
      hash: hash!,
    });
    if (receipt.status === "success") {
      toast.success("buy NFT success");
      refetchBalance();
      const nft = await fetchNFTMetadata(tokenId);
      setUserNFTs(prev => [...prev, nft!]);
    }
  };

  const { data: proceeds } = useReadContract({
    ...marketContractConfig,
    functionName: "getProceeds",
    args: [address!],
    query: {
      enabled: !!address,
    },
  });

  // const buyNFT = useCallback(
  //   async (tokenId: bigint, price: bigint) => {
  //     if (!address) throw new Error("No wallet connected");

  //     const hash = await writeContractAsync({
  //       address: NFT_MARKETPLACE_CONTRACT_ADDRESS,
  //       abi: NFT_MARKETPLACE_NFT_ABI,
  //       functionName: "buyItem",
  //       args: [CONTRACT_ADDRESS, tokenId],
  //       value: price,
  //     });

  //     return hash;
  //   },
  //   [address, writeContractAsync]
  // );

  // const cancelListing = useCallback(
  //   async (tokenId: bigint) => {
  //     if (!address) throw new Error("No wallet connected");

  //     const hash = await writeContractAsync({
  //       address: NFT_MARKETPLACE_CONTRACT_ADDRESS,
  //       abi: NFT_MARKETPLACE_NFT_ABI,
  //       functionName: "cancelListing",
  //       args: [CONTRACT_ADDRESS, tokenId],
  //     });

  //     return hash;
  //   },
  //   [address, writeContractAsync]
  // );

  // const withdrawProceeds = useCallback(async () => {
  //   if (!address) throw new Error("No wallet connected");

  //   const hash = await writeContractAsync({
  //     address: NFT_MARKETPLACE_CONTRACT_ADDRESS,
  //     abi: NFT_MARKETPLACE_NFT_ABI,
  //     functionName: "withdrawProceeds",
  //   });

  //   return hash;
  // }, [address, writeContractAsync]);

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
    // proceeds,
    // buyNFT,
    // cancelListing,
    // withdrawProceeds,
  };
}
