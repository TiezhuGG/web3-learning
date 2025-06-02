"use client";

import ConnectWalletPrompt from "@/components/ConnectWalletPrompt";
import { NftMarketplace } from "@/components/NftMarketplace";
import { useWallet } from "@/hooks/useWallet";

export default function Home() {
  const { isConnected } = useWallet();

  return (
    <div className="min-h-[calc(100vh-80px)] bg-gradient-to-br from-slate-900 via-gray-700 to-slate-900">
      <main className="container mx-auto px-4 py-8 ">
        {isConnected ? (
          <div className="space-y-5">
            <NftMarketplace />
          </div>
        ) : (
          <ConnectWalletPrompt />
        )}
      </main>
    </div>
  );
}
