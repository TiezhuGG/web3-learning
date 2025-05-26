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
import { randomContractConfig, useMintRandomNFT } from "./useMintRandomNFT";
import {
  RANDOM_IPFS_NFT_ABI,
  RANDOM_IPFS_NFT_CONTRACT_ADDRESS,
} from "@/constants";
import { NftMetadata } from "@/types";
import { ReadContractParameters } from "viem";

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
  const { tokenCounter, approveMarketplace } = useMintRandomNFT();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();

  const getListItem = async (tokenId: bigint) => {
    const listItem = await publicClient?.readContract({
      ...publicContractConfig,
      functionName: "getListing",
      args: [RANDOM_IPFS_NFT_CONTRACT_ADDRESS, tokenId],
    });
    return listItem;
  };

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
    [address, publicClient]
  );

  const { writeContractAsync: writeUpdateItem, isPending: isUpdating } =
    useWriteContract();
  // 更新NFT(价格)
  const updateNFT = useCallback(
    async (tokenId: bigint, price: bigint) => {
      if (!publicClient) {
        throw new Error("Public client is not initialized.");
      }

      const { request } = await publicClient.simulateContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "updateListing",
        args: [RANDOM_IPFS_NFT_CONTRACT_ADDRESS, tokenId, price],
        account: address,
      });

      await writeUpdateItem(request);
    },
    [address, publicClient]
  );

  // 取消上架
  const { writeContractAsync: writeCancelItem, isPending: isCanceling } =
    useWriteContract();
  const cancelNFT = useCallback(
    async (tokenId: bigint) => {
      if (!publicClient) {
        throw new Error("Public client is not initialized.");
      }
      const { request } = await publicClient.simulateContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "cancelListing",
        args: [RANDOM_IPFS_NFT_CONTRACT_ADDRESS, tokenId],
        account: address,
      });

      await writeCancelItem(request);
    },
    [address, publicClient]
  );

  const { data: proceeds } = useReadContract({
    ...marketContractConfig,
    functionName: "getProceeds",
    args: [address!],
    query: {
      enabled: !!address,
    },
  });

  // const listNFT = useCallback(
  //   async (tokenId: bigint, price: bigint) => {
  //     if (!address) throw new Error("No wallet connected");

  //     const hash = await writeContractAsync({
  //       address: NFT_MARKETPLACE_CONTRACT_ADDRESS,
  //       abi: NFT_MARKETPLACE_NFT_ABI,
  //       functionName: "listItem",
  //       args: [CONTRACT_ADDRESS, tokenId, price],
  //     });

  //     return hash;
  //   },
  //   [address, writeContractAsync]
  // );

  const buyNFT = useCallback(
    async (tokenId: bigint, price: bigint) => {
      if (!address) throw new Error("No wallet connected");

      const hash = await writeContractAsync({
        address: NFT_MARKETPLACE_CONTRACT_ADDRESS,
        abi: NFT_MARKETPLACE_NFT_ABI,
        functionName: "buyItem",
        args: [CONTRACT_ADDRESS, tokenId],
        value: price,
      });

      return hash;
    },
    [address, writeContractAsync]
  );

  const cancelListing = useCallback(
    async (tokenId: bigint) => {
      if (!address) throw new Error("No wallet connected");

      const hash = await writeContractAsync({
        address: NFT_MARKETPLACE_CONTRACT_ADDRESS,
        abi: NFT_MARKETPLACE_NFT_ABI,
        functionName: "cancelListing",
        args: [CONTRACT_ADDRESS, tokenId],
      });

      return hash;
    },
    [address, writeContractAsync]
  );

  const withdrawProceeds = useCallback(async () => {
    if (!address) throw new Error("No wallet connected");

    const hash = await writeContractAsync({
      address: NFT_MARKETPLACE_CONTRACT_ADDRESS,
      abi: NFT_MARKETPLACE_NFT_ABI,
      functionName: "withdrawProceeds",
    });

    return hash;
  }, [address, writeContractAsync]);

  return {
    listNFT,
    isListing,
    updateNFT,
    isUpdating,
    cancelNFT,
    isCanceling,
    proceeds,
    buyNFT,
    cancelListing,
    withdrawProceeds,
  };
}
