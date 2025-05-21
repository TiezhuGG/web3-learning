"use client";

import { useRaffleContract } from "@/hooks/useRaffleContract";
import { useWallet } from "@/hooks/useWallet";
import { formatEther } from "viem";
import { Button } from "../ui/button";
import { formatAddress } from "../wallet/utils";
import { useState } from "react";

const MANAGER_ADDRESS = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

export default function Entrance() {
  const [ethAmount, setEthAmount] = useState<string>("");
  const { address, isConnected } = useWallet();
  const {
    entranceFee,
    playerCount,
    recentWinner,
    enterRaffle,
    pickWinner,
    isEntering,
    isPicking,
  } = useRaffleContract();

  const handleEnterRaffle = () => {
    if (!ethAmount) {
      return alert("请输入参与费用");
    }
    enterRaffle(ethAmount);
  };

  console.log(address, address === MANAGER_ADDRESS);

  return (
    <div>
      <h2 className="text-2xl mb-5">🎉 抽奖活动</h2>

      <div className="flex flex-col gap-2">
        <div>
          <span>参与费用：</span>
          <input
            className="border rounded-md px-2"
            value={ethAmount}
            onChange={(e) => setEthAmount(e.target.value)}
            placeholder="至少0.001ETH"
          ></input>
        </div>
        <StatItem
          label="当前参与人数："
          value={playerCount?.toString() || "0"}
        />
        <StatItem
          label="最新赢家："
          value={
            recentWinner === "0x0000000000000000000000000000000000000000"
              ? "暂无"
              : formatAddress(recentWinner)
          }
        />
      </div>

      <div className="flex gap-4 mt-5">
        <Button
          onClick={handleEnterRaffle}
          disabled={!isConnected || isEntering}
          aria-busy={isEntering}
        >
          {isEntering ? "参与中..." : "立即参与"}
        </Button>

        <Button
          onClick={pickWinner}
          disabled={!isConnected || isPicking || address !== MANAGER_ADDRESS}
          aria-busy={isPicking}
        >
          {isPicking ? "开奖中..." : "管理员开奖"}
        </Button>
      </div>
    </div>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat">
      <span className="label">{label}</span>
      <span className="value">{value}</span>
    </div>
  );
}
