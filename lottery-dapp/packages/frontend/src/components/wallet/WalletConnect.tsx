"use client";

import WalletButton from "./WalletButton";
import ConnectButton from "./ConnectButton";
import { useWallet } from "@/hooks/useWallet";

export default function WalletConnect() {
  const { isConnected } = useWallet();

  return <>{isConnected ? <WalletButton /> : <ConnectButton />}</>;
}
