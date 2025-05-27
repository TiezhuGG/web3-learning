import { formatEther } from "viem";
import { Button } from "@/components/ui/button";
import { useMintRandomNFT } from "@/hooks/useMintRandomNFT";
import { LoadingSpinner } from "@/components/ui/spinner";

export function NftMinting() {
  const { mintFee, handleMintNFT, isMinting, lastMintedTokenId } =
    useMintRandomNFT();

  return (
    <div className="p-6 bg-card-bg rounded-lg shadow-md border">
      <div className="flex items-center mb-4">
        <p className="text-lg font-medium">
          Mint Fee: {mintFee ? formatEther(mintFee!) : 0.01} ETH
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
