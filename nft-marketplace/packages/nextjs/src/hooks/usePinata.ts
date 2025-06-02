"use client";

import { useState, useCallback, useEffect } from "react";
import {
  createPinataService,
  type NFTMetadata,
  validateImageFile,
} from "@/lib/pinata";
import {UsePinataConfig, UploadProgress} from '@/types';

export function usePinata(config?: UsePinataConfig) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    stage: "idle",
    progress: 0,
    message: "",
  });
  const [error, setError] = useState<string | null>(null);

  let pinata: any = null;

  const initializePinata = useCallback(() => {
    pinata = createPinataService({
      apiKey: process.env.PINATA_API_KEY || "",
      apiSecret: process.env.PINATA_API_SECRET || "",
    });

    return true;
  }, [config]);

  useEffect(() => {
    initializePinata();
  }, []);

  const uploadImage = useCallback(
    async (file: File, name?: string): Promise<string> => {
      if (!initializePinata()) {
        throw new Error(
          "Pinata not configured. Please provide API credentials."
        );
      }

      const validation = validateImageFile(file);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      setIsUploading(true);
      setUploadProgress({
        stage: "uploading-image",
        progress: 0,
        message: "Uploading image to IPFS...",
      });
      setError(null);

      try {
        const response = await pinata.uploadFile(file, {
          name: name || `NFT-Image-${Date.now()}`,
          keyvalues: {
            type: "nft-image",
            uploadedAt: new Date().toISOString(),
          },
        });

        setUploadProgress({
          stage: "complete",
          progress: 100,
          message: "🎉 Image uploaded successfully!",
        });

        return response.IpfsHash;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to upload image";
        setError(errorMessage);
        setUploadProgress({
          stage: "error",
          progress: 0,
          message: errorMessage,
        });
        throw err;
      } finally {
        setIsUploading(false);
      }
    },
    [initializePinata]
  );

  const uploadMetadata = useCallback(
    async (metadata: NFTMetadata, name?: string): Promise<string> => {
      if (!initializePinata()) {
        throw new Error(
          "Pinata not configured. Please provide API credentials."
        );
      }

      setIsUploading(true);
      setUploadProgress({
        stage: "uploading-metadata",
        progress: 50,
        message: "Uploading metadata to IPFS...",
      });
      setError(null);

      try {
        const response = await pinata.uploadJSON(metadata, {
          name: name || `NFT-Metadata-${Date.now()}`,
        });

        setUploadProgress({
          stage: "complete",
          progress: 100,
          message: "🎉 Metadata uploaded successfully!",
        });

        return response.IpfsHash;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to upload metadata";
        setError(errorMessage);
        setUploadProgress({
          stage: "error",
          progress: 0,
          message: errorMessage,
        });
        throw err;
      } finally {
        setIsUploading(false);
      }
    },
    [initializePinata]
  );

  const uploadNFT = useCallback(
    async (
      imageFile: File,
      metadata: Omit<NFTMetadata, "image">,
      name?: string
    ): Promise<{
      imageHash: string;
      metadataHash: string;
      tokenURI: string;
    }> => {
      if (!initializePinata()) {
        throw new Error(
          "Pinata not configured. Please provide API credentials."
        );
      }

      setIsUploading(true);
      setError(null);

      try {
        setUploadProgress({
          stage: "uploading-image",
          progress: 25,
          message: "Uploading image to IPFS...",
        });

        const imageHash = await uploadImage(imageFile, `${name}-image`);
        const imageUrl = pinata.getGatewayUrl(imageHash);

        setUploadProgress({
          stage: "uploading-metadata",
          progress: 75,
          message: "Uploading metadata to IPFS...",
        });

        const completeMetadata: NFTMetadata = {
          ...metadata,
          image: imageUrl,
        };

        const metadataHash = await uploadMetadata(completeMetadata, `${name}`);
        const tokenURI = pinata.getGatewayUrl(metadataHash);

        setUploadProgress({
          stage: "complete",
          progress: 100,
          message: "🎉 NFT uploaded successfully!",
        });

        return {
          imageHash,
          metadataHash,
          tokenURI,
        };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to upload NFT";
        setError(errorMessage);
        setUploadProgress({
          stage: "error",
          progress: 0,
          message: errorMessage,
        });
        throw err;
      } finally {
        setIsUploading(false);
      }
    },
    [initializePinata, uploadImage, uploadMetadata]
  );

  const getMetadata = useCallback(
    async (ipfsHash: string): Promise<NFTMetadata> => {
      if (!initializePinata()) {
        throw new Error(
          "Pinata not configured. Please provide API credentials."
        );
      }

      try {
        return await pinata.getMetadata(ipfsHash);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch metadata";
        setError(errorMessage);
        throw err;
      }
    },
    [initializePinata]
  );

  const reset = useCallback(() => {
    setIsUploading(false);
    setUploadProgress({
      stage: "idle",
      progress: 0,
      message: "",
    });
    setError(null);
  }, []);

  return {
    uploadImage,
    uploadMetadata,
    uploadNFT,
    getMetadata,
    reset,
    isUploading,
    uploadProgress,
    error,
  };
}
