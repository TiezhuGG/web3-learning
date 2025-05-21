import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { getFirstWord } from "./utils";
import { useWallet } from "../hooks/useWallet";
import { ChevronDown } from "lucide-react";

export default function SwitchNetwork() {
  const {
    chain: currentChain,
    chains,
    switchChainAsync,
    isSwitching,
  } = useWallet();
  const [isOpen, setIsOpen] = useState(false);
  const [switchingChainId, setSwitchingChainId] = useState<number | null>(null);

  const handleSwitchChain = async (chainId: number) => {
    setSwitchingChainId(chainId);
    await switchChainAsync({ chainId });
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          className="h-[46px] shadow-md font-bold rounded-xl
            transform hover:scale-105 transition-transform duration-300"
        >
          <div className="flex items-center">
            <div className="flex items-center">
              <div className="mr-2">
                {currentChain?.icon ? (
                  <img
                    src={currentChain.icon}
                    alt={currentChain.name}
                    className="w-6 h-6 rounded-full"
                  />
                ) : (
                  <p className="w-[24px] h-[24px] inline-flex justify-center items-center bg-gray-100 text-black dark:text-white rounded-full">
                    {getFirstWord(currentChain?.name!)}
                  </p>
                )}
              </div>
              <span className="max-md:hidden mr-1">{currentChain?.name}</span>
            </div>
            <ChevronDown className="w-4 h-4" />
          </div>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px]">
        <DialogTitle>Switch Network</DialogTitle>

        <div className="space-y-4">
          {chains.map((chain) => {
            const isConnectedChain = chain.id === currentChain?.id;
            const isPendingChain = isSwitching && switchingChainId === chain.id;

            return (
              <div
                key={chain.id}
                className={`${
                  isConnectedChain
                    ? "text-white bg-blue-500"
                    : "hover:bg-gray-100"
                } p-2 rounded-md flex justify-between items-center cursor-pointer`}
                onClick={() => {
                  if (!isConnectedChain) handleSwitchChain(chain.id);
                }}
              >
                <div className="flex gap-3 ">
                  {chain.icon ? (
                    <img
                      src={chain.icon}
                      alt={chain.name}
                      className="w-6 h-6 rounded-full"
                    />
                  ) : (
                    <p className="w-[24px] h-[24px] inline-flex justify-center items-center bg-gray-100 text-black dark:text-white rounded-full">
                      {getFirstWord(chain.name)}
                    </p>
                  )}
                  <p>{chain.name}</p>
                </div>
                <p className="flex items-center gap-2">
                  <span className="font-bold text-sm">
                    {isConnectedChain ? "已连接" : ""}
                    {isPendingChain ? "等待钱包确认..." : ""}
                  </span>
                  {isConnectedChain && (
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
                  )}
                  {isPendingChain && (
                    <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                  )}
                </p>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
