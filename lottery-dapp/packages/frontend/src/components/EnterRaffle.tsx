"use client";

import React, { useState } from "react";
import { ABI, CONTRACT_ADDRESS } from "@/constants";
import {
  useReadContract,
  useWaitForTransactionReceipt,
  useWatchContractEvent,
  useWriteContract,
} from "wagmi";
import { useWallet } from "@/hooks/useWallet";
import { Button } from "./ui/button";
import { parseEther } from "viem";

export default function EnterRaffle() {
  const { address, isConnected } = useWallet();
  const [entranceFee, setEntranceFee] = useState<string>("");
  const {
    data: hash,
    writeContract,
    isPending,
    error: writeError,
  } = useWriteContract();

  // 获取彩票费用
  const { data: entranceFeeFromContract } = useReadContract({
    abi: ABI,
    address: CONTRACT_ADDRESS,
    functionName: "getEntranceFee",
  });

  console.log('彩票费用',entranceFeeFromContract)

  // 获取玩家数量
  const {
    data: numberOfPlayers,
    isLoading: isLoadingPlayers,
    error: playersError,
    refetch: refetchPlayers,
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ABI,
    functionName: "getNumberOfPlayers",
  });

  useWatchContractEvent({
    abi: ABI,
    address: CONTRACT_ADDRESS,
    eventName: "RaffleEnter",
    onLogs(logs) {
      console.log("RaffleEnter事件", logs);
      refetchPlayers()
    },
  });

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: transactionError,
  } = useWaitForTransactionReceipt({
    hash,
  });

  const handleEnterRaffle = async () => {
    if (!isConnected || !address) {
      alert("请先连接您的钱包。");
      return;
    }

    if (!entranceFee || parseFloat(entranceFee) <= 0) {
      alert("请输入有效的彩票费用。");
      return;
    }

    try {
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: ABI, // 访问 'abi' 属性
        functionName: "enterRaffle",
        value: parseEther(entranceFee),
      });
    } catch (err) {
      // console.error("发起交易时出错：", err);
      // 对初始调用进行更具体的错误处理
    }
  };

  return (
    <div>
      <h3>参与彩票</h3>
      <input
        type="number"
        step="0.0001"
        placeholder="输入 ETH 参与"
        value={entranceFee}
        onChange={(e) => setEntranceFee(e.target.value)}
      />
      <Button onClick={handleEnterRaffle} disabled={isPending || isConfirming}>
        {isPending ? "确认中..." : isConfirming ? "等待确认..." : "参与彩票"}
      </Button>

      {hash && <p>交易哈希: {hash}</p>}
      {isConfirming && <p>等待交易确认...</p>}
      {isConfirmed && <p>交易已确认！</p>}
      {writeError && <p>发送交易出错: {writeError.message}</p>}
      {transactionError && <p>交易失败: {transactionError.message}</p>}
    </div>
  );
}
