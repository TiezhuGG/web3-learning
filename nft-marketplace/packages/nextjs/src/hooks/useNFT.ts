import { useCallback } from "react";
import { useAccount, useWriteContract, useReadContract } from "wagmi";

// 这里需要替换为实际部署后的合约地址
const NFT_ADDRESS = "YOUR_NFT_ADDRESS";

const NFT_ABI = [
  {
    inputs: [],
    name: "mintNft",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "tokenURI",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getTokenCounter",
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
        name: "owner",
        type: "address",
      },
    ],
    name: "balanceOf",
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
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "approve",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

export function useNFT() {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();

  const { data: tokenCounter } = useReadContract({
    address: NFT_ADDRESS,
    abi: NFT_ABI,
    functionName: "getTokenCounter",
  });

  const { data: balance } = useReadContract({
    address: NFT_ADDRESS,
    abi: NFT_ABI,
    functionName: "balanceOf",
    args: [address!],
    query: {
      enabled: !!address,
    },
  });

  const mintNFT = useCallback(async () => {
    if (!address) throw new Error("No wallet connected");

    const hash = await writeContractAsync({
      address: NFT_ADDRESS,
      abi: NFT_ABI,
      functionName: "mintNft",
    });

    return hash;
  }, [address, writeContractAsync]);

  const approveMarketplace = useCallback(
    async (tokenId: bigint, marketplaceAddress: string) => {
      if (!address) throw new Error("No wallet connected");

      const hash = await writeContractAsync({
        address: NFT_ADDRESS,
        abi: NFT_ABI,
        functionName: "approve",
        args: [marketplaceAddress, tokenId],
      });

      return hash;
    },
    [address, writeContractAsync]
  );

  return {
    tokenCounter,
    balance,
    mintNFT,
    approveMarketplace,
  };
}
