import { formatEther } from "viem";
import { Button } from "@/components/ui/button";
import { useMintRandomNFT } from "@/hooks/useMintRandomNFT";
import { LoadingSpinner } from "@/components/ui/spinner";
import { useNftContext } from "@/context/NftContext";
import { useMarketplaceContext } from "@/context/MarketplaceContext";
import { useMarketplace } from "@/hooks/useMarketplace";

export function NftMinting() {
  const { handleMintNFT, isMinting } = useMintRandomNFT();
  const { mintFee,lastMintedTokenId } = useNftContext();
  const { proceeds } = useMarketplaceContext();
  const { withdrawProceeds, isWithdrawing } = useMarketplace();

  return (
    <div className="flex justify-between p-5 bg-card-bg rounded-lg shadow-md border">
      <div>
        <h2 className="flex items-center text-2xl font-semibold mb-5">
          Mint Your NFT
          <p className="ml-2 text-lg font-medium">
            ( Mint Fee: {mintFee ? formatEther(mintFee!) : 0.01} ETH )
          </p>
        </h2>

        <Button
          onClick={handleMintNFT}
          disabled={isMinting}
          className="hover:bg-green-600"
        >
          {isMinting ? `Minting NFT...` : "Mint Random NFT"}
          {isMinting && <LoadingSpinner />}
        </Button>

        {lastMintedTokenId !== undefined && (
          <p className="mt-4 text-sm text-accent-green">
            🎉 Successfully Minted NFT with Token ID: {lastMintedTokenId}
          </p>
        )}
      </div>

      <div>
        <h3 className="flex items-center text-2xl font-semibold mb-5">
          Your Proceeds
          <p className="ml-2 text-lg font-medium">
            ( {formatEther(proceeds)} ETH )
          </p>
        </h3>
        <Button
          onClick={withdrawProceeds}
          disabled={isWithdrawing || proceeds === 0n}
          className="hover:bg-green-600"
        >
          {isWithdrawing ? "Withdrawing..." : "Withdraw Proceeds"}
          {isWithdrawing && <LoadingSpinner />}
        </Button>
      </div>
    </div>
  );
}
