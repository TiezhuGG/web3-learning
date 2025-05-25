"use client";

import { useEffect } from "react";
import { useMintRandomNFT } from "@/hooks/useMintRandomNFT";
import { useMarketplace } from "@/hooks/useMarketplace";
import { NftMinting } from "@/components/NftMinting";
import { NftGallery } from "@/components/NftGallery";
import { NftMarketplace } from "@/components/NftMarketplace";
import WalletConnect from "@/components/wallet/WalletConnect";
import { useWallet } from "@/hooks/useWallet";

export default function Home() {
  const { isConnected } = useWallet();
  const { tokenCounter, balance, mintNFT, mintFee } = useMintRandomNFT();
  const {
    proceeds,
    listing,
    refetchListing,
    listNFT,
    buyNFT,
    cancelListing,
    withdrawProceeds,
  } = useMarketplace();

  const handleMint = async () => {
    try {
      const hash = await mintNFT();
      console.log("==========Mint transaction:", hash);
    } catch (error) {
      console.error("Failed to mint:", error);
    }
  };

  const handleList = async () => {
    try {
      const tokenId = 0n;
      const price = BigInt(1e16); // 0.01 ETH
      // await approveMarketplace(tokenId, "YOUR_MARKETPLACE_ADDRESS");
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
    <div className="min-h-screen bg-dark-bg text-gray-200">
      <header className="py-6 px-8 flex justify-between items-center bg-gray-800 shadow-lg">
        <h1 className="text-3xl font-bold text-white">Random NFT Market</h1>
        <WalletConnect />
      </header>

      <main className="container mx-auto px-4 py-8">
        {isConnected ? (
          <div className="space-y-12">
            {/* Minting Section */}
            <section className="bg-card-bg rounded-lg shadow-xl p-8">
              <h2 className="text-2xl font-semibold mb-6 text-white">
                Mint Your Random NFT
              </h2>
              <NftMinting />
            </section>

            {/* Your NFTs Section */}
            <section className="bg-card-bg rounded-lg shadow-xl p-8">
              <h2 className="text-2xl font-semibold mb-6 text-white">
                Your NFTs
              </h2>
              <NftGallery />
            </section>

            {/* NFT Marketplace Section */}
            <section className="bg-card-bg rounded-lg shadow-xl p-8">
              <h2 className="text-2xl font-semibold mb-6 text-white">
                NFT Marketplace
              </h2>
              <NftMarketplace />
            </section>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[calc(100vh-160px)]">
            <p className="text-xl text-gray-400 mb-6">
              Connect your wallet to explore the NFT market.
            </p>
            {/* <ConnectWallet />  */}
          </div>
        )}
      </main>

      <footer className="py-4 text-center text-gray-500 text-sm">
        &copy; {new Date().getFullYear()} Random NFT Market. All rights
        reserved.
      </footer>
    </div>
    // <main className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-8">
    //   <div className="container mx-auto">
    //     <h1 className="mb-8 text-center text-4xl font-bold text-white">
    //       NFT Marketplace
    //     </h1>

    //     {!isConnected ? (
    //       <ConnectWallet />
    //     ) : (
    //       <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
    //         {/* Account Info */}
    //         <Card className="backdrop-blur-lg bg-white/10">
    //           <CardHeader>
    //             <CardTitle className="text-white">Account</CardTitle>
    //             <CardDescription className="text-gray-200">
    //               {formatAddress(address!)}
    //             </CardDescription>
    //           </CardHeader>
    //           <CardContent>
    //             <p className="text-white">
    //               Balance: {balance?.toString() || "0"} NFTs
    //             </p>
    //             <p className="text-white">
    //               Proceeds: {proceeds ? formatEther(proceeds) : "0"} ETH
    //             </p>
    //           </CardContent>
    //           {proceeds && proceeds > 0n ? (
    //             <CardFooter>
    //               <Button onClick={handleWithdraw} variant="secondary">
    //                 Withdraw Proceeds
    //               </Button>
    //             </CardFooter>
    //           ) : null}
    //         </Card>

    //         {/* Mint NFT */}
    //         <Card className="backdrop-blur-lg bg-white/10">
    //           <CardHeader>
    //             <CardTitle className="text-white">Mint NFT</CardTitle>
    //             <CardDescription className="text-gray-200">
    //               Total Supply: {tokenCounter?.toString() || "0"}
    //             </CardDescription>
    //           </CardHeader>
    //           <CardFooter>
    //             <Button onClick={handleMint}>Mint NFT</Button>
    //           </CardFooter>
    //         </Card>

    //         {/* Market Actions */}
    //         <Card className="backdrop-blur-lg bg-white/10">
    //           <CardHeader>
    //             <CardTitle className="text-white">Marketplace</CardTitle>
    //             <CardDescription className="text-gray-200">
    //               {listing && listing.price > 0n
    //                 ? `Listed for ${formatEther(listing.price)} ETH`
    //                 : "Not listed"}
    //             </CardDescription>
    //           </CardHeader>
    //           <CardFooter className="flex gap-4">
    //             {listing && listing.price > 0n ? (
    //               <Button onClick={handleBuy} className="flex-1">
    //                 Buy NFT
    //               </Button>
    //             ) : (
    //               <Button onClick={handleList} variant="secondary">
    //                 List NFT
    //               </Button>
    //             )}
    //           </CardFooter>
    //         </Card>
    //       </div>
    //     )}
    //   </div>

    //   <NFTDisplay />
    // </main>
  );
}
