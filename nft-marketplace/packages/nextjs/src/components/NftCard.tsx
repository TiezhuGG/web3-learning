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
        className="w-full object-cover border-b border-gray-700"
      />

      <div className="px-4 py-2 text-white">
        <h3 className="font-semibold">{name}</h3>
        <p className="text-xs line-clamp-2 my-1">{description}</p>
        <p className="text-xs">
          Token ID: <span className="font-mono">{nft.tokenId.toString()}</span>
        </p>
      </div>
    </div>
  );
}
