import { NFT_MARKETPLACE_NFT_ABI, NFT_MARKETPLACE_CONTRACT_ADDRESS } from './../constants/nftMarketplace';
import { useCallback } from "react";
import { parseEther } from "viem";
import {
  useAccount,
  useWriteContract,
  useReadContract,
  useWaitForTransactionReceipt,
} from "wagmi";

// 这里需要替换为实际部署后的合约地址
const NFT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";


export interface Listing {
  price: bigint;
  seller: string;
}

export function useMarketplace() {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();

  const { data: proceeds } = useReadContract({
    address: NFT_MARKETPLACE_CONTRACT_ADDRESS,
    abi: NFT_MARKETPLACE_NFT_ABI,
    functionName: "getProceeds",
    args: [address!],
    query: {
      enabled: !!address,
    },
  });

  const { data: listing, refetch: refetchListing } = useReadContract({
    address: NFT_MARKETPLACE_CONTRACT_ADDRESS,
    abi: NFT_MARKETPLACE_NFT_ABI,
    functionName: "getListing",
    args: [NFT_ADDRESS, 0n],
  });

  const listNFT = useCallback(
    async (tokenId: bigint, price: bigint) => {
      if (!address) throw new Error("No wallet connected");

      const hash = await writeContractAsync({
        address: NFT_MARKETPLACE_CONTRACT_ADDRESS,
        abi: NFT_MARKETPLACE_NFT_ABI,
        functionName: "listItem",
        args: [NFT_ADDRESS, tokenId, price],
      });

      return hash;
    },
    [address, writeContractAsync]
  );

  const buyNFT = useCallback(
    async (tokenId: bigint, price: bigint) => {
      if (!address) throw new Error("No wallet connected");

      const hash = await writeContractAsync({
        address: NFT_MARKETPLACE_CONTRACT_ADDRESS,
        abi: NFT_MARKETPLACE_NFT_ABI,
        functionName: "buyItem",
        args: [NFT_ADDRESS, tokenId],
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
        args: [NFT_ADDRESS, tokenId],
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
    proceeds,
    listing,
    refetchListing,
    listNFT,
    buyNFT,
    cancelListing,
    withdrawProceeds,
  };
}
