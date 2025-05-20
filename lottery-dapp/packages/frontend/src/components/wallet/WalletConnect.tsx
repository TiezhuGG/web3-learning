"use client";
import { useAccount } from "wagmi";
import ConnectedWallet from "./WalletButton";
import ConnectButton from "./ConnectButton";

export default function WalletConnect() {
  const { isConnected } = useAccount();

  return <>{isConnected ? <ConnectedWallet /> : <ConnectButton />}</>;
}
