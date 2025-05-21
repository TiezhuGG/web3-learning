"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Wallet } from "lucide-react";
import { useState } from "react";
import { useWallet } from "../hooks/useWallet";

const walletIcons: Record<string, string> = {
  WalletConnect: "/assets/wallet/WalletConnect.png",
  "Coinbase Wallet": "/assets/wallet/CoinbaseWallet.png",
  CommonIcon: "/assets/wallet/CommonWallet.png",
};

export default function ConnectButton() {
  const { connect, connectors, isConnecting } = useWallet();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button disabled={isConnecting} className="rounded-xl">
          <Wallet className="w-4 h-4" />
          {isConnecting ? "Connecting..." : "Connect Wallet"}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Connect Wallet</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 overflow-auto max-h-[340px]">
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
                  src={
                    connector.icon ??
                    walletIcons[connector.name] ??
                    walletIcons["CommonIcon"]
                  }
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
