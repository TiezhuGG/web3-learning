"use client";

import React, { useEffect, useState } from "react";
import { useAccount, useReadContract, useWatchContractEvent } from "wagmi";

import {
  RANDOM_IPFS_NFT_ABI,
  RANDOM_IPFS_NFT_CONTRACT_ADDRESS,
} from "@/constants";
import { JsonRpcProvider, ethers } from "ethers"; // 用于获取 NFT 所有者

interface NftMetadata {
  name: string;
  description: string;
  image: string;
  attributes: { trait_type: string; value: number | string }[];
}

interface UserNft {
  tokenId: bigint;
  tokenUri: string;
  metadata: NftMetadata | null;
  loadingMetadata: boolean;
  errorLoadingMetadata: boolean;
}

const NftCard = ({ nft }: { nft: UserNft }) => {
  const imageUrl = nft.metadata?.image
    ? nft.metadata.image.replace("ipfs://", "https://ipfs.io/ipfs/")
    : "/placeholder-nft.png"; // 假设你有一个占位符图片
  const name = nft.metadata?.name || `NFT #${nft.tokenId.toString()}`;
  const description = nft.metadata?.description || "No description available.";

  return (
    <div className="bg-gray-800 rounded-lg shadow-xl overflow-hidden transform transition duration-300 hover:scale-105">
      <img
        src={imageUrl}
        alt={name}
        className="w-full h-48 object-cover border-b border-gray-700"
      />
      <div className="p-4">
        <h3 className="text-xl font-semibold text-white mb-2">{name}</h3>
        <p className="text-gray-400 text-sm mb-3 line-clamp-2">{description}</p>
        <p className="text-gray-300 text-sm">
          Token ID: <span className="font-mono">{nft.tokenId.toString()}</span>
        </p>
        {nft.loadingMetadata && (
          <p className="text-blue-400 text-xs mt-2">Loading metadata...</p>
        )}
        {nft.errorLoadingMetadata && (
          <p className="text-red-400 text-xs mt-2">Error loading metadata.</p>
        )}
      </div>
    </div>
  );
};

