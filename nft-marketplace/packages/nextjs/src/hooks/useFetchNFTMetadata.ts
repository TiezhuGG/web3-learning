import { Address } from "viem";
import { useAccount, usePublicClient } from "wagmi";
import {
  RANDOM_IPFS_NFT_ABI,
  RANDOM_IPFS_NFT_CONTRACT_ADDRESS,
} from "@/constants";
import { NftMetadata } from "@/types";
import { useCallback } from "react";
import { useMintRandomNFT } from "./useMintRandomNFT";

const GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_PINATA_CLOUD_IPFS;

export function useFetchNFTMetadata() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { tokenCounter } = useMintRandomNFT();

  // 获取owner地址
  const getOwnerAddress = async (tokenId: bigint) => {
    if (!publicClient) {
      throw new Error("Public client is not initialized.");
    }

    const ownerAddress = (await publicClient?.readContract({
      address: RANDOM_IPFS_NFT_CONTRACT_ADDRESS,
      abi: RANDOM_IPFS_NFT_ABI,
      functionName: "ownerOf",
      args: [tokenId],
    })) as Address;

    return ownerAddress;
  };

  // 获取tokenURI
  const getTokenUri = async (tokenId: bigint) => {
    const ownerAddress = await getOwnerAddress(tokenId);

    // 判断是否为NFT所有者
    if (address?.toLowerCase() === ownerAddress?.toLowerCase()) {
      const tokenUri = (await publicClient?.readContract({
        address: RANDOM_IPFS_NFT_CONTRACT_ADDRESS,
        abi: RANDOM_IPFS_NFT_ABI,
        functionName: "tokenURI",
        args: [tokenId],
      })) as string;

      return tokenUri;
    }
  };

  // 从IPFS获取NFT元数据信息
  const fetchNFTMetadata = useCallback(
    async (tokenId: bigint) => {
      const tokenUri = await getTokenUri(tokenId);
      if (tokenUri && tokenUri.startsWith("ipfs://")) {
        const ipfsHash = tokenUri.replace("ipfs://", "");
        const gatewayUrl = `${GATEWAY_URL}${ipfsHash}`;
        const response = await fetch(gatewayUrl);
        if (!response.ok) {
          throw new Error("Failed to fetch metadata");
        }
        const metadata: NftMetadata = await response.json();

        return {
          tokenId,
          tokenUri,
          metadata,
        };
      }

      return null;
    },
    [address]
  );

  return {
    getOwnerAddress,
    getTokenUri,
    fetchNFTMetadata,
  };
}
