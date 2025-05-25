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
  loadingMetadata: boolean;
  errorLoadingMetadata: boolean;
}

export interface NFTRequestedEvent {
  eventName: "NFTRequested";
  args: {
    requestId: bigint;
    requester: string;
  };
}

export type BigintType = bigint | undefined;