"use client";

import type React from "react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  Upload,
  Zap,
  Sparkles,
  ImageIcon,
  FileText,
  CheckCircle,
  AlertCircle,
  Settings,
} from "lucide-react";
import Image from "next/image";
// import { usePinata } from "@/hooks/use-pinata";
// import { PinataConfig } from "@/components/pinata-config";
// import type { NFTMetadata } from "@/lib/pinata";
import { NftMetadata } from "@/types";

const presetNFTs = [
  {
    id: 1,
    name: "Cosmic Warrior",
    image: "/placeholder.svg?height=200&width=200",
    rarity: "Legendary",
  },
  {
    id: 2,
    name: "Digital Phoenix",
    image: "/placeholder.svg?height=200&width=200",
    rarity: "Epic",
  },
  {
    id: 3,
    name: "Neon Dreams",
    image: "/placeholder.svg?height=200&width=200",
    rarity: "Rare",
  },
  {
    id: 4,
    name: "Cyber Samurai",
    image: "/placeholder.svg?height=200&width=200",
    rarity: "Legendary",
  },
  {
    id: 5,
    name: "Quantum Cat",
    image: "/placeholder.svg?height=200&width=200",
    rarity: "Common",
  },
  {
    id: 6,
    name: "Holographic Dragon",
    image: "/placeholder.svg?height=200&width=200",
    rarity: "Mythic",
  },
  {
    id: 7,
    name: "Void Walker",
    image: "/placeholder.svg?height=200&width=200",
    rarity: "Epic",
  },
  {
    id: 8,
    name: "Crystal Guardian",
    image: "/placeholder.svg?height=200&width=200",
    rarity: "Rare",
  },
  {
    id: 9,
    name: "Shadow Assassin",
    image: "/placeholder.svg?height=200&width=200",
    rarity: "Legendary",
  },
  {
    id: 10,
    name: "Light Bringer",
    image: "/placeholder.svg?height=200&width=200",
    rarity: "Mythic",
  },
];

const rarityColors = {
  Common: "bg-gray-500",
  Rare: "bg-blue-500",
  Epic: "bg-purple-500",
  Legendary: "bg-orange-500",
  Mythic: "bg-pink-500",
};

