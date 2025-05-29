"use client";

import { NftMarketplace } from "@/components/NftMarketplace";
import { useWallet } from "@/hooks/useWallet";

export default function Home() {
  const { isConnected } = useWallet();

  return (
    <div className="h-screen bg-gradient-to-br from-slate-900 via-gray-700 to-slate-900">
      <main className="container mx-auto px-4 py-8 ">
        {isConnected ? (
          <div className="space-y-5">
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
    </div>
  );
}
