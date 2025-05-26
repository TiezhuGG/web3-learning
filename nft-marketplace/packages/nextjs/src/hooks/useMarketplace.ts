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

export function useMarketplace() {
  const { address } = useAccount();
  const { tokenCounter } = useMintRandomNFT();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  const [userNFTs, setUserNFTs] = useState<NftMetadata[]>([]);

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
  const fetchNFTMetadata = async (tokenUri: string) => {
    if (tokenUri.startsWith("ipfs://")) {
      const ipfsHash = tokenUri.replace("ipfs://", "");
      const gatewayUrl = `${GATEWAY_URL}${ipfsHash}`;
      const response = await fetch(gatewayUrl);
      if (!response.ok) {
        throw new Error("Failed to fetch metadata");
      }
      const metadata: NftMetadata = await response.json();
      return metadata;
    } else {
      throw new Error("Not IPFS");
    }
  };

  useEffect(() => {
    console.log("Marketplace contract config:", marketContractConfig);

    const metadataPromises: Promise<NftMetadata>[] = [];
    const loadNFTs = async () => {
      for (let i = 0n; i < tokenCounter!; i++) {
        const tokenUri = await getTokenUri(i);
        console.log(`Listing for token ID ${i}: ${tokenUri}`, );
        if (!tokenUri) continue;
        metadataPromises.push(fetchNFTMetadata(tokenUri));
      }

      const results = await Promise.all(metadataPromises);
      console.log(results);
    };
    loadNFTs();
    console.log("Marketplace contract loaded");
  }, [address, tokenCounter]);

  const { data: proceeds } = useReadContract({
    ...marketContractConfig,
    functionName: "getProceeds",
    args: [address!],
    query: {
      enabled: !!address,
    },
  });

  const { data: listing, refetch: refetchListing } = useReadContract({
    ...marketContractConfig,
    functionName: "getListing",
    args: [CONTRACT_ADDRESS, 0n],
  });

  const listNFT = useCallback(
    async (tokenId: bigint, price: bigint) => {
      if (!address) throw new Error("No wallet connected");

      const hash = await writeContractAsync({
        address: NFT_MARKETPLACE_CONTRACT_ADDRESS,
        abi: NFT_MARKETPLACE_NFT_ABI,
        functionName: "listItem",
        args: [CONTRACT_ADDRESS, tokenId, price],
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
    proceeds,
    listing,
    refetchListing,
    listNFT,
    buyNFT,
    cancelListing,
    withdrawProceeds,
  };
}
