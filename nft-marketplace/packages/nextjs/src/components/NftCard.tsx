import { useState } from "react";
import { formatEther, parseEther } from "viem";
import { toast } from "sonner";
import { useNftContext } from "@/context/NftContext";
import { formatAddress } from "@/lib/utils";
import { UserNft, MarketplaceNft } from "@/types";
import { useMarketplace } from "@/hooks/useMarketplace";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/spinner";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import Image from "next/image";

type NftCardProps = {
  nft: UserNft | MarketplaceNft;
  showMarketInfo?: boolean;
};

export default function NftCard({ nft, showMarketInfo = false }: NftCardProps) {
  const { address: accountAddress } = useNftContext();
  const {
    buyNFT,
    isBuying,
    listNFT,
    isListing,
    isApproving,
    updateNFT,
    isUpdating,
    cancelNFT,
    isCanceling,
  } = useMarketplace();

  const [buyItemTokenId, setBuyItemTokenId] = useState<string | null>(null);
  const [newPrice, setNewPrice] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const handleListOrUpdate = async (tokenId: bigint, action: string) => {
    if (!newPrice || Number(newPrice) < 0) {
      toast.error("Please enter a valid price");
      setNewPrice("");
      return;
    }

    try {
      if (action === "list") {
        await listNFT(BigInt(tokenId), parseEther(newPrice));
      } else if (action === "update") {
        await updateNFT(BigInt(tokenId), parseEther(newPrice));
      }
    } catch (error) {
      toast.error(`Failed to ${action} NFT`);
    } finally {
      setNewPrice("");
      setIsOpen(false);
    }
  };

  const handleUnListNFT = async (tokenId: bigint) => {
    try {
      await cancelNFT(BigInt(tokenId));
    } catch (error) {
      console.log(error);
    }
  };

  const handleBuyNFT = async (tokenId: bigint, price: bigint) => {
    try {
      setBuyItemTokenId(tokenId.toString());
      await buyNFT(tokenId, price);
    } catch (error) {
      setBuyItemTokenId(null);
    }
  };

  const imageUrl = nft.metadata?.image
    ? nft.metadata.image.replace(
        "ipfs://",
        `${process.env.NEXT_PUBLIC_GATEWAY_PINATA_CLOUD_IPFS}`
      )
    : "/placeholder-nft.png"; // 占位符图片
  const name = nft.metadata?.name ?? "Untitled NFT";
  const description = nft.metadata?.description ?? "No description available.";
  const tokenId = nft.tokenId.toString();
  const price = "price" in nft ? nft.price : 0n;
  const seller = "seller" in nft ? nft.seller : "";

  const isListed = price! > 0n; // 检查是否已上架

  return (
    <div className="bg-transparent border border-gray-600/50 hover:border-gray-500 rounded-lg shadow-xl overflow-hidden transform transition duration-300 hover:scale-110">
      <div className="relative pt-[100%] overflow-hidden">
        <Image
          src={imageUrl}
          alt={name}
          fill
          className="object-cover border-b border-gray-700"
        />
      </div>

      <div className="px-4 py-2 text-white">
        {!showMarketInfo && (
          <p
            className={`${
              isListed ? "text-green-500" : "text-amber-500"
            } text-center`}
          >
            {isListed ? "Listed" : "UnListed"}
            {isListed && (
              <span className="ml-2">Price: {formatEther(price!)}</span>
            )}
          </p>
        )}
        <h3 className="flex justify-between font-semibold">
          {name}
          <span>#{tokenId}</span>
        </h3>
        <p className="text-xs line-clamp-2 my-1">{description}</p>

        {/* 显示市场NFT信息 */}
        {showMarketInfo && (
          <>
            <p className="text-gray-300 text-sm">
              Seller: <span className="font-mono">{formatAddress(seller)}</span>
            </p>
            <p className="text-white text-lg font-bold">
              Price: {formatEther(price!)} ETH
            </p>
            <div>
              {seller.toLowerCase() !== accountAddress?.toLowerCase() ? (
                <Button
                  onClick={() => handleBuyNFT(nft.tokenId, price!)}
                  disabled={isBuying}
                  className="w-full bg-accent-green hover:bg-green-600 text-white mt-1"
                >
                  {isBuying && tokenId === buyItemTokenId
                    ? "Buying..."
                    : "Buy Now"}
                  {isBuying && tokenId === buyItemTokenId && <LoadingSpinner />}
                </Button>
              ) : (
                <p className="mt-2.5 text-center text-green-500">
                  Owned by you
                </p>
              )}
            </div>
          </>
        )}

        {/* 显示用户NFT信息 */}
        {!showMarketInfo && (
          <div className="flex">
            {price ? (
              <div className="flex gap-2 w-full">
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setIsOpen(true)}
                    >
                      Update
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-gray-800 border-gray-700">
                    <DialogHeader>
                      <DialogTitle className="text-white">
                        Update NFT
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <>
                        <Label htmlFor="price" className="text-white mb-4">
                          New Price (ETH)
                        </Label>

                        <Input
                          id="price"
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="Enter new price"
                          value={newPrice}
                          onChange={(e) => setNewPrice(e.target.value)}
                          className="bg-gray-700 border-gray-600 text-white"
                        />
                      </>
                      <Button
                        onClick={() =>
                          handleListOrUpdate(nft.tokenId, "update")
                        }
                        className="w-full btn"
                        disabled={isUpdating || !newPrice}
                      >
                        {isUpdating ? "Processing..." : "Update Price"}
                        {isUpdating && <LoadingSpinner />}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => handleUnListNFT(nft.tokenId)}
                  disabled={isCanceling}
                >
                  {isCanceling ? "" : "UnList"}
                  {isCanceling && <LoadingSpinner />}
                </Button>
              </div>
            ) : (
              <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setIsOpen(true)}
                  >
                    List
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-gray-800 border-gray-700">
                  <DialogHeader>
                    <DialogTitle className="text-white">List NFT</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <>
                      <Label htmlFor="price" className="text-white mb-4">
                        Price (ETH)
                      </Label>

                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Enter NFT price"
                        value={newPrice}
                        onChange={(e) => setNewPrice(e.target.value)}
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    </>
                    <Button
                      onClick={() => handleListOrUpdate(nft.tokenId, "list")}
                      className="w-full btn"
                      disabled={isApproving || isListing || !newPrice}
                    >
                      {isApproving || isListing ? "Processing..." : "List NFT"}
                      {isApproving || (isListing && <LoadingSpinner />)}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
