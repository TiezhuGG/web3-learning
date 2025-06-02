export interface PinataConfig {
  apiKey: string;
  apiSecret: string;
}

export interface PinataResponse {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
  isDuplicate?: boolean;
}

export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
  external_url?: string;
  background_color?: string;
  animation_url?: string;
}

class PinataService {
  private apiKey: string;
  private apiSecret: string;
  private baseUrl = "https://api.pinata.cloud";

  constructor(config: PinataConfig) {
    this.apiKey = config.apiKey;
    this.apiSecret = config.apiSecret;
  }

  async uploadFile(
    file: File,
    options?: { name?: string; keyvalues?: Record<string, string> }
  ): Promise<PinataResponse> {
    const formData = new FormData();
    formData.append("file", file);

    if (options?.name) {
      formData.append("pinataOptions", JSON.stringify({ cidVersion: 1 }));
      formData.append(
        "pinataMetadata",
        JSON.stringify({
          name: options.name,
          keyvalues: options.keyvalues || {},
        })
      );
    }

    const response = await fetch(`${this.baseUrl}/pinning/pinFileToIPFS`, {
      method: "POST",
      headers: {
        pinata_api_key: this.apiKey,
        pinata_secret_api_key: this.apiSecret,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to upload file to Pinata: ${error}`);
    }

    return response.json();
  }

  async uploadJSON(
    metadata: NFTMetadata,
    options?: { name?: string }
  ): Promise<PinataResponse> {
    const response = await fetch(`${this.baseUrl}/pinning/pinJSONToIPFS`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        pinata_api_key: this.apiKey,
        pinata_secret_api_key: this.apiSecret,
      },
      body: JSON.stringify({
        pinataContent: metadata,
        pinataOptions: { cidVersion: 1 },
        pinataMetadata: {
          name: options?.name || `NFT-Metadata-${Date.now()}`,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to upload JSON to Pinata: ${error}`);
    }

    return response.json();
  }

  async getFile(ipfsHash: string): Promise<Response> {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_GATEWAY_PINATA_CLOUD_IPFS}${ipfsHash}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch file from IPFS: ${response.statusText}`);
    }

    return response;
  }

  async getMetadata(ipfsHash: string): Promise<NFTMetadata> {
    const response = await this.getFile(ipfsHash);
    return response.json();
  }

  getGatewayUrl(ipfsHash: string): string {
    return `ipfs://${ipfsHash}`;
  }

  extractHashFromUrl(url: string): string | null {
    const match = url.match(/\/ipfs\/([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
  }
}

let pinataInstance: PinataService | null = null;

export function createPinataService(config: PinataConfig): PinataService {
  if (!pinataInstance) {
    pinataInstance = new PinataService(config);
  }
  return pinataInstance;
}

export function validateImageFile(file: File): {
  valid: boolean;
  error?: string;
} {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
  ];

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: "Invalid file type. Please upload JPG, PNG, GIF, or WebP images.",
    };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: "File size too large. Maximum size is 10MB.",
    };
  }

  return { valid: true };
}

export default PinataService;
