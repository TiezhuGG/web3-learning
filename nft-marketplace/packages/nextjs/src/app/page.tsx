"use client";

import { useEffect } from "react";
import { useAccount, useConnect } from "wagmi";
import { injected } from "wagmi/connectors";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useNFT } from "@/hooks/useNFT";
import { useMarketplace } from "@/hooks/useMarketplace";
import { formatAddress, formatEther } from "@/lib/utils";

export default function Home() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { tokenCounter, balance, mintNFT, approveMarketplace } = useNFT();
  const {
    proceeds,
    listing,
    refetchListing,
    listNFT,
    buyNFT,
    cancelListing,
    withdrawProceeds,
  } = useMarketplace();

  const handleConnect = () => {
    connect({ connector: injected() });
  };

  const handleMint = async () => {
    try {
      const hash = await mintNFT();
      console.log("Mint transaction:", hash);
    } catch (error) {
      console.error("Failed to mint:", error);
    }
  };

  const handleList = async () => {
    try {
      const tokenId = 0n;
      const price = BigInt(1e16); // 0.01 ETH
      await approveMarketplace(tokenId, "YOUR_MARKETPLACE_ADDRESS");
      const hash = await listNFT(tokenId, price);
      console.log("List transaction:", hash);
    } catch (error) {
      console.error("Failed to list:", error);
    }
  };

  const handleBuy = async () => {
    try {
      const tokenId = 0n;
      const hash = await buyNFT(tokenId, listing?.price || 0n);
      console.log("Buy transaction:", hash);
    } catch (error) {
      console.error("Failed to buy:", error);
    }
  };

  const handleWithdraw = async () => {
    try {
      const hash = await withdrawProceeds();
      console.log("Withdraw transaction:", hash);
    } catch (error) {
      console.error("Failed to withdraw:", error);
    }
  };

  useEffect(() => {
    if (isConnected) {
      refetchListing();
    }
  }, [isConnected, refetchListing]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-8">
      <div className="container mx-auto">
        <h1 className="mb-8 text-center text-4xl font-bold text-white">
          NFT Marketplace
        </h1>

        {!isConnected ? (
          <Card className="mx-auto max-w-md backdrop-blur-lg bg-white/10">
            <CardHeader>
              <CardTitle className="text-white">Welcome</CardTitle>
              <CardDescription className="text-gray-200">
                Connect your wallet to get started
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button onClick={handleConnect}>Connect Wallet</Button>
            </CardFooter>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Account Info */}
            <Card className="backdrop-blur-lg bg-white/10">
              <CardHeader>
                <CardTitle className="text-white">Account</CardTitle>
                <CardDescription className="text-gray-200">
                  {formatAddress(address!)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-white">
                  Balance: {balance?.toString() || "0"} NFTs
                </p>
                <p className="text-white">
                  Proceeds: {proceeds ? formatEther(proceeds) : "0"} ETH
                </p>
              </CardContent>
              {proceeds && proceeds > 0n ? (
                <CardFooter>
                  <Button onClick={handleWithdraw} variant="secondary">
                    Withdraw Proceeds
                  </Button>
                </CardFooter>
              ) : null}
            </Card>

            {/* Mint NFT */}
            <Card className="backdrop-blur-lg bg-white/10">
              <CardHeader>
                <CardTitle className="text-white">Mint NFT</CardTitle>
                <CardDescription className="text-gray-200">
                  Total Supply: {tokenCounter?.toString() || "0"}
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Button onClick={handleMint}>Mint NFT</Button>
              </CardFooter>
            </Card>

            {/* Market Actions */}
            <Card className="backdrop-blur-lg bg-white/10">
              <CardHeader>
                <CardTitle className="text-white">Marketplace</CardTitle>
                <CardDescription className="text-gray-200">
                  {listing && listing.price > 0n
                    ? `Listed for ${formatEther(listing.price)} ETH`
                    : "Not listed"}
                </CardDescription>
              </CardHeader>
              <CardFooter className="flex gap-4">
                {listing && listing.price > 0n ? (
                  <Button onClick={handleBuy} className="flex-1">
                    Buy NFT
                  </Button>
                ) : (
                  <Button onClick={handleList} variant="secondary">
                    List NFT
                  </Button>
                )}
              </CardFooter>
            </Card>
          </div>
        )}
      </div>
    </main>
  );
}
