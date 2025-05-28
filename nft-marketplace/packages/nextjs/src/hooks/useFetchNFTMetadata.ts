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
  const fetchDataFromIpfs = async (tokenId: bigint, caller?: string) => {
    let tokenUri;
    if (caller === "marketplace") {
      // 调用者是市场合约，不用判断是否为NFT所有者
      tokenUri = (await publicClient?.readContract({
        address: RANDOM_IPFS_NFT_CONTRACT_ADDRESS,
        abi: RANDOM_IPFS_NFT_ABI,
        functionName: "tokenURI",
        args: [tokenId],
      })) as string;
    } else {
      tokenUri = await getTokenUri(tokenId);
    }

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
  };

  const fetchUserData = async (tokenId: bigint) => {
    const result = await fetchDataFromIpfs(tokenId);
    if (result) {
      const { tokenUri, metadata } = result;

      return {
        tokenId,
        tokenUri,
        metadata,
      };
    }

    return null;
  };

  const getListItem = async (tokenId: bigint) => {
    const listItem = await publicClient?.readContract({
      address: NFT_MARKETPLACE_CONTRACT_ADDRESS,
      abi: NFT_MARKETPLACE_NFT_ABI,
      functionName: "getListing",
      args: [RANDOM_IPFS_NFT_CONTRACT_ADDRESS, tokenId],
    });

    return listItem as Listing;
  };

  // 过滤已上架的tokenId
  const filterListedTokenIds = async () => {
    // 确保tokenCounter是最新的
    const { data: newestTokenCounter } = await refetchTokenCounter();
    const listingStatus = await Promise.all(
      Array.from({ length: Number(newestTokenCounter) }, (_, i) =>
        getListItem(BigInt(i))
      )
    );

    const listedTokenIds = listingStatus
      .map((listingItem, i) => (listingItem.price > 0n ? BigInt(i) : null)) as bigint[]
    return listedTokenIds;
  };

  const fetchMarketData = async (tokenId: bigint) => {
    const result = await fetchDataFromIpfs(tokenId, "marketplace");
    if (result) {
      const { tokenUri, metadata } = result;
      const { price, seller } = await getListItem(tokenId);

      return {
        tokenId,
        tokenUri,
        metadata,
        price: price,
        seller: seller,
      };
    }
  };

  return {
    getListItem,
    getOwnerAddress,
    getTokenUri,
    fetchDataFromIpfs,
    fetchUserData,
    fetchMarketData,
    filterListedTokenIds,
  };
}
