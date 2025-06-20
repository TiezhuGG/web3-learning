import Link from "next/link";
import { useMarketplaceContext } from "@/context/MarketplaceContext";
import { Button } from "@/components/ui/button";
import NftCard from "./NftCard";

export function NftMarketplace() {
  const { marketplaceNFTs } = useMarketplaceContext();

  return (
    <div className="p-6 rounded-lg shadow-md bg-gradient-to-br from-slate-900 via-gray-700 to-slate-900">
      <h2 className="text-3xl font-semibold mb-6">NFTs for Sale</h2>

      {marketplaceNFTs.length === 0 ? (
        <div className="text-center">
          <p className="text-gray-400 mb-5">No NFTs listed for sale.</p>
          <Button variant="outline">
            <Link href="/my-collection">To Listed NFT</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {marketplaceNFTs.map((nft) => (
            <NftCard
              key={nft.tokenId.toString()}
              nft={nft}
              showMarketInfo={true}
            />
          ))}
        </div>
      )}
    </div>
  );
}
