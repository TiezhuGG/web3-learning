import { ABI, CONTRACT_ADDRESS } from "@/constants";
import {
  useReadContract,
  useWatchContractEvent,
  useWriteContract,
} from "wagmi";
import { Address } from "viem";

export const useRaffleContract = () => {
  // 读取彩票入场费
  const { data: entranceFee } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ABI,
    functionName: "getEntranceFee",
  });

  // 读取彩票参与者数量
  const { data: playerCount, refetch: refetchPlayerCount } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ABI,
    functionName: "getNumberOfPlayers",
  });

  // 监听RaffleEnter事件
  useWatchContractEvent({
    address: CONTRACT_ADDRESS,
    abi: ABI,
    eventName: "RaffleEnter",
    onLogs: (logs) => {
      console.log("New Raffle Entered:", logs);
      refetchPlayerCount();
    },
  });

  // 读取最近获奖者
  const { data: recentWinner, refetch: refetchWinner } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ABI,
    functionName: "getRecentWinner",
  });

  // 监听WinnerPicked事件
  useWatchContractEvent({
    address: CONTRACT_ADDRESS,
    abi: ABI,
    eventName: "WinnerPicked",
    onLogs: (logs) => {
      console.log("New Winner Picked:", logs);
      refetchWinner();
      refetchPlayerCount();
    },
  });

  console.log("recentWinner", recentWinner);

  const { writeContract: enterRaffle, isPending: isEntering } =
    useWriteContract();
  const { writeContract: pickWinner, isPending: isPicking } =
    useWriteContract();

  return {
    entranceFee: entranceFee as bigint | undefined,
    playerCount: playerCount as number | undefined,
    recentWinner: recentWinner as Address | undefined,

    enterRaffle: () =>
      enterRaffle({
        address: CONTRACT_ADDRESS,
        abi: ABI,
        functionName: "enterRaffle",
        value: entranceFee as bigint,
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
