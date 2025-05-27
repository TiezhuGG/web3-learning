"use client";

import React, { useState } from "react";
import { formatEther } from "viem";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/spinner";
import { useMarketplace } from "@/hooks/useMarketplace";
import { useMarketplaceContext } from "@/context/MarketplaceContext";
import { useNftContext } from "@/context/NftContext";
import { formatAddress } from "@/lib/utils";
import ListForm from "./ListForm";

export function NftMarketplace() {
  const { buyNFT, isBuying } = useMarketplace();
  const { marketplaceNFTs } = useMarketplaceContext();
  const { address: accountAddress } = useNftContext();

  const [buyItemTokenId, setBuyItemTokenId] = useState<string | null>(null);

  const handleBuyNFT = async (tokenId: bigint, price: bigint) => {
    try {
      setBuyItemTokenId(tokenId.toString());
      await buyNFT(tokenId, price);
    } catch (error) {
      setBuyItemTokenId(null);
    }
  };

  return (
    <div className="p-6 bg-card-bg rounded-lg shadow-md border border-gray-700">
      <h2 className="text-2xl font-semibold mb-6">NFT Marketplace</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <ListForm />
        <ListForm formState="update" />
        <ListForm formState="cancel" />
      </div>

      <h2 className="text-2xl font-semibold text-white mb-6">NFTs for Sale</h2>
      {marketplaceNFTs.length === 0 ? (
        <p className="text-center text-gray-400">No NFTs listed for sale.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {marketplaceNFTs.map((item) => (
            <div
              key={`${item.nftAddress}-${item.tokenId.toString()}`}
              className="bg-gray-800 rounded-lg shadow-xl overflow-hidden border border-gray-700 transform transition duration-300 hover:scale-105"
            >
              <img
                src={
                  item.metadata?.image
                    ? item.metadata.image.replace(
                        "ipfs://",
                        "https://ipfs.io/ipfs/"
                      )
                    : "/placeholder-nft.png"
                }
                alt={item.metadata?.name || `NFT #${item.tokenId.toString()}`}
                className="w-full object-cover border-b border-gray-700"
              />

              <div className="p-4">
                <p className="flex justify-between text-lg font-semibold text-white mb-1">
                  <span>{item.metadata?.name}</span>
                  <span>{`#${item.tokenId.toString()}`}</span>
                </p>
                <p className="text-gray-400 text-sm mb-2 line-clamp-2">
                  {item.metadata?.description || "No description available."}
                </p>
                <p className="text-gray-300 text-sm">
                  Seller:{" "}
                  <span className="font-mono">
                    {formatAddress(item?.seller)}
                    {/* {item?.seller?.slice(0, 6)}...{item?.seller?.slice(-4)} */}
                  </span>
                </p>
                <p className="text-white text-lg font-bold mt-2">
                  Price: {formatEther(item.price)} ETH
                </p>
                {item.loadingMetadata && (
                  <p className="text-blue-400 text-xs mt-2">
                    Loading metadata...
                  </p>
                )}
                {item.seller.toLowerCase() !== accountAddress?.toLowerCase() ? (
                  <Button
                    onClick={() => handleBuyNFT(item.tokenId, item.price)}
                    disabled={isBuying}
                    className="w-full bg-accent-green hover:bg-green-600 text-white mt-2"
                  >
                    {isBuying && item.tokenId.toString() === buyItemTokenId
                      ? "Buying..."
                      : "Buy Now"}
                    {isBuying && item.tokenId.toString() === buyItemTokenId && (
                      <LoadingSpinner />
                    )}
                  </Button>
                ) : (
                  <p className="mt-4 text-center text-green-500">
                    Owned by you
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
