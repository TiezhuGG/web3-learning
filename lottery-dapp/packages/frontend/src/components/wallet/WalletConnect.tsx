"use client";
import { useAccount } from "wagmi";
import WalletButton from "./WalletButton";
import ConnectButton from "./ConnectButton";

export default function WalletConnect() {
  const { isConnected } = useAccount();

  return <>{isConnected ? <WalletButton /> : <ConnectButton />}</>;
}
