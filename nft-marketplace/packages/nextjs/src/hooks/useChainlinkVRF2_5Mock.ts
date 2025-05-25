import { decodeEventLog } from "viem";
import {
  MOCK_VRF_ABI,
  MOCK_VRF_CONTRACT_ADDRESS,
  RANDOM_IPFS_NFT_ABI,
  RANDOM_IPFS_NFT_CONTRACT_ADDRESS,
} from "@/constants";
import { usePublicClient, useWriteContract } from "wagmi";
import { useWallet } from "./useWallet";
import { BigintType, NFTRequestedEvent } from "@/types";
import { useCallback } from "react";

/**
 * 模拟使用Chainlink VRF2.5
 * 需要主动获取并传递 requestId 到 Mock合约的 fulfillRandomWords 函数中
 */
export function useChainlinkVRF2_5Mock({ mintFee }: { mintFee: BigintType }) {
  const { address } = useWallet();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();

  // requestNft函数明确返回了requestId，可以使用useSimulateContract模拟获取
  const getRequestIdBySimulate = useCallback(async () => {
    const requestNftData = await publicClient?.simulateContract({
      address: RANDOM_IPFS_NFT_CONTRACT_ADDRESS,
      abi: RANDOM_IPFS_NFT_ABI,
      functionName: "requestNft",
      account: address,
      value: mintFee,
    });

    // 需要调用requestNft检查是否需要授权
    await writeContractAsync(requestNftData?.request!);
    return requestNftData?.result;
  }, [mintFee, address, publicClient]);

  // 如果没有返回requestId则需解码事件日志
  // const getRequestIdByDecodeLog = useCallback(async () => {
  //   const hash = await writeContractAsync({
  //     address: RANDOM_IPFS_NFT_CONTRACT_ADDRESS,
  //     abi: RANDOM_IPFS_NFT_ABI,
  //     functionName: "requestNft",
  //     value: mintFee,
  //   });

  //   const receipt = await publicClient?.waitForTransactionReceipt({
  //     hash,
  //   });

  //   const requestNftLog = receipt?.logs.find((log) => {
  //     try {
  //       const result = decodeEventLog({
  //         abi: RANDOM_IPFS_NFT_ABI,
  //         data: log.data,
  //         topics: log.topics,
  //       });
  //       return result.eventName === "NFTRequested";
  //     } catch (error) {
  //       return false;
  //     }
  //   });

  //   if (!requestNftLog) {
  //     throw new Error("No requestNftLog found");
  //   }

  //   const decodedLog = decodeEventLog({
  //     abi: RANDOM_IPFS_NFT_ABI,
  //     data: requestNftLog.data,
  //     topics: requestNftLog.topics,
  //   }) as unknown as NFTRequestedEvent;

  //   const { requestId } = decodedLog.args;

  //   return requestId;
  // }, [mintFee, publicClient]);

  // 手动调用 VRFCoordinatorV2_5Mock.sol 的 fulfillRandomWords
  const requestFulfillRandomWords = useCallback(
    async (requestId: bigint) => {
      const hash = await writeContractAsync({
        address: MOCK_VRF_CONTRACT_ADDRESS,
        abi: MOCK_VRF_ABI,
        functionName: "fulfillRandomWords",
        args: [requestId, RANDOM_IPFS_NFT_CONTRACT_ADDRESS],
      });

      const receipt = await publicClient?.waitForTransactionReceipt({
        hash,
      });

      console.log("fulfillRandomWords success", receipt);
      if (receipt?.status === "success") {
        return true;
      }
    },
    [publicClient]
  );

  return {
    getRequestIdBySimulate,
    // getRequestIdByDecodeLog,
    requestFulfillRandomWords,
  };
}
