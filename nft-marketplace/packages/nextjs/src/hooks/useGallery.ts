import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { UserNft } from "@/types";
import { useFetchNFTMetadata } from "./useFetchNFTMetadata";
import { useNftContext } from "@/context/NftContext";

export function useGallery() {
  const { address, tokenCounter, myNFTCount } = useNftContext();
  const { fetchUserData } = useFetchNFTMetadata();

  const [userNFTs, setUserNFTs] = useState<UserNft[]>([]);

  const loadNFTs = async () => {
    const metadataPromises: Promise<UserNft | null>[] = [];

    for (let i = 0n; i < tokenCounter!; i++) {
      metadataPromises.push(fetchUserData(i));
    }

    const results = await Promise.all(metadataPromises);
    const filteredResults = results.filter((nft) => nft !== null) as UserNft[];
    setUserNFTs(filteredResults);
  };

  useEffect(() => {
    loadNFTs();
  }, [address, tokenCounter, myNFTCount]);

  return {
    userNFTs,
    setUserNFTs,
  };
}
