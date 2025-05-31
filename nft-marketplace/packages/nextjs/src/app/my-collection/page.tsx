"use client";

import { formatEther } from "viem";
import { Store, DollarSign, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NftGallery } from "@/components/NftGallery";
import { useMintRandomNFT } from "@/hooks/useMintRandomNFT";
import { LoadingSpinner } from "@/components/ui/spinner";
import { useNftContext } from "@/context/NftContext";
import { useMarketplaceContext } from "@/context/MarketplaceContext";
import { useMarketplace } from "@/hooks/useMarketplace";

export default function MyCollectionPage() {
  const { handleMintNFT, isMinting } = useMintRandomNFT();
  const { userNFTs, lastMintedTokenId, myNFTCount } = useNftContext();
  const { proceeds } = useMarketplaceContext();
  const { withdrawProceeds, isWithdrawing } = useMarketplace();
  const listedNFTsCount = userNFTs.filter((nft) => nft.price).length;

  return (
    <div className="min-h-[calc(100vh-80px)] bg-gradient-to-br from-slate-900 via-gray-700 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-200 bg-clip-text text-transparent mb-4">
            My Collection
          </h1>
          <p className="text-gray-300 text-lg">Manage your NFT portfolio</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="h-full w-full flex items-center">
              <Sparkles className="w-10 h-10 text-cyan-400" />
              <div className="ml-5">
                <p className="text-xl mb-2">Total NFTs</p>
                <h3 className="text-2xl font-bold text-white">{myNFTCount ? myNFTCount.toString() : 0}</h3>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="h-full w-full flex items-center">
              <Store className="w-10 h-10 text-purple-400" />
              <div className="ml-5">
                <p className="text-xl mb-2">Listed for Sale</p>
                <h3 className="text-2xl font-bold text-white">
                  {listedNFTsCount}
                </h3>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="h-full w-full flex items-center">
              <DollarSign className="w-10 h-10 text-green-400" />
              <div className="ml-5">
                <p className="text-xl mb-2">You Proceeds (ETH)</p>
                <div className="flex justify-between">
                  <h3 className="text-2xl font-bold text-white truncate max-w-[100px]">
                    {formatEther(proceeds)}
                  </h3>
                  {proceeds > 0n && (
                    <Button
                      variant="outline"
                      onClick={withdrawProceeds}
                      disabled={isWithdrawing}
                    >
                      {isWithdrawing ? "withdrawing" : "withdraw"}
                      {isWithdrawing && <LoadingSpinner />}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-between items-center mb-5">
          <h2 className="text-2xl font-semibold">Your NFTs</h2>
          <div className="max-md:hidden">
            {lastMintedTokenId !== undefined && (
              <p>
                🎉 Successfully Minted NFT with Token ID: {lastMintedTokenId}
              </p>
            )}
          </div>
          <Button variant="outline" onClick={handleMintNFT} disabled={isMinting} className="hover:scale-105">
            {isMinting ? `Minting NFT...` : "Mint Random NFT"}
            {isMinting && <LoadingSpinner />}
          </Button>
        </div>

        <NftGallery />
      </div>
    </div>
  );
}
