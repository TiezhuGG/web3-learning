import { useCallback } from "react";
import { parseEther } from "viem";
import {
  useAccount,
  useWriteContract,
  useReadContract,
  useWaitForTransactionReceipt,
} from "wagmi";

// 这里需要替换为实际部署后的合约地址
const MARKETPLACE_ADDRESS = "YOUR_MARKETPLACE_ADDRESS";
const NFT_ADDRESS = "YOUR_NFT_ADDRESS";

const MARKETPLACE_ABI = [
  {
    inputs: [
      {
        internalType: "address",
        name: "nftAddress",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "buyItem",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "nftAddress",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "cancelListing",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "nftAddress",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "getListing",
    outputs: [
      {
        components: [
          {
            internalType: "uint256",
            name: "price",
            type: "uint256",
          },
          {
            internalType: "address",
            name: "seller",
            type: "address",
          },
        ],
        internalType: "struct NftMarketplace.Listing",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "seller",
        type: "address",
      },
    ],
    name: "getProceeds",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "nftAddress",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "price",
        type: "uint256",
      },
    ],
    name: "listItem",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "withdrawProceeds",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

export interface Listing {
  price: bigint;
  seller: string;
}

export function useMarketplace() {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();

  const { data: proceeds } = useReadContract({
    address: MARKETPLACE_ADDRESS,
    abi: MARKETPLACE_ABI,
    functionName: "getProceeds",
    args: [address!],
    query: {
      enabled: !!address,
    },
  });

  const { data: listing, refetch: refetchListing } = useReadContract({
    address: MARKETPLACE_ADDRESS,
    abi: MARKETPLACE_ABI,
    functionName: "getListing",
    args: [NFT_ADDRESS, 0n],
  });

  const listNFT = useCallback(
    async (tokenId: bigint, price: bigint) => {
      if (!address) throw new Error("No wallet connected");

      const hash = await writeContractAsync({
        address: MARKETPLACE_ADDRESS,
        abi: MARKETPLACE_ABI,
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
        address: MARKETPLACE_ADDRESS,
        abi: MARKETPLACE_ABI,
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
        address: MARKETPLACE_ADDRESS,
        abi: MARKETPLACE_ABI,
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
      address: MARKETPLACE_ADDRESS,
      abi: MARKETPLACE_ABI,
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
