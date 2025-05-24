import { UserNft } from "@/types";

export default function NftCard({ nft }: { nft: UserNft }) {
  const imageUrl = nft.metadata?.image
    ? nft.metadata.image.replace("ipfs://", "https://ipfs.io/ipfs/")
    : "/placeholder-nft.png"; // 占位符图片
  const name = nft.metadata?.name || `NFT #${nft.tokenId.toString()}`;
  const description = nft.metadata?.description || "No description available.";

  return (
    <div className="bg-gray-800 rounded-lg shadow-xl overflow-hidden transform transition duration-300 hover:scale-105">
      <img
        src={imageUrl}
        alt={name}
        className="w-full h-48 object-cover border-b border-gray-700"
      />
      <div className="p-4">
        <h3 className="text-xl font-semibold text-white mb-2">{name}</h3>
        <p className="text-gray-400 text-sm mb-3 line-clamp-2">{description}</p>
        <p className="text-gray-300 text-sm">
          Token ID: <span className="font-mono">{nft.tokenId.toString()}</span>
        </p>
        {nft.loadingMetadata && (
          <p className="text-blue-400 text-xs mt-2">Loading metadata...</p>
        )}
        {nft.errorLoadingMetadata && (
          <p className="text-red-400 text-xs mt-2">Error loading metadata.</p>
        )}
      </div>
    </div>
  );
}
