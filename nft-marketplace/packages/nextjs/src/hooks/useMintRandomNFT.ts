import {
  RANDOM_IPFS_NFT_ABI,
  RANDOM_IPFS_NFT_CONTRACT_ADDRESS,
  MOCK_VRF_ABI,
  MOCK_VRF_CONTRACT_ADDRESS,
} from "@/constants";
import { useCallback, useState } from "react";
import {
  useAccount,
  useWriteContract,
  useReadContract,
  usePublicClient,
  useWatchContractEvent,
  type UseReadContractParameters,
} from "wagmi";
import { decodeEventLog } from "viem";

const CONTRACT_ADDRESS = RANDOM_IPFS_NFT_CONTRACT_ADDRESS;
const CONTRACT_ABI = RANDOM_IPFS_NFT_ABI;

const randomContractConfig: UseReadContractParameters = {
  address: CONTRACT_ADDRESS,
  abi: CONTRACT_ABI,
};

interface NFTRequestedEvent {
  eventName: "NFTRequested";
  args: {
    requestId: bigint;
    requester: string;
  };
}

export function useMintRandomNFT() {
  const { address, chainId } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  const [lastMintedTokenId, setLastMintedTokenId] = useState<bigint | null>(
    null
  );
  const [isMinting, setIsMinting] = useState(false);

  const { data: mintFeeData } = useReadContract({
    ...randomContractConfig,
    functionName: "getMintFee",
  });

  const mintFee = mintFeeData as bigint | undefined;

  const { data: tokenCounter, refetch: refetchTokenCounter } = useReadContract({
    ...randomContractConfig,
    functionName: "getTokenCounter",
  });

  const { data: subscriptionId } = useReadContract({
    ...randomContractConfig,
    functionName: "s_subscriptionId",
  });

  const { data: tokenUris } = useReadContract({
    ...randomContractConfig,
    functionName: "getTokenURIs",
    args: [lastMintedTokenId ?? 0n],
    query: {
      enabled: lastMintedTokenId !== null,
    },
  });

  const { data: balance } = useReadContract({
    ...randomContractConfig,
    functionName: "balanceOf",
    args: [address!],
    query: {
      enabled: !!address,
    },
  });

  // 监听 NFTMinted 事件
  useWatchContractEvent({
    ...randomContractConfig,
    eventName: "NFTMinted",
    onLogs(log) {
      console.log("----------NFT Minted Event:", log);
      // 刷新 tokenCounter
      refetchTokenCounter();
      setIsMinting(false);
    },
  });

  // console.log("Contract state:", {
  //   address,
  //   chainId,
  //   tokenCounter,
  //   tokenUris,
  //   balance,
  //   mintFee,
  //   CONTRACT_ADDRESS,
  //   MOCK_VRF_CONTRACT_ADDRESS,
  //   lastMintedTokenId,
  //   isMinting,
  // });

  const mintNFT = useCallback(async () => {
    if (!address) throw new Error("No wallet connected");
    if (!publicClient) throw new Error("Public client not available");
    if (!mintFee) throw new Error("Mint fee not available yet");
    if (isMinting) throw new Error("Minting in progress");

    try {
      setIsMinting(true);
      console.log("Attempting to mint NFT:", {
        fee: mintFee.toString(),
        address,
        chainId,
        contractAddress: CONTRACT_ADDRESS,
      });

      // 检查用户余额
      const balance = await publicClient.getBalance({ address });
      console.log("User balance:", balance.toString());

      if (balance < mintFee) {
        throw new Error(
          `Insufficient balance. You need at least ${mintFee.toString()} wei`
        );
      }

      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "requestNft",
        value: mintFee,
      });

      console.log("Mint request sent, transaction hash:", hash);

      // 等待交易被确认
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      console.log("Transaction confirmed:", receipt);

      // 从事件日志中获取 requestId
      const nftRequestedLog = receipt.logs.find((log) => {
        try {
          const event = decodeEventLog({
            abi: CONTRACT_ABI,
            data: log.data,
            topics: log.topics,
          });
          return event.eventName === "NFTRequested";
        } catch {
          return false;
        }
      });

      if (!nftRequestedLog) {
        throw new Error("NFTRequested event not found in transaction logs");
      }

      const decodedLog = decodeEventLog({
        abi: CONTRACT_ABI,
        data: nftRequestedLog.data,
        topics: nftRequestedLog.topics,
      }) as unknown as NFTRequestedEvent;

      const requestId = decodedLog.args.requestId;
      console.log("RequestId:", requestId);

      // 检查订阅 ID
      if (!subscriptionId) {
        throw new Error("Subscription ID not available");
      }
      console.log("Using subscription ID:", subscriptionId);

      // 调用 VRF Coordinator Mock 的 fulfillRandomWords
      const fulfillHash = await writeContractAsync({
        address: MOCK_VRF_CONTRACT_ADDRESS,
        abi: MOCK_VRF_ABI,
        functionName: "fulfillRandomWords",
        args: [requestId, CONTRACT_ADDRESS],
      });

      console.log("Fulfill random words transaction hash:", fulfillHash);

      // 等待 fulfillRandomWords 交易被确认
      const fulfillReceipt = await publicClient.waitForTransactionReceipt({
        hash: fulfillHash,
      });
      console.log(
        "Fulfill random words transaction confirmed:",
        fulfillReceipt
      );

      // 等待并检查铸造结果
      const oldTokenCounter = tokenCounter ? tokenCounter : BigInt(0);
      let attempts = 0;
      const maxAttempts = 10;

      while (attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 1000)); // 等待1秒
        await refetchTokenCounter();
        const newTokenCounter = tokenCounter;

        if (newTokenCounter && newTokenCounter > oldTokenCounter) {
          console.log(
            "NFT successfully minted! New token counter:",
            newTokenCounter
          );
          const newTokenId =
            typeof newTokenCounter === "bigint"
              ? newTokenCounter - BigInt(1)
              : null;
          setLastMintedTokenId(newTokenId);
          break;
        }

        attempts++;
      }

      if (attempts === maxAttempts) {
        console.warn("Token counter did not increase after minting");
      }

      setIsMinting(false);
      return hash;
    } catch (error: any) {
      console.error("Mint error:", error);
      setIsMinting(false);
      if (error.message.includes("Internal JSON-RPC error")) {
        throw new Error(
          "Failed to mint: Make sure you have enough ETH to cover the mint fee"
        );
      }
      throw error;
    }
  }, [
    address,
    writeContractAsync,
    mintFee,
    chainId,
    publicClient,
    isMinting,
    tokenCounter,
    refetchTokenCounter,
  ]);

  const approveMarketplace = useCallback(
    async (tokenId: bigint, marketplaceAddress: string) => {
      if (!address) throw new Error("No wallet connected");

      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "approve",
        args: [marketplaceAddress, tokenId],
      });

      return hash;
    },
    [address, writeContractAsync]
  );

  return {
    chainId,
    mintFee,
    tokenCounter,
    balance,
    mintNFT,
    approveMarketplace,
    isMinting,
    lastMintedTokenId,
    tokenUris,
  };
}
