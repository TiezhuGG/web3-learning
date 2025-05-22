import { ABI, CONTRACT_ADDRESS } from "@/constants";
import {
  useReadContract,
  useWatchContractEvent,
  useWriteContract,
} from "wagmi";
import { Address, parseEther } from "viem";

const contractConfig = {
  address: CONTRACT_ADDRESS,
  abi: ABI,
} as const;

export const useRaffleContract = () => {
  // 读取彩票入场费
  const { data: entranceFee } = useReadContract({
    ...contractConfig,
    functionName: "getEntranceFee",
    query: {
      staleTime: Infinity, // 费用通常不会变，可以设置较长的缓存时间
    },
  });

  // 读取彩票参与者数量
  const { data: playerCount, refetch: refetchPlayerCount } = useReadContract({
    ...contractConfig,
    functionName: "getNumberOfPlayers",
  });

  // 监听RaffleEnter事件
  useWatchContractEvent({
    ...contractConfig,
    eventName: "RaffleEnter",
    onLogs: (logs) => {
      console.log("New Raffle Entered:", logs);
      refetchPlayerCount();
    },
  });

  // 读取最近获奖者
  const { data: recentWinner, refetch: refetchWinner } = useReadContract({
    ...contractConfig,
    functionName: "getRecentWinner",
  });

  // 监听WinnerPicked事件
  useWatchContractEvent({
    ...contractConfig,
    eventName: "WinnerPicked",
    onLogs: (logs) => {
      console.log("New Winner Picked:", logs);
      refetchWinner();
      refetchPlayerCount();
    },
  });

  const { writeContract: enterRaffle, isPending: isEntering } =
    useWriteContract();
  const { writeContract: pickWinner, isPending: isPicking } =
    useWriteContract();

  return {
    entranceFee: entranceFee as bigint | undefined,
    playerCount: playerCount as number | undefined,
    recentWinner: recentWinner as Address | undefined,

    enterRaffle: (ethAmount: string) =>
      enterRaffle({
        address: CONTRACT_ADDRESS,
        abi: ABI,
        functionName: "enterRaffle",
        // value: entranceFee as bigint, // 默认使用入场费
        value: parseEther(ethAmount), // 允许用户指定入场费
      }),

    pickWinner: () =>
      pickWinner({
        address: CONTRACT_ADDRESS,
        abi: ABI,
        functionName: "pickRandomWinner",
      }),

    isEntering,
    isPicking,
  };
};
