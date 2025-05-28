import { UseQueryResult } from "@tanstack/react-query";
import { Address, ReadContractErrorType, ReadContractReturnType } from "viem";
export interface Listing {
  price: bigint;
  seller: Address;
}
export interface NftMetadata {
  name: string;
  description: string;
  image: string;
  attributes: { trait_type: string; value: number | string }[];
}

export interface UserNft {
  tokenId: bigint;
  tokenUri: string;
  metadata: NftMetadata | null;
  loadingMetadata?: boolean;
  errorLoadingMetadata?: boolean;
}

export interface MarketplaceNft {
  tokenId: bigint;
  price: bigint;
  seller: `0x${string}`;
  metadata: NftMetadata | null;
  nftAddress?: `0x${string}`;
  loadingMetadata?: boolean;
}

export interface NFTRequestedEvent {
  eventName: "NFTRequested";
  args: {
    requestId: bigint;
    requester: string;
  };
}

export type ReRetchType = Promise<UseQueryResult<ReadContractReturnType, ReadContractErrorType>>

export type BigintType = bigint | undefined;