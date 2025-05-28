import { useContext, createContext } from "react";
import {
  useAccount,
  useReadContract,
  type UseReadContractParameters,
} from "wagmi";
import { Address } from "viem";
import {
  RANDOM_IPFS_NFT_ABI,
  RANDOM_IPFS_NFT_CONTRACT_ADDRESS,
} from "@/constants/randomIpfsNft";
import { BigintType, ReRetchType } from "@/types";

const randomContractConfig: UseReadContractParameters = {
  address: RANDOM_IPFS_NFT_CONTRACT_ADDRESS,
  abi: RANDOM_IPFS_NFT_ABI,
};

interface NftContextType {
  address: Address | undefined;
  mintFee: BigintType;
  tokenCounter: BigintType;
  myNFTCount: BigintType;
  refetchTokenCounter: () => ReRetchType;
  refetchMyNFTCount: () => ReRetchType;
}

const NftContext = createContext<NftContextType>({} as NftContextType);

export function NftProvider({ children }: { children: React.ReactNode }) {
  const { address } = useAccount();

  const { data: mintFee } = useReadContract({
    ...randomContractConfig,
    functionName: "getMintFee",
    query: {
      enabled: !!randomContractConfig.address,
    },
  });

  const { data: tokenCounter, refetch: refetchTokenCounter } = useReadContract({
    ...randomContractConfig,
    functionName: "getTokenCounter",
    query: {
      enabled: !!randomContractConfig.address,
    },
  });

  const { data: myNFTCount, refetch: refetchMyNFTCount } = useReadContract({
    ...randomContractConfig,
    functionName: "balanceOf",
    args: [address!],
  });

  const value = {
    address,
    mintFee: mintFee as BigintType,
    tokenCounter: tokenCounter as BigintType,
    myNFTCount: myNFTCount as BigintType,
    refetchTokenCounter,
    refetchMyNFTCount,
  };

  return <NftContext.Provider value={value}>{children}</NftContext.Provider>;
}

export function useNftContext() {
  const context = useContext(NftContext);
  if (!context) {
    throw new Error("useNftContext must be used within a NftProvider");
  }
  return context;
}
