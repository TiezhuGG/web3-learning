import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { useMintRandomNFT } from "./useMintRandomNFT";
import { UserNft } from "@/types";
import { useFetchNFTMetadata } from "./useFetchNFTMetadata";

export function useGallery() {
  const { address } = useAccount();
  const { tokenCounter } = useMintRandomNFT();
  const { fetchNFTMetadata } = useFetchNFTMetadata();

  const [userNFTs, setUserNFTs] = useState<UserNft[]>([]);

  const loadNFTs = async () => {
    const metadataPromises: Promise<UserNft | null>[] = [];

    for (let i = 0n; i < tokenCounter!; i++) {
      metadataPromises.push(fetchNFTMetadata(i));
    }

    const results = await Promise.all(metadataPromises);
    const filteredResults = results.filter((nft) => nft !== null) as UserNft[];
    setUserNFTs(filteredResults);
  };

  useEffect(() => {
    loadNFTs();
  }, [address, tokenCounter, fetchNFTMetadata]);

  return {
    userNFTs,
  };
}
