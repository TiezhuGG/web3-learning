import NftCard from "@/components/NftCard";
import { SkeletonCard } from "@/components/ui/skeleton";
import { useNftContext } from "@/context/NftContext";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function NftGallery() {
  const { userNFTs, isFetching, myNFTCount } = useNftContext();

  const numberOfSkeletons =
    myNFTCount && myNFTCount > 0n ? Number(myNFTCount) : 0;

  if (isFetching) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {Array.from({ length: numberOfSkeletons }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (userNFTs.length === 0) {
    return (
      <div className="text-center">
        <p className="text-gray-400 mb-5">
          You don't own any NFTs yet. Mint one!
        </p>
        <Button variant="outline">
          <Link href="/mint">Mint Custom NFT</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="p-5 bg-card-bg rounded-lg shadow-xl border">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {userNFTs.map((nft) => (
          <NftCard key={nft.tokenId.toString()} nft={nft} />
        ))}
      </div>
    </div>
  );
}
