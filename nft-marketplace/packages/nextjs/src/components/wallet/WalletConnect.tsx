"use client";

import { useWallet } from "@/hooks/useWallet";
import WalletButton from "./WalletButton";
import ConnectButton from "./ConnectButton";

export default function WalletConnect() {
  const { isConnected } = useWallet();

  return <>{isConnected ? <WalletButton /> : <ConnectButton />}</>;
}
