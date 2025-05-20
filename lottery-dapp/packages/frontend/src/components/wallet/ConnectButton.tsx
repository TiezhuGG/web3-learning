"use client";

import { useConnect } from "wagmi";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import WalletConnectIcon from "./assets/WalletConnect.png";
import CoinbaseIcon from "./assets/CoinbaseWallet.png";
import { Wallet } from "lucide-react";
import { useState } from "react";

const walletIcons: Record<string, string> = {
  WalletConnect: WalletConnectIcon.src,
  "Coinbase Wallet": CoinbaseIcon.src,
};

export default function ConnectButton() {
  const { connect, connectors, isPending } = useConnect();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button disabled={isPending}>
          <Wallet className="w-4 h-4" />
          {isPending ? "Connecting..." : "Connect Wallet"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Connect Wallet</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 overflow-auto max-h-[400px]">
          {connectors.map((connector) => {
            return (
              <Button
                key={connector.uid}
                variant="outline"
                className=" h-auto flex flex-col justify-center items-center border rounded-md p-4"
                onClick={() => {
                  connect({ connector });
                  setIsOpen(false);
                }}
              >
                <img
                  src={connector.icon ?? walletIcons[connector.name]}
                  alt={connector.name}
                  height={28}
                  width={28}
                />
                <span className="mt-2">{connector.name}</span>
              </Button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
