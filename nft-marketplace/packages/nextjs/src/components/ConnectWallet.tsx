"use client";

import { useConnect } from "wagmi";
import { injected } from "wagmi/connectors";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ConnectWallet() {
  const { connect } = useConnect();

  const handleConnect = () => {
    connect({ connector: injected() });
  };
  
  return (
    <Card className="mx-auto max-w-md backdrop-blur-lg bg-white/10">
      <CardHeader>
        <CardTitle className="text-white">Welcome</CardTitle>
        <CardDescription className="text-gray-200">
          Connect your wallet to get started
        </CardDescription>
      </CardHeader>
      <CardFooter>
        <Button onClick={handleConnect}>Connect Wallet</Button>
      </CardFooter>
    </Card>
  );
}