export function NftGallery() {
  const { address: accountAddress } = useAccount();
  const [userNfts, setUserNfts] = useState<UserNft[]>([]);
  const [isLoadingGallery, setIsLoadingGallery] = useState(false);

  // 获取总铸造数量
  const { data: tokenCounterData, refetch: refetchTokenCounter } =
    useReadContract({
      address: RANDOM_IPFS_NFT_CONTRACT_ADDRESS,
      abi: RANDOM_IPFS_NFT_ABI,
      functionName: "getTokenCounter",
      query: {
        enabled: !!RANDOM_IPFS_NFT_CONTRACT_ADDRESS,
      },
    });
  const tokenCounter = tokenCounterData as bigint | undefined;

  const fetchNftDetails = async (id: bigint) => {
    let tokenUri = "";
    let metadata: NftMetadata | null = null;
    let loadingMetadata = true;
    let errorLoadingMetadata = false;

    try {
      // 获取 token URI
      const provider = new JsonRpcProvider("http://127.0.0.1:8545"); // 或您 wagmi 配置中的 publicClient
      const nftContract = new ethers.Contract(
        RANDOM_IPFS_NFT_CONTRACT_ADDRESS,
        RANDOM_IPFS_NFT_ABI,
        provider
      );
      tokenUri = await nftContract.tokenURI(id);

      //   const { data } = await useReadContract({
      //     address: RANDOM_IPFS_NFT_CONTRACT_ADDRESS,
      //     abi: RANDOM_IPFS_NFT_ABI,
      //     functionName: "getTokenURIs",
      //   });

      //   console.log('getTokenURI', data)

      // 从 IPFS 获取元数据
      if (tokenUri.startsWith("ipfs://")) {
        const ipfsHash = tokenUri.replace("ipfs://", "");
        const gatewayUrl = `https://ipfs.io/ipfs/${ipfsHash}`; // 使用公共 IPFS 网关
        // 或者使用 Pinata 网关：`https://gateway.pinata.cloud/ipfs/${ipfsHash}`
        const response = await fetch(gatewayUrl);
        if (!response.ok) throw new Error("Failed to fetch metadata");
        metadata = await response.json();
      } else {
        // 如果不是 IPFS URI，可能是其他 HTTP URL
        const response = await fetch(tokenUri);
        if (!response.ok) throw new Error("Failed to fetch metadata");
        metadata = await response.json();
      }
    } catch (error) {
      console.error(`Error fetching NFT details for token ID ${id}:`, error);
      errorLoadingMetadata = true;
    } finally {
      loadingMetadata = false;
    }

    return {
      tokenId: id,
      tokenUri,
      metadata,
      loadingMetadata,
      errorLoadingMetadata,
    };
  };

  useEffect(() => {
    const loadUserNfts = async () => {
      if (
        !accountAddress ||
        typeof tokenCounter === "undefined" ||
        !RANDOM_IPFS_NFT_CONTRACT_ADDRESS
      )
        return;

      setIsLoadingGallery(true);
      const tempNfts: UserNft[] = [];
      const provider = new JsonRpcProvider("http://127.0.0.1:8545"); // 确保这里的 RPC URL 正确
      const nftContract = new ethers.Contract(
        RANDOM_IPFS_NFT_CONTRACT_ADDRESS,
        RANDOM_IPFS_NFT_ABI,
        provider
      );
      
      const fetchPromises = [];

      for (let i = 0n; i < tokenCounter; i++) {
        fetchPromises.push((async () => {
          try {
            const owner = await nftContract.ownerOf(i);
            if (owner.toLowerCase() === accountAddress.toLowerCase()) {
              return await fetchNftDetails(i);
            }
          } catch (e) {
            console.warn(`Could not get owner or details for token ID ${i}:`, e);
          }
          return null;
        })());
      }
      const results = await Promise.all(fetchPromises);
      setUserNfts(results.filter(nft => nft !== null) as UserNft[]);
      // setUserNfts(tempNfts);
      setIsLoadingGallery(false);
    };

    loadUserNfts();
  }, [accountAddress, tokenCounter, RANDOM_IPFS_NFT_CONTRACT_ADDRESS]); // 依赖项中添加 RANDOM_IPFS_NFT_CONTRACT_ADDRESS

  // 刷新铸造数量和 NFT 列表 (例如在 NFTMinted 事件后)
  // useWatchContractEvent({
  //   address: RANDOM_IPFS_NFT_CONTRACT_ADDRESS,
  //   abi: RANDOM_IPFS_NFT_ABI,
  //   eventName: "NFTMinted",
  //   onLogs: () => {
  //     refetchTokenCounter(); // 铸造新 NFT 后刷新总数
  //     // 重新加载用户 NFT 列表
  //     // 也可以只更新新铸造的 NFT 到列表中，但简单起见，这里重载全部
  //     // 或者在 NftMinting 组件中，当 NFTMinted 触发后，将 tokenId 传递给 NftGallery
  //     const loadNewNft = async () => {
  //       if (!accountAddress) return;
  //       const latestTokenId = tokenCounter || 0n; // 假设新铸造的 tokenId 就是当前的 tokenCounter
  //       const newNft = await fetchNftDetails(latestTokenId);
  //       setUserNfts((prev) => [...prev, newNft]);
  //     };
  //     loadNewNft();
  //   },
  // });

  useWatchContractEvent({
    address: RANDOM_IPFS_NFT_CONTRACT_ADDRESS,
    abi: RANDOM_IPFS_NFT_ABI,
    eventName: 'NFTMinted',
    onLogs: () => {
      refetchTokenCounter(); // 刷新总数，这将触发 useEffect 重新加载
    },
  });

  return (
    <div className="p-6 bg-card-bg rounded-lg shadow-md border border-gray-700">
      {isLoadingGallery ? (
        <p className="text-center text-gray-400">Loading your NFTs...</p>
      ) : userNfts.length === 0 ? (
        <p className="text-center text-gray-400">
          You don't own any NFTs yet. Mint one!
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {userNfts.map((nft) => (
            <NftCard key={nft.tokenId.toString()} nft={nft} />
          ))}
        </div>
      )}
    </div>
  );
}
