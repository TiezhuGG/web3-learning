"use client";

import React, { useState, useEffect } from "react";
import {
  useAccount,
  useReadContract,
  useSimulateContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useWatchContractEvent,
} from "wagmi";
import { parseEther, formatEther } from "viem";
import { publicClient } from "@/lib/wagmi";
import { ethers } from "ethers"; // 用于获取 NFT 所有者和批准状态
import {
  NFT_MARKETPLACE_CONTRACT_ADDRESS,
  NFT_MARKETPLACE_NFT_ABI,
  RANDOM_IPFS_NFT_ABI,
  RANDOM_IPFS_NFT_CONTRACT_ADDRESS,
} from "@/constants";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/spinner";
import { useMarketplace } from "@/hooks/useMarketplace";
import ListForm from "./ListForm";
import { useMarketplaceContext } from "@/context/MarketplaceContext";

// interface Listing {
//   price: bigint;
//   seller: `0x${string}`;
// }

// interface NftMetadata {
//   name: string;
//   description: string;
//   image: string;
//   attributes: { trait_type: string; value: number | string }[];
// }

// interface MarketplaceItem {
//   nftAddress: `0x${string}`;
//   tokenId: bigint;
//   price: bigint;
//   seller: `0x${string}`;
//   metadata: NftMetadata | null;
//   loadingMetadata: boolean;
// }

export function NftMarketplace() {
  const { buyNFT, withdrawProceeds } = useMarketplace();
  const { marketplaceNFTs, proceeds } = useMarketplaceContext();
  const { address: accountAddress } = useAccount();
  const [isLoadingMarketplace, setIsLoadingMarketplace] = useState(false);

  return (
    <div className="p-6 bg-card-bg rounded-lg shadow-md border border-gray-700">
      <div className="mb-8 p-4 bg-gray-800 rounded-lg shadow-inner">
        <h3 className="text-xl font-semibold text-white mb-2">Your Proceeds</h3>
        <p className="text-white text-lg text-accent-green mb-4">
          Available: {formatEther(proceeds)} ETH
        </p>
        <Button
          onClick={withdrawProceeds}
          disabled={proceeds === 0n}
          className="hover:bg-green-600"
        >
          {"Withdraw Proceeds"}

          {/* {isWithdrawing
            ? "Withdrawing..."
            : isWithdrawConfirming
            ? "Confirming..."
            : "Withdraw Proceeds"}
          {(isWithdrawing || isWithdrawConfirming) && <LoadingSpinner />} */}
        </Button>
      </div>

      {/* {lastTxMessage && (
        <div
          className={`p-3 mb-4 rounded-md ${
            isError ? "bg-red-800 text-red-100" : "bg-blue-800 text-blue-100"
          }`}
        >
          {lastTxMessage}
        </div>
      )} */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <ListForm />
        <ListForm formState="update" />
        <ListForm formState="cancel" />
      </div>

      <h2 className="text-2xl font-semibold text-white mb-6">Items for Sale</h2>
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
                    {item?.seller?.slice(0, 6)}...{item?.seller?.slice(-4)}
                  </span>
                </p>
                <p className="text-lg font-bold mt-2">
                  Price: {formatEther(item.price)} ETH
                </p>
                {item.loadingMetadata && (
                  <p className="text-blue-400 text-xs mt-2">
                    Loading metadata...
                  </p>
                )}
                {item.seller.toLowerCase() !== accountAddress?.toLowerCase() ? (
                  <Button
                    // onClick={() => handleBuyItem(item.tokenId, item.price)}
                    onClick={() => buyNFT(item.tokenId, item.price)}
                    // disabled={
                    //   (isBuyingItem && item.tokenId.toString() === buyItemId) ||
                    //   (isBuyItemConfirming &&
                    //     item.tokenId.toString() === buyItemId)
                    // }
                    className="mt-4 w-full bg-accent-green hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {"Buy Now"}

                    {/* {isBuyingItem && item.tokenId.toString() === buyItemId
                      ? "Buying..."
                      : isBuyItemConfirming &&
                        item.tokenId.toString() === buyItemId
                      ? "Confirming..."
                      : "Buy Now"}
                    {((isBuyingItem && item.tokenId.toString() === buyItemId) ||
                      (isBuyItemConfirming &&
                        item.tokenId.toString() === buyItemId)) && (
                      <LoadingSpinner />
                    )} */}
                  </Button>
                ) : (
                  <p className="mt-4 text-center text-gray-500 text-sm">
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
