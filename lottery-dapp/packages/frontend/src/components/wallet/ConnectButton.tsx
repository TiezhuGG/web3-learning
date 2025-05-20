"use client";

import { injected, useConnect } from "wagmi";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import WalletConnectIcon from "./assets/WalletConnect.png";
import CoinbaseIcon from "./assets/CoinbaseWallet.png";

const walletIcons: Record<string, string> = {
  WalletConnect: WalletConnectIcon.src,
  "Coinbase Wallet": CoinbaseIcon.src,
};

export default function ConnectButton() {
  const { connect, connectors } = useConnect();
  console.log(connect, connectors);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Connect Wallet</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Connect Wallet</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 overflow-auto max-h-[400px]">
          {connectors.map((connector) => {
            console.log("connector", connector);

            return (
              <div
                key={connector.id}
                className="flex flex-col justify-center items-center border rounded-md p-4 cursor-pointer hover:bg-gray-50"
                onClick={() => {
                  connect({ connector });
                }}
              >
                <img
                  src={connector.icon ?? walletIcons[connector.name]}
                  alt={connector.name}
                  height={28}
                  width={28}
                />
                <span className="mt-2">{connector.name}</span>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
