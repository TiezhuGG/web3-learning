import { useMintRandomNFT } from "@/hooks/useMintRandomNFT";
import { useEffect, useState } from "react";
import Image from "next/image";
import { Button } from "./ui/button";

interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: number;
  }>;
}

export function NFTDisplay() {
  const {
    tokenCounter,
    mintNFT,
    isMinting,
    lastMintedTokenId,
    tokenUris,
    mintFee,
  } = useMintRandomNFT();
  const [metadata, setMetadata] = useState<NFTMetadata | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMetadata() {
      if (tokenUris) {
        try {
          // 将 ipfs:// 转换为 https://
          const httpsUrl = tokenUris.replace(
            "ipfs://",
            "https://ipfs.io/ipfs/"
          );
          const response = await fetch(httpsUrl);
          const data = await response.json();
          setMetadata(data);
        } catch (err) {
          console.error("Error fetching metadata:", err);
          setError("Failed to fetch NFT metadata");
        }
      }
    }

    fetchMetadata();
  }, [tokenUris]);

  const handleMint = async () => {
    try {
      setError(null);
      await mintNFT();
    } catch (err: any) {
      console.error("Mint error:", err);
      setError(err.message);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <h1 className="text-2xl font-bold">Random IPFS NFT</h1>

      <div className="stats bg-primary text-primary-content">
        <div className="stat">
          <div className="stat-title">Total NFTs Minted</div>
          <div className="stat-value">{tokenCounter?.toString() ?? "0"}</div>
        </div>
        <div className="stat">
          <div className="stat-title">Mint Fee</div>
          <div className="stat-value">
            {mintFee
              ? `${(Number(mintFee) / 1e18).toFixed(4)} ETH`
              : "Loading..."}
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <span>{error}</span>
        </div>
      )}

      <Button
        className={`btn btn-primary ${isMinting ? "loading" : ""}`}
        onClick={handleMint}
        disabled={isMinting}
      >
        {isMinting ? "Minting..." : "Mint NFT"}
      </Button>

      {lastMintedTokenId !== null && (
        <div className="card w-96 bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Last Minted NFT</h2>
            <p>Token ID: {lastMintedTokenId.toString()}</p>
            {metadata && (
              <>
                <h3 className="font-bold">{metadata.name}</h3>
                <div>{metadata.description}</div>
                {metadata.image && (
                  <div className="relative w-full h-64">
                    <Image
                      src={metadata.image.replace(
                        "ipfs://",
                        "https://ipfs.io/ipfs/"
                      )}
                      alt={metadata.name}
                      fill
                      className="object-contain"
                    />
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {metadata.attributes.map((attr, index) => (
                    <div key={index} className="badge badge-secondary">
                      {attr.trait_type}: {attr.value}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
