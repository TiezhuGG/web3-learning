import { useCallback } from "react";
import { Address } from "viem";
import { usePublicClient } from "wagmi";
import {
  NFTMARKETPLACE_CONTRACT_ADDRESS,
  NFTMARKETPLACE_ABI,
  RANDOMIPFSNFT_ABI,
  RANDOMIPFSNFT_CONTRACT_ADDRESS,
} from "@/constants";
import { Listing, NftMetadata, UserNft } from "@/types";
import { useNftContext } from "@/context/NftContext";

const GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_PINATA_CLOUD_IPFS;

export function useFetchNFTMetadata() {
  const publicClient = usePublicClient();
  const { refetchTokenCounter } = useNftContext();

  // 获取owner地址
  const fetchOwnerAddress = useCallback(
    async (tokenId: bigint) => {
      if (!publicClient) {
        throw new Error("Public client is not initialized.");
      }

      const ownerAddress = (await publicClient?.readContract({
        address: RANDOMIPFSNFT_CONTRACT_ADDRESS,
        abi: RANDOMIPFSNFT_ABI,
        functionName: "ownerOf",
        args: [tokenId],
      })) as Address;

      return ownerAddress;
    },
    [publicClient]
  );

  // 获取tokenURI
  const fetchTokenUri = useCallback(
    async (tokenId: bigint) => {
      const tokenUri = (await publicClient?.readContract({
        address: RANDOMIPFSNFT_CONTRACT_ADDRESS,
        abi: RANDOMIPFSNFT_ABI,
        functionName: "tokenURI",
        args: [tokenId],
      })) as string;

      return tokenUri;
    },
    [publicClient]
  );

  // 从IPFS获取NFT元数据信息
  const fetchDataFromIpfs = useCallback(
    async (tokenId: bigint) => {
      const tokenUri = await fetchTokenUri(tokenId);

      if (tokenUri && tokenUri.startsWith("ipfs://")) {
        const ipfsHash = tokenUri.replace("ipfs://", "");
        const gatewayUrl = `${GATEWAY_URL}${ipfsHash}`;
        const response = await fetch(gatewayUrl);
        if (!response.ok) {
          throw new Error("Failed to fetch metadata");
        }
        const metadata: NftMetadata = await response.json();

        return {
          tokenUri,
          metadata,
        };
      }
    },
    [fetchTokenUri]
  );

  // 获取上架NFT的信息
  const fetchListing = useCallback(
    async (tokenId: bigint) => {
      const listingNFT = await publicClient?.readContract({
        address: NFTMARKETPLACE_CONTRACT_ADDRESS,
        abi: NFTMARKETPLACE_ABI,
        functionName: "getListing",
        args: [RANDOMIPFSNFT_CONTRACT_ADDRESS, tokenId],
      });

      return listingNFT as Listing;
    },
    [publicClient]
  );

  const fetchUserData = useCallback(
    async (tokenId: bigint) => {
      const result = await fetchDataFromIpfs(tokenId);
      const { price } = await fetchListing(tokenId);

      if (result) {
        const { tokenUri, metadata } = result;

        return {
          tokenId,
          tokenUri,
          metadata,
          price: price > 0n ? price : null, // 用来检查用户NFTs列表中哪些是已上架的
        } as UserNft;
      }

      return null;
    },
    [fetchDataFromIpfs, fetchListing]
  );

  // 过滤已上架的tokenId
  const filterListedTokenIds = async () => {
    // 确保tokenCounter是最新的
    const { data: newestTokenCounter } = await refetchTokenCounter();
    const listingStatus = await Promise.all(
      Array.from({ length: Number(newestTokenCounter) }, (_, i) =>
        fetchListing(BigInt(i))
      )
    );

    const listedTokenIds = listingStatus
      .map((nft, i) => (nft.price > 0n ? BigInt(i) : null))
      .filter((v) => v !== null) as bigint[];
    return listedTokenIds;
  };

  const fetchMarketData = async (tokenId: bigint) => {
    const result = await fetchDataFromIpfs(tokenId);
    if (result) {
      const { tokenUri, metadata } = result;
      const { price, seller } = await fetchListing(tokenId);
      return {
        tokenId,
        tokenUri,
        metadata,
        price: price,
        seller: seller,
      };
    }

    return null;
  };

  return {
    fetchListing,
    fetchOwnerAddress,
    fetchDataFromIpfs,
    fetchUserData,
    fetchMarketData,
    filterListedTokenIds,
  };
}
