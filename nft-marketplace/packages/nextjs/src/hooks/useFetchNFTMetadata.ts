import { useCallback } from "react";
import { Address } from "viem";
import { usePublicClient } from "wagmi";
import {
  NFT_MARKETPLACE_CONTRACT_ADDRESS,
  NFT_MARKETPLACE_NFT_ABI,
  RANDOM_IPFS_NFT_ABI,
  RANDOM_IPFS_NFT_CONTRACT_ADDRESS,
} from "@/constants";
import { Listing, NftMetadata } from "@/types";
import { useNftContext } from "@/context/NftContext";

const GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_PINATA_CLOUD_IPFS;

export function useFetchNFTMetadata() {
  const publicClient = usePublicClient();
  const { address, refetchTokenCounter } = useNftContext();

  // 获取owner地址
  const getOwnerAddress = useCallback(
    async (tokenId: bigint) => {
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
    },
    [publicClient]
  );

  // 获取tokenURI
  const getTokenUri = useCallback(
    async (tokenId: bigint) => {
      const tokenUri = (await publicClient?.readContract({
        address: RANDOM_IPFS_NFT_CONTRACT_ADDRESS,
        abi: RANDOM_IPFS_NFT_ABI,
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
          tokenUri,
          metadata,
        };
      }
    },
    [getTokenUri, getOwnerAddress, address]
  );

  // 获取上架NFT的信息
  const getListNFT = useCallback(
    async (tokenId: bigint) => {
      const listNFT = await publicClient?.readContract({
        address: NFT_MARKETPLACE_CONTRACT_ADDRESS,
        abi: NFT_MARKETPLACE_NFT_ABI,
        functionName: "getListing",
        args: [RANDOM_IPFS_NFT_CONTRACT_ADDRESS, tokenId],
      });

      return listNFT as Listing;
    },
    [publicClient]
  );

  const fetchUserData = useCallback(
    async (tokenId: bigint) => {
      const result = await fetchDataFromIpfs(tokenId);
      const { price } = await getListNFT(tokenId);

      if (result) {
        const { tokenUri, metadata } = result;

        return {
          tokenId,
          tokenUri,
          metadata,
          price: price > 0n ? price : null, // 用来检查用户NFTs列表中哪些是已上架的
        };
      }

      return null;
    },
    [fetchDataFromIpfs, getListNFT]
  );

  // 过滤已上架的tokenId
  const filterListedTokenIds = async () => {
    // 确保tokenCounter是最新的
    const { data: newestTokenCounter } = await refetchTokenCounter();
    const listingStatus = await Promise.all(
      Array.from({ length: Number(newestTokenCounter) }, (_, i) =>
        getListNFT(BigInt(i))
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
      const { price, seller } = await getListNFT(tokenId);
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
    getListNFT,
    getOwnerAddress,
    getTokenUri,
    fetchDataFromIpfs,
    fetchUserData,
    fetchMarketData,
    filterListedTokenIds,
  };
}
