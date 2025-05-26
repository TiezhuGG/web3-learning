"use client";

import React, { useState, useEffect } from "react";
import {
  useAccount,
  useReadContract,
  useSimulateContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useWatchContractEvent,
} from "wagmi";
import { parseEther, formatEther } from "viem";
import { publicClient } from "@/lib/wagmi";
import { ethers } from "ethers"; // 用于获取 NFT 所有者和批准状态
import {
  NFT_MARKETPLACE_CONTRACT_ADDRESS,
  NFT_MARKETPLACE_NFT_ABI,
  RANDOM_IPFS_NFT_ABI,
  RANDOM_IPFS_NFT_CONTRACT_ADDRESS,
} from "@/constants";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/spinner";

interface Listing {
  price: bigint;
  seller: `0x${string}`;
}

interface NftMetadata {
  name: string;
  description: string;
  image: string;
  attributes: { trait_type: string; value: number | string }[];
}

interface MarketplaceItem {
  nftAddress: `0x${string}`;
  tokenId: bigint;
  price: bigint;
  seller: `0x${string}`;
  metadata: NftMetadata | null;
  loadingMetadata: boolean;
}

export function NftMarketplace() {
  const { address: accountAddress } = useAccount();
  const [marketplaceItems, setMarketplaceItems] = useState<MarketplaceItem[]>(
    []
  );
  const [isLoadingMarketplace, setIsLoadingMarketplace] = useState(false);
  const [listItemId, setListItemId] = useState<string>("");
  const [listPrice, setListPrice] = useState<string>("");
  const [updateItemId, setUpdateItemId] = useState<string>("");
  const [updatePrice, setUpdatePrice] = useState<string>("");
  const [cancelItemId, setCancelItemId] = useState<string>("");
  const [buyItemId, setBuyItemId] = useState<string>("");
  const [lastTxMessage, setLastTxMessage] = useState<string>("");
  const [isError, setIsError] = useState<boolean>(false);

  // --- 读取合约数据 ---
  const { data: proceedsData, refetch: refetchProceeds } = useReadContract({
    address: NFT_MARKETPLACE_CONTRACT_ADDRESS,
    abi: NFT_MARKETPLACE_NFT_ABI,
    functionName: "getProceeds",
    args: [accountAddress || "0x"],
    query: {
      enabled: !!accountAddress && !!NFT_MARKETPLACE_CONTRACT_ADDRESS,
    },
  });
  const proceeds = (proceedsData as bigint) || 0n;

  // --- 获取所有在售 NFT ---
  const fetchMarketplaceItems = async () => {
    if (!NFT_MARKETPLACE_CONTRACT_ADDRESS || !RANDOM_IPFS_NFT_CONTRACT_ADDRESS)
      return;

    // setIsLoadingMarketplace(true);
    const items: MarketplaceItem[] = [];
    const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545"); // Hardhat 节点
    const nftContract = new ethers.Contract(
      RANDOM_IPFS_NFT_CONTRACT_ADDRESS,
      RANDOM_IPFS_NFT_ABI,
      provider
    );
    const marketplaceContract = new ethers.Contract(
      NFT_MARKETPLACE_CONTRACT_ADDRESS,
      NFT_MARKETPLACE_NFT_ABI,
      provider
    );

    // 获取 RandomIpfsNft 的总数，然后遍历检查是否在市场中
    const tokenCounter = await nftContract.getTokenCounter();

    const fetchPromises = [];
    for (let i = 0n; i < tokenCounter; i++) {
      fetchPromises.push(async () => {
        try {
          const listing: Listing = await marketplaceContract.getListing(
            RANDOM_IPFS_NFT_CONTRACT_ADDRESS,
            i
          );
          if (listing.price > 0) {
            let metadata: NftMetadata | null = null;
            let loadingMetadata = true;
            try {
              const tokenUri = await nftContract.tokenURI(i);
              const ipfsHash = tokenUri.replace("ipfs://", "");
              const response = await fetch(`https://ipfs.io/ipfs/${ipfsHash}`);
              if (!response.ok) throw new Error("Failed to fetch metadata");
              metadata = await response.json();
            } catch (e) {
              console.error(`Failed to fetch metadata for token ${i}:`, e);
            } finally {
              loadingMetadata = false;
            }
            return {
              nftAddress: RANDOM_IPFS_NFT_CONTRACT_ADDRESS,
              tokenId: i,
              price: listing.price,
              seller: listing.seller,
              metadata,
              loadingMetadata,
            };
          }
        } catch (e) {
          // console.warn(`Error getting listing for token ${i}:`, e);
        }
        return null;
      });
    }
    const results = await Promise.all(fetchPromises.map((p) => p()));
    setMarketplaceItems(
      results.filter((item) => item !== null) as MarketplaceItem[]
    );
    // setMarketplaceItems(items);
    setIsLoadingMarketplace(false);
  };

  useEffect(() => {
    fetchMarketplaceItems();
  }, [
    accountAddress,
    NFT_MARKETPLACE_CONTRACT_ADDRESS,
    RANDOM_IPFS_NFT_CONTRACT_ADDRESS,
  ]);

  // --- 事件监听 (刷新列表和收益) ---
  useWatchContractEvent({
    address: NFT_MARKETPLACE_CONTRACT_ADDRESS,
    abi: NFT_MARKETPLACE_NFT_ABI,
    eventName: "ItemListed",
    onLogs: () => {
      fetchMarketplaceItems();
    },
  });
  useWatchContractEvent({
    address: NFT_MARKETPLACE_CONTRACT_ADDRESS,
    abi: NFT_MARKETPLACE_NFT_ABI,
    eventName: "ItemCanceled",
    onLogs: () => {
      fetchMarketplaceItems();
    },
  });
  useWatchContractEvent({
    address: NFT_MARKETPLACE_CONTRACT_ADDRESS,
    abi: NFT_MARKETPLACE_NFT_ABI,
    eventName: "ItemBought",
    onLogs: () => {
      fetchMarketplaceItems();
      refetchProceeds();
    },
  });

  // --- 列出 NFT ---
  const {
    data: approveData,
    writeContract: writeApprove,
    isPending: isApprovingTx,
  } = useWriteContract();
  const { isLoading: isApproving, isSuccess: isApproved } =
    useWaitForTransactionReceipt({ hash: approveData });

  const { data: listItemSimulateData, error: listItemSimulateError } =
    useSimulateContract({
      address: NFT_MARKETPLACE_CONTRACT_ADDRESS,
      abi: NFT_MARKETPLACE_NFT_ABI,
      functionName: "listItem",
      args: [
        RANDOM_IPFS_NFT_CONTRACT_ADDRESS,
        BigInt(listItemId || 0),
        parseEther(listPrice || "0"),
      ],
      account: accountAddress,
      query: {
        enabled: !!listItemId && !!listPrice && parseFloat(listPrice) > 0,
      },
    });
  const {
    data: listItemHash,
    writeContract: writeListItem,
    isPending: isListingItem,
  } = useWriteContract();
  const { isLoading: isListItemConfirming, isSuccess: isListItemConfirmed } =
    useWaitForTransactionReceipt({ hash: listItemHash });

  const handleListItem = async () => {
    setLastTxMessage("");
    setIsError(false);
    if (
      !accountAddress ||
      !listItemId ||
      !listPrice ||
      parseFloat(listPrice) <= 0
    ) {
      setIsError(true);
      setLastTxMessage("Please enter a valid Token ID and Price.");
      return;
    }
    const tokenIdBigInt = BigInt(listItemId);

    try {
      // 1. 检查是否已批准 Marketplace
      const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
      const nftContract = new ethers.Contract(
        RANDOM_IPFS_NFT_CONTRACT_ADDRESS,
        RANDOM_IPFS_NFT_ABI,
        provider
      );
      const approvedAddress = await nftContract.getApproved(tokenIdBigInt);

      if (
        approvedAddress.toLowerCase() !==
        NFT_MARKETPLACE_CONTRACT_ADDRESS.toLowerCase()
      ) {
        console.log("Approving marketplace...");
        const { request } = await publicClient.simulateContract({
          // 使用 simulateContract 而不是 useSimulateContract 避免复杂 hook 链
          account: accountAddress,
          address: RANDOM_IPFS_NFT_CONTRACT_ADDRESS,
          abi: RANDOM_IPFS_NFT_ABI,
          functionName: "approve",
          args: [NFT_MARKETPLACE_CONTRACT_ADDRESS, tokenIdBigInt],
        });
        await writeApprove(request);
      } else {
        setLastTxMessage("Marketplace already approved. Listing item...");
        if (writeListItem && listItemSimulateData?.request) {
          writeListItem(listItemSimulateData.request);
        } else {
          setIsError(true);
          setLastTxMessage(
            listItemSimulateError?.message || "Simulation for listing failed."
          );
        }
      }
    } catch (error) {
      setIsError(true);
      setLastTxMessage(
        `Error during approval or pre-listing check: ${
          error || "Unknown error"
        }`
      );
      console.error(error);
    }
  };

  useEffect(() => {
    // 批准成功后自动列出
    if (isApproved && listItemSimulateData?.request && writeListItem) {
      console.log("Approval successful. Listing item...");
      setLastTxMessage("Approval successful. Listing item...");
      writeListItem(listItemSimulateData.request);
    } else if (isApproved && !listItemSimulateData?.request) {
      // This can happen if listItemSimulateData is not ready immediately after approve success
      // Potentially re-trigger simulation or provide specific feedback.
      // For now, let the user retry listing or wait for effects to propagate.
      setLastTxMessage(
        "Approval successful, but listing transaction not ready. Please try again or refresh."
      );
      setIsError(true);
    }
  }, [isApproved, listItemSimulateData, writeListItem]);

  // --- 取消列表 ---
  const { data: cancelItemSimulateData } = useSimulateContract({
    address: NFT_MARKETPLACE_CONTRACT_ADDRESS,
    abi: NFT_MARKETPLACE_NFT_ABI,
    functionName: "cancelListing",
    args: [RANDOM_IPFS_NFT_CONTRACT_ADDRESS, BigInt(cancelItemId || 0)],
    account: accountAddress,
    query: { enabled: !!cancelItemId },
  });
  const {
    data: cancelItemHash,
    writeContract: writeCancelItem,
    isPending: isCancellingItem,
  } = useWriteContract();
  const {
    isLoading: isCancelItemConfirming,
    isSuccess: isCancelItemConfirmed,
  } = useWaitForTransactionReceipt({ hash: cancelItemHash });

  const handleCancelItem = async () => {
    if (writeCancelItem && cancelItemSimulateData?.request) {
      await writeCancelItem(cancelItemSimulateData.request);
    }
  };

  // --- 购买物品 ---
  const selectedItemForBuy = marketplaceItems.find(
    (item) => item.tokenId.toString() === buyItemId
  );

  const { data: buyItemSimulateData, error: buyItemSimulateError } =
    useSimulateContract({
      address: NFT_MARKETPLACE_CONTRACT_ADDRESS,
      abi: NFT_MARKETPLACE_NFT_ABI,
      functionName: "buyItem",
      args: [RANDOM_IPFS_NFT_CONTRACT_ADDRESS, BigInt(buyItemId || 0)],
      value: selectedItemForBuy?.price || parseEther("0"), // 确保发送正确的 ETH 金额
      account: accountAddress,
      query: {
        enabled: !!buyItemId && !!selectedItemForBuy && !!accountAddress,
      },
    });
  const {
    data: buyItemHash,
    writeContract: writeBuyItem,
    isPending: isBuyingItem,
  } = useWriteContract();
  const { isLoading: isBuyItemConfirming, isSuccess: isBuyItemConfirmed } =
    useWaitForTransactionReceipt({ hash: buyItemHash });

  const handleBuyItem = async () => {
    if (writeBuyItem && buyItemSimulateData?.request) {
      await writeBuyItem(buyItemSimulateData.request);
    }
  };

  // --- 更新列表 ---
  const { data: updateItemSimulateData } = useSimulateContract({
    address: NFT_MARKETPLACE_CONTRACT_ADDRESS,
    abi: NFT_MARKETPLACE_NFT_ABI,
    functionName: "updateListing",
    args: [
      RANDOM_IPFS_NFT_CONTRACT_ADDRESS,
      BigInt(updateItemId || 0),
      parseEther(updatePrice || "0"),
    ],
    account: accountAddress,
    query: {
      enabled: !!updateItemId && !!updatePrice && parseFloat(updatePrice) > 0,
    },
  });
  const {
    data: updateItemHash,
    writeContract: writeUpdateItem,
    isPending: isUpdatingItem,
  } = useWriteContract();
  const {
    isLoading: isUpdateItemConfirming,
    isSuccess: isUpdateItemConfirmed,
  } = useWaitForTransactionReceipt({ hash: updateItemHash });

  const handleUpdateItem = async () => {
    if (writeUpdateItem && updateItemSimulateData?.request) {
      await writeUpdateItem(updateItemSimulateData.request);
    }
  };

  // --- 提取收益 ---
  const { data: withdrawSimulateData } = useSimulateContract({
    address: NFT_MARKETPLACE_CONTRACT_ADDRESS,
    abi: NFT_MARKETPLACE_NFT_ABI,
    functionName: "withdrawProceeds",
    account: accountAddress,
    query: {
      enabled: proceeds > 0n && !!accountAddress,
    },
  });
  const {
    data: withdrawHash,
    writeContract: writeWithdraw,
    isPending: isWithdrawing,
  } = useWriteContract();
  const { isLoading: isWithdrawConfirming, isSuccess: isWithdrawConfirmed } =
    useWaitForTransactionReceipt({ hash: withdrawHash });

  const handleWithdrawProceeds = async () => {
    if (writeWithdraw && withdrawSimulateData?.request) {
      await writeWithdraw(withdrawSimulateData.request);
    }
  };

  return (
    <div className="p-6 bg-card-bg rounded-lg shadow-md border border-gray-700">
      {/* Proceeds Section */}
      <div className="mb-8 p-4 bg-gray-800 rounded-lg shadow-inner">
        <h3 className="text-xl font-semibold text-white mb-2">Your Proceeds</h3>
        <p className="text-white text-lg text-accent-green mb-4">
          Available: {formatEther(proceeds)} ETH
        </p>
        <Button
          onClick={handleWithdrawProceeds}
          disabled={
            !writeWithdraw ||
            proceeds <= 0n ||
            isWithdrawing ||
            isWithdrawConfirming
          }
          className="bg-accent-green hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isWithdrawing
            ? "Withdrawing..."
            : isWithdrawConfirming
            ? "Confirming..."
            : "Withdraw Proceeds"}
          {(isWithdrawing || isWithdrawConfirming) && <LoadingSpinner />}
        </Button>
      </div>

      {lastTxMessage && (
        <div
          className={`p-3 mb-4 rounded-md ${
            isError ? "bg-red-800 text-red-100" : "bg-blue-800 text-blue-100"
          }`}
        >
          {lastTxMessage}
        </div>
      )}

      {/* Listing/Updating/Cancelling Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* List NFT */}
        <div className="bg-gray-800 p-5 rounded-lg shadow-inner border border-gray-700">
          <h4 className="text-lg font-semibold text-white mb-4">
            List Your NFT
          </h4>
          <input
            type="number"
            placeholder="Token ID"
            value={listItemId}
            onChange={(e) => setListItemId(e.target.value)}
            className="w-full p-2 mb-3 bg-gray-800 border border-gray-600 rounded text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-blue"
          />
          <input
            type="number"
            step="0.01"
            placeholder="Price (ETH)"
            value={listPrice}
            onChange={(e) => setListPrice(e.target.value)}
            className="w-full p-2 mb-4 bg-gray-800 border border-gray-600 rounded text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-blue"
          />
          <Button
            onClick={handleListItem}
            disabled={
              !listItemId ||
              !listPrice ||
              parseFloat(listPrice) <= 0 ||
              isApprovingTx ||
              isApproving ||
              isListingItem ||
              isListItemConfirming
            }
            className="w-full text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isApprovingTx ||
            isApproving ||
            isListingItem ||
            isListItemConfirming
              ? "Processing..."
              : "List Item"}
            {(isApprovingTx ||
              isApproving ||
              isListingItem ||
              isListItemConfirming) && <LoadingSpinner />}
          </Button>
        </div>

        {/* Update Listing */}
        <div className="bg-gray-800 p-5 rounded-lg shadow-inner border border-gray-700">
          <h4 className="text-lg font-semibold text-white mb-4">
            Update Listed NFT
          </h4>
          <input
            type="number"
            placeholder="Token ID"
            value={updateItemId}
            onChange={(e) => setUpdateItemId(e.target.value)}
            className="w-full p-2 mb-3 bg-gray-800 border border-gray-600 rounded text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-blue"
          />
          <input
            type="number"
            step="0.01"
            placeholder="New Price (ETH)"
            value={updatePrice}
            onChange={(e) => setUpdatePrice(e.target.value)}
            className="w-full p-2 mb-4 bg-gray-800 border border-gray-600 rounded text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-blue"
          />
          <Button
            onClick={handleUpdateItem}
            disabled={
              !updateItemId ||
              !updatePrice ||
              parseFloat(updatePrice) <= 0 ||
              isUpdatingItem ||
              isUpdateItemConfirming
            }
            className="w-full text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isUpdatingItem
              ? "Updating..."
              : isUpdateItemConfirming
              ? "Confirming..."
              : "Update Item"}
            {(isUpdatingItem || isUpdateItemConfirming) && <LoadingSpinner />}
          </Button>
        </div>

        {/* Cancel Listing */}
        <div className="bg-gray-800 p-5 rounded-lg shadow-inner border border-gray-700">
          <h4 className="text-lg font-semibold text-white mb-4">
            Cancel Listed NFT
          </h4>
          <input
            type="number"
            placeholder="Token ID"
            value={cancelItemId}
            onChange={(e) => setCancelItemId(e.target.value)}
            className="w-full p-2 mb-4 bg-gray-800 border border-gray-600 rounded text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-blue"
          />
          <Button
            onClick={handleCancelItem}
            disabled={
              !cancelItemId || isCancellingItem || isCancelItemConfirming
            }
            className="w-full text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isCancellingItem
              ? "Cancelling..."
              : isCancelItemConfirming
              ? "Confirming..."
              : "Cancel Item"}
            {(isCancellingItem || isCancelItemConfirming) && <LoadingSpinner />}
          </Button>
        </div>
      </div>

      {/* Items for Sale Section */}
      <h2 className="text-2xl font-semibold text-white mb-6">Items for Sale</h2>
      {isLoadingMarketplace ? (
        <p className="text-center text-gray-400">
          Loading marketplace items...
        </p>
      ) : marketplaceItems.length === 0 ? (
        <p className="text-center text-gray-400">No NFTs listed for sale.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {marketplaceItems.map((item) => (
            <div
              key={`${item.nftAddress}-${item.tokenId.toString()}`}
              className="bg-gray-800 rounded-lg shadow-xl overflow-hidden border border-gray-700 transform transition duration-300 hover:scale-105"
            >
              <img
                src={
                  item.metadata?.image
                    ? item.metadata.image.replace(
                        "ipfs://",
                        "https://ipfs.io/ipfs/"
                      )
                    : "/placeholder-nft.png"
                }
                alt={item.metadata?.name || `NFT #${item.tokenId.toString()}`}
                className="w-full object-cover border-b border-gray-700"
              />
              <div className="p-4">
                <h3 className="text-lg font-semibold text-white mb-1">
                  {item.metadata?.name || `NFT #${item.tokenId.toString()}`}
                </h3>
                <p className="text-gray-400 text-sm mb-2 line-clamp-2">
                  {item.metadata?.description || "No description available."}
                </p>
                <p className="text-gray-300 text-sm">
                  Seller:{" "}
                  <span className="font-mono">
                    {item.seller.slice(0, 6)}...{item.seller.slice(-4)}
                  </span>
                </p>
                <p className="text-lg font-bold text-accent-green mt-2">
                  Price: {formatEther(item.price)} ETH
                </p>
                {item.loadingMetadata && (
                  <p className="text-blue-400 text-xs mt-2">
                    Loading metadata...
                  </p>
                )}
                {item.seller.toLowerCase() !== accountAddress?.toLowerCase() ? (
                  <Button
                    onClick={() => handleBuyItem(item.tokenId, item.price)}
                    disabled={
                      (isBuyingItem && item.tokenId.toString() === buyItemId) ||
                      (isBuyItemConfirming &&
                        item.tokenId.toString() === buyItemId)
                    }
                    className="mt-4 w-full bg-accent-green hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {isBuyingItem && item.tokenId.toString() === buyItemId
                      ? "Buying..."
                      : isBuyItemConfirming &&
                        item.tokenId.toString() === buyItemId
                      ? "Confirming..."
                      : "Buy Now"}
                    {((isBuyingItem && item.tokenId.toString() === buyItemId) ||
                      (isBuyItemConfirming &&
                        item.tokenId.toString() === buyItemId)) && (
                      <LoadingSpinner />
                    )}
                  </Button>
                ) : (
                  <p className="mt-4 text-center text-gray-500 text-sm">
                    Owned by you
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
