import {
  NFT_MARKETPLACE_NFT_ABI,
  NFT_MARKETPLACE_CONTRACT_ADDRESS,
} from "@/constants/nftMarketplace";
import { useEffect, useState } from "react";
import { Address } from "viem";
import { useAccount, UseReadContractParameters, usePublicClient } from "wagmi";
import { useMintRandomNFT } from "./useMintRandomNFT";
import {
  RANDOM_IPFS_NFT_ABI,
  RANDOM_IPFS_NFT_CONTRACT_ADDRESS,
} from "@/constants";
import { NftMetadata, UserNft } from "@/types";

const CONTRACT_ADDRESS = NFT_MARKETPLACE_CONTRACT_ADDRESS;
const CONTRACT_ABI = NFT_MARKETPLACE_NFT_ABI;

const marketContractConfig: UseReadContractParameters = {
  address: CONTRACT_ADDRESS,
  abi: CONTRACT_ABI,
};

export interface Listing {
  price: bigint;
  seller: string;
}

const GATEWAY_URL = process.env.NEXT_PUBLIC_GATWAY_PINATE_CLOUD_IPFS;

export function useGallery() {
  const { address } = useAccount();
  const { tokenCounter } = useMintRandomNFT();
  const publicClient = usePublicClient();
  const [userNFTs, setUserNFTs] = useState<UserNft[]>([]);

  const getTokenUri = async (tokenId: bigint) => {
    // 获取tokenURI
    const tokenURi = (await publicClient?.readContract({
      address: RANDOM_IPFS_NFT_CONTRACT_ADDRESS,
      abi: RANDOM_IPFS_NFT_ABI,
      functionName: "tokenURI",
      args: [tokenId],
    })) as string;

    // 获取owner地址
    const ownerAddress = (await publicClient?.readContract({
      address: RANDOM_IPFS_NFT_CONTRACT_ADDRESS,
      abi: RANDOM_IPFS_NFT_ABI,
      functionName: "ownerOf",
      args: [tokenId],
    })) as Address;

    // 判断是否为NFT所有者
    if (address?.toLowerCase() === ownerAddress?.toLowerCase()) {
      return tokenURi;
    }
  };

  // 从IPFS获取NFT元数据信息
  const fetchNFTMetadata = async (tokenId: bigint) => {
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
    } else {
      throw new Error("Not IPFS");
    }
  };

  const loadNFTs = async () => {
    const metadataPromises: Promise<UserNft>[] = [];

    for (let i = 0n; i < tokenCounter!; i++) {
      metadataPromises.push(fetchNFTMetadata(i));
    }

    const results = await Promise.all(metadataPromises);
    setUserNFTs(results);
  };

  useEffect(() => {
    loadNFTs();
  }, [address, tokenCounter]);

  return {
    userNFTs,
  };
}
