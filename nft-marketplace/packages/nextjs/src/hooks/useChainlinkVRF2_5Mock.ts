import { useAccount, usePublicClient, useWriteContract } from "wagmi";
import { useCallback } from "react";
import { decodeEventLog } from "viem";
import {
  MOCK_VRF_ABI,
  MOCK_VRF_CONTRACT_ADDRESS,
  RANDOMIPFSNFT_ABI,
  RANDOMIPFSNFT_CONTRACT_ADDRESS,
} from "@/constants";
import { BigintType, NFTRequestedEvent } from "@/types";

/**
 * 模拟使用Chainlink VRF2.5
 * 需要主动获取并传递 requestId 到 Mock合约的 fulfillRandomWords 函数中
 */
export function useChainlinkVRF2_5Mock({ mintFee }: { mintFee: BigintType }) {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();

  // requestNft函数明确返回了requestId，可以使用useSimulateContract模拟获取
  const getRequestIdBySimulate = async () => {
    const requestNftData = await publicClient?.simulateContract({
      address: RANDOMIPFSNFT_CONTRACT_ADDRESS,
      abi: RANDOMIPFSNFT_ABI,
      functionName: "requestNft",
      account: address,
      value: mintFee,
    });

    // 需要调用requestNft检查是否需要授权
    await writeContractAsync(requestNftData?.request!);
    return requestNftData?.result;
  };

  // 如果没有返回requestId则需解码事件日志
  // const getRequestIdByDecodeLog = async () => {
  //   const hash = await writeContractAsync({
  //     address: RANDOMIPFSNFT_CONTRACT_ADDRESS,
  //     abi: RANDOMIPFSNFT_ABI,
  //     functionName: "requestNft",
  //     value: mintFee,
  //   });

  //   const receipt = await publicClient?.waitForTransactionReceipt({
  //     hash,
  //   });

  //   const requestNftLog = receipt?.logs.find((log) => {
  //     try {
  //       const result = decodeEventLog({
  //         abi: RANDOMIPFSNFT_ABI,
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
  //     abi: RANDOMIPFSNFT_ABI,
  //     data: requestNftLog.data,
  //     topics: requestNftLog.topics,
  //   }) as unknown as NFTRequestedEvent;

  //   const { requestId } = decodedLog.args;

  //   return requestId;
  // }

  // 手动调用 VRFCoordinatorV2_5Mock.sol 的 fulfillRandomWords
  const requestFulfillRandomWords = async (requestId: bigint) => {
    const hash = await writeContractAsync({
      address: MOCK_VRF_CONTRACT_ADDRESS,
      abi: MOCK_VRF_ABI,
      functionName: "fulfillRandomWords",
      args: [requestId, RANDOMIPFSNFT_CONTRACT_ADDRESS],
    });

    const receipt = await publicClient?.waitForTransactionReceipt({
      hash,
    });

    if (receipt?.status === "success") {
      return true;
    }
  };

  return {
    getRequestIdBySimulate,
    // getRequestIdByDecodeLog,
    requestFulfillRandomWords,
  };
}
