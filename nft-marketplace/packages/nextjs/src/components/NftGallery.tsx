import NftCard from "@/components/NftCard";
import { useGallery } from "@/hooks/useGallery";

export function NftGallery() {
  const { userNFTs } = useGallery();
  console.log('画廊', userNFTs)
  return (
    <div className="p-6 bg-card-bg rounded-lg shadow-xl border">
      {userNFTs.length === 0 ? (
        <p className="text-center text-gray-400">
          You don't own any NFTs yet. Mint one!
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {userNFTs.map((nft) => (
            <NftCard key={nft.tokenId.toString()} nft={nft} />
          ))}
        </div>
      )}
    </div>
  );
}
