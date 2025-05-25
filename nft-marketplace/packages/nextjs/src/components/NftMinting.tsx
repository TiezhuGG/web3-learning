"use client";

import { useState, useEffect } from "react";
import { formatEther } from "viem";
import { Button } from "@/components/ui/button";
import { useMintRandomNFT } from "@/hooks/useMintRandomNFT";

export function NftMinting() {
  const { mintFee, handleMintNFT, isMinting, lastMintedTokenId } =
    useMintRandomNFT();
  // const [mintedTokenId, setMintedTokenId] = useState<bigint | null>(null);

  const LoadingSpinner = () => (
    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white inline-block ml-2"></div>
  );

  return (
    <div className="p-6 bg-card-bg rounded-lg shadow-md border border-gray-700">
      <div className="flex items-center mb-4">
        <p className="text-lg font-medium text-gray-300">
          Mint Fee: {formatEther(mintFee!)} ETH
        </p>
      </div>

      <Button
        onClick={handleMintNFT}
        disabled={isMinting}
        className="transition duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isMinting ? `Minting NFT...` : "Mint Random NFT"}
        {isMinting && <LoadingSpinner />}
      </Button>

      {lastMintedTokenId !== null && (
        <p className="mt-4 text-sm text-accent-green">
          🎉 Successfully Minted NFT with Token ID: {lastMintedTokenId}!
        </p>
      )}
    </div>
  );
}
