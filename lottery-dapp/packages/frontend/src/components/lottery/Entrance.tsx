"use client";

import { useRaffleContract } from "@/hooks/useRaffleContract";
import { useWallet } from "@/hooks/useWallet";
import { formatEther } from "viem";
import { Button } from "../ui/button";

export default function Entrance() {
  const { isConnected } = useWallet();
  const {
    entranceFee,
    playerCount,
    recentWinner,
    enterRaffle,
    pickWinner,
    isEntering,
    isPicking,
  } = useRaffleContract();

  return (
    <div className="">
      <h2 className="mb-5">🎉 抽奖活动</h2>

      <div className="flex flex-col gap-2">
        <StatItem
          label="参与费用："
          value={entranceFee ? `${formatEther(entranceFee)} ETH` : "加载中..."}
        />
        <StatItem
          label="当前参与人数："
          value={playerCount?.toString() || "0"}
        />
        <StatItem
          label="最新赢家："
          value={recentWinner ? shortenAddress(recentWinner) : "暂无"}
        />
      </div>

      <div className="flex gap-4 mt-5">
        <Button
          onClick={enterRaffle}
          disabled={!isConnected || isEntering}
          aria-busy={isEntering}
        >
          {isEntering ? "参与中..." : "立即参与"}
        </Button>

        <Button
          onClick={pickWinner}
          disabled={!isConnected || isPicking}
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

function shortenAddress(address?: string) {
  return address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "";
}
