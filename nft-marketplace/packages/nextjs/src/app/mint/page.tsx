"use client";

import type React from "react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Upload,
  Sparkles,
  ImageIcon,
  FileText,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import Image from "next/image";
import { usePinata } from "@/hooks/usePinata";
import { NftMetadata } from "@/types";
import { useMintRandomNFT } from "@/hooks/useMintRandomNFT";
import { toast } from "sonner";
import { useNftContext } from "@/context/NftContext";
import { formatEther } from "viem";
import { useRouter } from "next/navigation";

export default function MintPage() {
  const router = useRouter();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [customMetadata, setCustomMetadata] = useState({
    name: "",
    description: "",
    attributes: "",
  });

  const { uploadNFT, isUploading, uploadProgress, error, reset } = usePinata();
  const { handleCustomMintNFT, isMinting } = useMintRandomNFT();
  const { mintFee } = useNftContext();

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImageUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const parseAttributes = (attributesString: string) => {
    if (!attributesString.trim()) return [];

    return attributesString
      .split(",")
      .map((attr) => {
        const [trait_type, value] = attr.split(":").map((s) => s.trim());
        return {
          trait_type: trait_type || "Attribute",
          value: value || "Value",
        };
      })
      .filter((attr) => attr.trait_type && attr.value);
  };

  const handleCustomMint = async () => {
    if (!selectedImage || !customMetadata.name || !customMetadata.description) {
      alert("Please fill in all required fields and select an image");
      return;
    }

    reset();

    try {
      const metadata: Omit<NftMetadata, "image"> = {
        name: customMetadata.name,
        description: customMetadata.description,
        attributes: parseAttributes(customMetadata.attributes),
      };

      const result = await uploadNFT(
        selectedImage,
        metadata,
        customMetadata.name
      );

      await handleCustomMintNFT(result.tokenURI);

      router.push("/my-collection");
    } catch (error) {
      toast.error(`Failed to mint custom NFT`);
      throw error;
    }
  };

  const resetForm = () => {
    setSelectedImage(null);
    setSelectedImageUrl(null);
    setCustomMetadata({
      name: "",
      description: "",
      attributes: "",
    });

    reset();
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-gradient-to-br from-slate-900 via-gray-700 to-slate-900">
      <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold text-center bg-gradient-to-r from-purple-400 to-pink-200 bg-clip-text text-transparent mb-5">
            Custom Mint Your NFT
          </h1>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between">
              <div className="flex items-center">
                <Sparkles className="w-5 h-5 mr-2 text-purple-400" />
                Custom NFT Mint
              </div>
            </CardTitle>
            <p className="text-gray-400">
              Upload your own image and create a unique NFT with custom metadata
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Upload Progress */}
            {(isUploading || uploadProgress.stage !== "idle") && (
              <Card className="bg-slate-700/50 border-slate-600">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    {uploadProgress.stage === "complete" ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : uploadProgress.stage === "error" ? (
                      <AlertCircle className="w-5 h-5 text-red-400" />
                    ) : (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-400"></div>
                    )}
                    <span className="text-white font-medium">
                      {uploadProgress.message}
                    </span>
                  </div>
                  <Progress value={uploadProgress.progress} className="h-2" />
                </CardContent>
              </Card>
            )}

            <div className="grid md:grid-cols-2 gap-6">
              {/* Image Upload */}
              <div className="space-y-4">
                <Label className="text-white flex items-center">
                  <ImageIcon className="w-4 h-4 mr-2" />
                  NFT Image *
                </Label>
                <div className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center hover:border-purple-500 transition-colors">
                  {selectedImageUrl ? (
                    <div className="space-y-4">
                      <Image
                        src={selectedImageUrl || "/placeholder.svg"}
                        alt="Selected NFT"
                        width={200}
                        height={200}
                        className="mx-auto rounded-lg max-h-48 object-cover"
                      />
                      <div className="text-sm text-gray-400">
                        {selectedImage?.name}
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedImage(null);
                          setSelectedImageUrl(null);
                        }}
                        className="border-slate-600 text-gray-300"
                      >
                        Change Image
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                      <div>
                        <p className="text-gray-300 mb-2">
                          Upload your NFT image
                        </p>
                        <p className="text-gray-500 text-sm">
                          PNG, JPG, GIF, WebP up to 10MB
                        </p>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="image-upload"
                      />
                      <Label htmlFor="image-upload">
                        <Button
                          variant="outline"
                          className="w-full border-slate-600 text-gray-300"
                          asChild
                        >
                          <span>Choose File</span>
                        </Button>
                      </Label>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label
                    htmlFor="name"
                    className="text-white flex items-center mb-2"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Name *
                  </Label>
                  <Input
                    id="name"
                    placeholder="Enter NFT name"
                    value={customMetadata.name}
                    onChange={(e) =>
                      setCustomMetadata({
                        ...customMetadata,
                        name: e.target.value,
                      })
                    }
                    className="bg-slate-700/50 border-slate-600 text-white"
                  />
                </div>

                <div>
                  <Label
                    htmlFor="description"
                    className="text-white mb-2 block"
                  >
                    Description *
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your NFT"
                    value={customMetadata.description}
                    onChange={(e) =>
                      setCustomMetadata({
                        ...customMetadata,
                        description: e.target.value,
                      })
                    }
                    className="bg-slate-700/50 border-slate-600 text-white min-h-24"
                  />
                </div>

                <div>
                  <Label htmlFor="attributes" className="text-white mb-2 block">
                    Attributes (Optional)
                  </Label>
                  <Textarea
                    id="attributes"
                    placeholder="Background: Blue, Eyes: Laser, Rarity: Epic"
                    value={customMetadata.attributes}
                    onChange={(e) =>
                      setCustomMetadata({
                        ...customMetadata,
                        attributes: e.target.value,
                      })
                    }
                    className="bg-slate-700/50 border-slate-600 text-white"
                  />
                  <p className="text-gray-500 text-sm mt-1">
                    Format: trait_type: value, trait_type: value
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-700/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-white font-semibold">Minting Cost</h3>
                  <p className="text-gray-400 text-sm">
                    Custom NFT with IPFS storage
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-purple-400">
                    {mintFee && formatEther(mintFee)} ETH
                  </p>
                  <p className="text-gray-400 text-sm">+ Gas fees</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleCustomMint}
                  disabled={
                    isMinting ||
                    isUploading ||
                    !selectedImage ||
                    !customMetadata.name ||
                    !customMetadata.description
                  }
                  className="flex-1 btn"
                >
                  {isMinting || isUploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {isUploading ? "Uploading to IPFS..." : "Minting..."}
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Mint Custom NFT
                    </>
                  )}
                </Button>
                {(selectedImage || customMetadata.name) && (
                  <Button
                    onClick={resetForm}
                    variant="outline"
                    className="border-slate-600 text-gray-300"
                  >
                    Reset
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