export default function MintPage() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [customMetadata, setCustomMetadata] = useState({
    name: "",
    description: "",
    attributes: "",
    externalUrl: "",
    backgroundColor: "",
  });
  const [isMinting, setIsMinting] = useState(false);
  const [showPinataConfig, setShowPinataConfig] = useState(false);
  const [mintResult, setMintResult] = useState<{
    imageHash?: string;
    metadataHash?: string;
    tokenURI?: string;
  } | null>(null);

  const { uploadNFT, isUploading, uploadProgress, error, isConfigured, reset } =
    usePinata();

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

  const handleRandomMint = async () => {
    setIsMinting(true);
    try {
      // Simulate random minting process
      await new Promise((resolve) => setTimeout(resolve, 3000));
      // Here you would call your smart contract function for random minting
      alert("Random NFT minted successfully!");
    } catch (error) {
      console.error("Random mint failed:", error);
      alert("Failed to mint random NFT");
    } finally {
      setIsMinting(false);
    }
  };

  const handleCustomMint = async () => {
    if (!selectedImage || !customMetadata.name || !customMetadata.description) {
      alert("Please fill in all required fields and select an image");
      return;
    }

    if (!isConfigured) {
      setShowPinataConfig(true);
      return;
    }

    setIsMinting(true);
    setMintResult(null);
    reset();

    try {
      // Prepare metadata
      const metadata: Omit<NftMetadata, "image"> = {
        name: customMetadata.name,
        description: customMetadata.description,
        attributes: parseAttributes(customMetadata.attributes),
        external_url: customMetadata.externalUrl || undefined,
        background_color: customMetadata.backgroundColor || undefined,
      };

      // Upload to IPFS via Pinata
      const result = await uploadNFT(
        selectedImage,
        metadata,
        customMetadata.name
      );

      setMintResult(result);

      // Here you would call your smart contract minting function with the tokenURI
      // Example: await mintNFT(result.tokenURI)

      alert(
        `Custom NFT uploaded to IPFS successfully!\nToken URI: ${result.tokenURI}`
      );
    } catch (error) {
      console.error("Custom mint failed:", error);
      alert(
        `Failed to mint custom NFT: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsMinting(false);
    }
  };

  const resetForm = () => {
    setSelectedImage(null);
    setSelectedImageUrl(null);
    setCustomMetadata({
      name: "",
      description: "",
      attributes: "",
      externalUrl: "",
      backgroundColor: "",
    });
    setMintResult(null);
    reset();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-4">
            Mint Your NFT
          </h1>
          <p className="text-gray-300 text-lg">
            Create unique digital assets and join the NFT revolution
          </p>
        </div>

        {/* Pinata Configuration */}
        {/* {showPinataConfig && (
          <div className="max-w-2xl mx-auto mb-8">
            <PinataConfig
              onConfigured={(configured) => {
                if (configured) {
                  setShowPinataConfig(false);
                }
              }}
            />
          </div>
        )} */}

        <Tabs defaultValue="random" className="max-w-4xl mx-auto">
          <TabsList className="grid w-full grid-cols-2 bg-slate-800/50 border-slate-700">
            <TabsTrigger
              value="random"
              className="data-[state=active]:bg-purple-500"
            >
              <Zap className="w-4 h-4 mr-2" />
              Random Mint
            </TabsTrigger>
            <TabsTrigger
              value="custom"
              className="data-[state=active]:bg-purple-500"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Custom Mint
            </TabsTrigger>
          </TabsList>

          <TabsContent value="random" className="mt-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Zap className="w-5 h-5 mr-2 text-yellow-400" />
                  Random NFT Mint
                </CardTitle>
                <p className="text-gray-400">
                  Mint a random NFT from our collection of 10 unique preset
                  designs
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {presetNFTs.map((nft) => (
                    <div key={nft.id} className="relative group">
                      <Image
                        src={nft.image || "/placeholder.svg"}
                        alt={nft.name}
                        width={200}
                        height={200}
                        className="w-full h-32 object-cover rounded-lg border-2 border-slate-600 group-hover:border-purple-500 transition-colors"
                      />
                      <div className="absolute top-2 left-2">
                        <Badge
                          className={`${
                            rarityColors[
                              nft.rarity as keyof typeof rarityColors
                            ]
                          } text-white text-xs`}
                        >
                          {nft.rarity}
                        </Badge>
                      </div>
                      <p className="text-white text-sm mt-2 text-center truncate">
                        {nft.name}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="bg-slate-700/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-white font-semibold">Minting Cost</h3>
                      <p className="text-gray-400 text-sm">
                        Random selection from preset collection
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-cyan-400">
                        0.1 ETH
                      </p>
                      <p className="text-gray-400 text-sm">+ Gas fees</p>
                    </div>
                  </div>
                  <Button
                    onClick={handleRandomMint}
                    disabled={isMinting}
                    className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                  >
                    {isMinting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Minting...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 mr-2" />
                        Mint Random NFT
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="custom" className="mt-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center justify-between">
                  <div className="flex items-center">
                    <Sparkles className="w-5 h-5 mr-2 text-purple-400" />
                    Custom NFT Mint
                  </div>
                  {!isConfigured && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowPinataConfig(true)}
                      className="border-orange-500 text-orange-400"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Configure IPFS
                    </Button>
                  )}
                </CardTitle>
                <p className="text-gray-400">
                  Upload your own image and create a unique NFT with custom
                  metadata
                </p>

                {!isConfigured && (
                  <Alert className="border-orange-500/50 bg-orange-500/10">
                    <AlertCircle className="w-4 h-4 text-orange-400" />
                    <AlertDescription className="text-orange-200">
                      Pinata IPFS is not configured. Click "Configure IPFS" to
                      set up your credentials.
                    </AlertDescription>
                  </Alert>
                )}
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
                      <Progress
                        value={uploadProgress.progress}
                        className="h-2"
                      />
                    </CardContent>
                  </Card>
                )}

                {/* Error Display */}
                {error && (
                  <Alert className="border-red-500/50 bg-red-500/10">
                    <AlertCircle className="w-4 h-4 text-red-400" />
                    <AlertDescription className="text-red-200">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Success Result */}
                {mintResult && (
                  <Card className="bg-green-500/10 border-green-500/50">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <CheckCircle className="w-5 h-5 text-green-400" />
                        <span className="text-green-400 font-medium">
                          NFT Successfully Uploaded to IPFS!
                        </span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-gray-400">Image Hash: </span>
                          <span className="text-green-300 font-mono">
                            {mintResult.imageHash}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400">Metadata Hash: </span>
                          <span className="text-green-300 font-mono">
                            {mintResult.metadataHash}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400">Token URI: </span>
                          <a
                            href={mintResult.tokenURI}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:underline font-mono break-all"
                          >
                            {mintResult.tokenURI}
                          </a>
                        </div>
                      </div>
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
                            {selectedImage?.name} (
                            {(selectedImage?.size || 0 / 1024 / 1024).toFixed(
                              2
                            )}{" "}
                            MB)
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
                              className="border-slate-600 text-gray-300"
                              asChild
                            >
                              <span>Choose File</span>
                            </Button>
                          </Label>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Metadata Form */}
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
                      <Label
                        htmlFor="attributes"
                        className="text-white mb-2 block"
                      >
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

                    <div>
                      <Label
                        htmlFor="external-url"
                        className="text-white mb-2 block"
                      >
                        External URL (Optional)
                      </Label>
                      <Input
                        id="external-url"
                        placeholder="https://yourwebsite.com"
                        value={customMetadata.externalUrl}
                        onChange={(e) =>
                          setCustomMetadata({
                            ...customMetadata,
                            externalUrl: e.target.value,
                          })
                        }
                        className="bg-slate-700/50 border-slate-600 text-white"
                      />
                    </div>

                    <div>
                      <Label
                        htmlFor="background-color"
                        className="text-white mb-2 block"
                      >
                        Background Color (Optional)
                      </Label>
                      <Input
                        id="background-color"
                        placeholder="#FF0000 or red"
                        value={customMetadata.backgroundColor}
                        onChange={(e) =>
                          setCustomMetadata({
                            ...customMetadata,
                            backgroundColor: e.target.value,
                          })
                        }
                        className="bg-slate-700/50 border-slate-600 text-white"
                      />
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
                        0.2 ETH
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
                      className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
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
                    {(selectedImage || customMetadata.name || mintResult) && (
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
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
