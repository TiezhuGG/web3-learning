"use client";

import { NftMinting } from "@/components/NftMinting";
import { NftGallery } from "@/components/NftGallery";
import { NftMarketplace } from "@/components/NftMarketplace";
import WalletConnect from "@/components/wallet/WalletConnect";
import { useWallet } from "@/hooks/useWallet";

export default function Home() {
  const { isConnected } = useWallet();

  return (
    <div className="min-h-screen bg-dark-bg">
      <header className="py-6 px-8 flex justify-between items-center bg-gray-800 shadow-lg">
        <h1 className="text-3xl font-bold text-white">Pokemon NFT Market</h1>
        <WalletConnect />
      </header>

      <main className="container mx-auto px-4 py-8">
        {isConnected ? (
          <div className="space-y-5">
            <NftMinting />
            <NftGallery />
            <NftMarketplace />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[calc(100vh-160px)]">
            <p className="text-xl text-gray-400 mb-6">
              Connect your wallet to explore the NFT market.
            </p>
          </div>
        )}
      </main>

      <footer className="py-4 text-center text-gray-500 text-sm">
        &copy; {new Date().getFullYear()} NFT Market.
      </footer>
    </div>
  );
}
