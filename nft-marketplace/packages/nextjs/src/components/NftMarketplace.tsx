"use client";

import { useMarketplaceContext } from "@/context/MarketplaceContext";
import ListForm from "./ListForm";
import NftCard from "./NftCard";

export function NftMarketplace() {
  const { marketplaceNFTs } = useMarketplaceContext();

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
            <NftCard nft={item} showMarketInfo={true} />
          ))}
        </div>
      )}
    </div>
  );
}
