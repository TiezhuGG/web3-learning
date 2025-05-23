"use client";

import { useState, useEffect } from "react";
import {
  useReadContract,
  useSimulateContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useWatchContractEvent,
  type UseReadContractParameters,
} from "wagmi";
import {
  MOCK_VRF_ABI,
  MOCK_VRF_CONTRACT_ADDRESS,
  RANDOM_IPFS_NFT_ABI,
  RANDOM_IPFS_NFT_CONTRACT_ADDRESS,
} from "@/constants";
import { decodeEventLog, formatEther, parseEther } from "viem";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/hooks/useWallet";
import { useMintRandomNFT } from "@/hooks/useMintRandomNFT";

const randomContractConfig: UseReadContractParameters = {
  address: RANDOM_IPFS_NFT_CONTRACT_ADDRESS,
  abi: RANDOM_IPFS_NFT_ABI,
};

export function NftMinting() {
  const { address: accountAddress } = useWallet();
  const { mintFee, chainId } = useMintRandomNFT();
  const [requestId, setRequestId] = useState<bigint | null>(null);
  const [mintedTokenId, setMintedTokenId] = useState<bigint | null>(null);
  const [loadingMessage, setLoadingMessage] = useState<string>("");

  // 1. 读取 mintFee
  // 2. 模拟 requestNft 交易
  const { data: simulateRequestNftData, error: simulateRequestNftError } =
    useSimulateContract({
      address: RANDOM_IPFS_NFT_CONTRACT_ADDRESS,
      abi: RANDOM_IPFS_NFT_ABI,
      functionName: "requestNft",
      value: mintFee ?? parseEther("0.01"),
      account: accountAddress,
    });

  // 3. 写入 requestNft 交易
  const {
    data: requestNftHash,
    writeContract: writeRequestNft,
    isPending: isRequestingNft,
    error: writeRequestNftError,
  } = useWriteContract();

  // 4. 等待 requestNft 交易完成
  const {
    isLoading: isRequestNftConfirming,
    isSuccess: isRequestNftConfirmed,
  } = useWaitForTransactionReceipt({
    hash: requestNftHash,
  });

  // 5. 监听 NFTRequested 事件 (从 RandomIpfsNft 合约)
  useWatchContractEvent({
    ...randomContractConfig,
    eventName: "NFTRequested",
    onLogs: (logs) => {
      console.log("NFTRequested logs:", logs);
      if (logs.length > 0) {
        const log = logs[0];
        // 假设日志被正确解析
        const parsedLog = RANDOM_IPFS_NFT_ABI.filter(
          (item) => item.type === "event" && item.name === "NFTRequested"
        )[0];
        if (parsedLog) {
          const decodedArgs = decodeEventLog({
            abi: RANDOM_IPFS_NFT_ABI,
            eventName: "NFTRequested",
            data: log.data,
            topics: log.topics,
          });
          const reqId = decodedArgs.args.requestId as bigint;
          setRequestId(reqId);
          setLoadingMessage(
            `NFT Request ID: ${reqId}. Waiting for Chainlink VRF fulfillment...`
          );
          console.log("Decoded NFTRequested event args:", decodedArgs.args);
        }
      }
    },
    onError: (error) => {
      console.error("Error watching NFTRequested event:", error);
    },
  });

  // 6. 手动调用 fulfillRandomWords (仅在本地开发网)
  const { data: simulateFulfillData } = useSimulateContract({
    address: MOCK_VRF_CONTRACT_ADDRESS,
    abi: MOCK_VRF_ABI,
    functionName: "fulfillRandomWords",
    args: [requestId || 0n, RANDOM_IPFS_NFT_CONTRACT_ADDRESS], // 确保 requestId 非空
    account: accountAddress,
    query: {
      enabled: requestId !== null && chainId === 31337, // 只有在本地链且有 requestId 时才启用
    },
  });

  const {
    data: fulfillHash,
    writeContract: writeFulfill,
    isPending: isFulfilling,
  } = useWriteContract();

  const { isLoading: isFulfillConfirming, isSuccess: isFulfillConfirmed } =
    useWaitForTransactionReceipt({
      hash: fulfillHash,
    });

  const handleMint = async () => {
    if (!writeRequestNft || !simulateRequestNftData?.request) return;
    setLoadingMessage("Requesting NFT...");

    try {
      await writeRequestNft(simulateRequestNftData.request);
    } catch (e) {
      console.error("Failed to request NFT:", e);
      setLoadingMessage("Error requesting NFT.");
    }
  };

  useEffect(() => {
    console.log('我操，被监听到了，', isRequestNftConfirmed, requestId)
    // 只有在请求被确认且是本地链时才尝试 fulfill
    if (isRequestNftConfirmed && requestId !== null && chainId === 31337) {
      setLoadingMessage("Request confirmed. Fulfilling randomness on mock...");
      if (writeFulfill && simulateFulfillData?.request) {
        writeFulfill(simulateFulfillData.request);
      }
    }
  }, [isRequestNftConfirmed, requestId, simulateFulfillData, writeFulfill]);

  useEffect(() => {
    // 当 fulfill 交易确认后，清除加载信息，等待 NFTMinted 事件
    if (isFulfillConfirmed) {
      setLoadingMessage(
        "Randomness fulfilled. Waiting for NFT to be minted..."
      );
    }
  }, [isFulfillConfirmed]);

  const buttonText = isRequestingNft
    ? "Requesting..."
    : isRequestNftConfirming
    ? "Confirming Request..."
    : isFulfilling
    ? "Fulfilling..."
    : isFulfillConfirming
    ? "Confirming Fulfillment..."
    : "Mint Random NFT";

  const LoadingSpinner = () => (
    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white inline-block ml-2"></div>
  );

  return (
    <div className="p-6 bg-card-bg rounded-lg shadow-md border border-gray-700">
      <div className="flex items-center mb-4">
        <p className="text-lg font-medium text-gray-300">
          Mint Fee: {formatEther(mintFee!)} ETH
        </p>
      </div>

      <Button
        onClick={handleMint}
        disabled={
          !writeRequestNft ||
          isRequestingNft ||
          isRequestNftConfirming ||
          isFulfilling ||
          isFulfillConfirming
        }
        className=" text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
      >
        {buttonText}{" "}
        {(isRequestingNft ||
          isRequestNftConfirming ||
          isFulfilling ||
          isFulfillConfirming) && <LoadingSpinner />}
      </Button>

      {loadingMessage && (
        <div className="mt-4 text-sm text-blue-300 flex items-center">
          {loadingMessage}
          <LoadingSpinner />
        </div>
      )}
      {/* {errorStatus && (
        <p className="mt-4 text-sm text-accent-red break-words">
          Error: {errorStatus}
        </p>
      )} */}
      {simulateRequestNftError && (
        <p className="mt-4 text-sm text-accent-red break-words">
          Simulation Error: {simulateRequestNftError.message}
        </p>
      )}

      {mintedTokenId !== null && (
        <p className="mt-4 text-sm text-accent-green">
          🎉 Successfully Minted NFT with Token ID: {mintedTokenId}!
        </p>
      )}
    </div>
  );
}
