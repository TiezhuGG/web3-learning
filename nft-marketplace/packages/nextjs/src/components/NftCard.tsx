import { useState } from "react";
import { formatEther } from "viem";
import { useNftContext } from "@/context/NftContext";
import { formatAddress } from "@/lib/utils";
import { UserNft, MarketplaceNft } from "@/types";
import { useMarketplace } from "@/hooks/useMarketplace";
import { Button } from "./ui/button";
import { LoadingSpinner } from "./ui/spinner";

type NftCardProps = {
  nft: UserNft | MarketplaceNft;
  showMarketInfo?: boolean;
};

export default function NftCard({ nft, showMarketInfo = false }: NftCardProps) {
  const { address: accountAddress } = useNftContext();
  const { buyNFT, isBuying } = useMarketplace();

  const [buyItemTokenId, setBuyItemTokenId] = useState<string | null>(null);

  const handleBuyNFT = async (tokenId: bigint, price: bigint) => {
    try {
      setBuyItemTokenId(tokenId.toString());
      await buyNFT(tokenId, price);
    } catch (error) {
      setBuyItemTokenId(null);
    }
  };

  const imageUrl = nft.metadata?.image
    ? nft.metadata.image.replace("ipfs://", "https://ipfs.io/ipfs/")
    : "/placeholder-nft.png"; // 占位符图片
  const name = nft.metadata?.name ?? "Untitled NFT";
  const description = nft.metadata?.description ?? "No description available.";
  const tokenId = nft.tokenId.toString();
  const price = "price" in nft ? nft.price : 0n;
  const seller = "seller" in nft ? nft.seller : "0x0000...0000";
  
  return (
    <div className="bg-gray-800 rounded-lg shadow-xl overflow-hidden transform transition duration-300 hover:scale-105">
      <img
        src={imageUrl}
        alt={name}
        className="w-full object-cover border-b border-gray-700"
      />

      <div className="px-4 py-2 text-white">
        <h3 className="flex justify-between font-semibold">
          {name}
          <span>#{tokenId}</span>
        </h3>
        <p className="text-xs line-clamp-2 my-1">{description}</p>
        {price && seller && showMarketInfo ? (
          <>
            <p className="text-gray-300 text-sm">
              Seller: <span className="font-mono">{formatAddress(seller)}</span>
            </p>
            <p className="text-white text-lg font-bold">
              Price: {formatEther(price)} ETH
            </p>
            <div>
              {seller.toLowerCase() !== accountAddress?.toLowerCase() ? (
                <Button
                  onClick={() => handleBuyNFT(nft.tokenId, price)}
                  disabled={isBuying}
                  className="w-full bg-accent-green hover:bg-green-600 text-white mt-1"
                >
                  {isBuying && tokenId === buyItemTokenId
                    ? "Buying..."
                    : "Buy Now"}
                  {isBuying && tokenId === buyItemTokenId && <LoadingSpinner />}
                </Button>
              ) : (
                <p className="mt-2.5 text-center text-green-500">Owned by you</p>
              )}
            </div>
          </>
        ) : (
          <p className="text-xs mt-1">Token ID: {tokenId}</p>
        )}
      </div>
    </div>
  );
}
