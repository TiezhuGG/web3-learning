import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useAccount, useSwitchChain } from "wagmi";
import { networks } from "./networks";
import { getFirstWord } from "@/lib/utils";

export default function SwitchNetwork() {
  const [isOpen, setIsOpen] = useState(false);
  const { chain: currentChain } = useAccount();
  const { chains, switchChain } = useSwitchChain();

  const mergedChains = chains.map((chain) => {
    const item = networks.find((network) => network.id === chain.id);
    return {
      ...chain,
      icon: item?.icon,
    };
  });

  return (
    <div>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            className="justify-between shadow-md font-bold py-2
            transform hover:scale-105 transition-transform duration-300"
          >
            {currentChain?.name}
          </Button>
        </DialogTrigger>

        <DialogContent className="sm:max-w-[425px]">
          <DialogTitle>Switch Network</DialogTitle>

          <div className="space-y-4">
            {mergedChains.map((chain) => {
              return (
                <div
                  key={chain.id}
                  className={`${
                    currentChain?.id === chain.id
                      ? "text-white bg-blue-500"
                      : "hover:bg-gray-100"
                  } p-2 rounded-md flex justify-between items-center cursor-pointer`}
                  onClick={() => {
                    switchChain({ chainId: chain.id });
                    setIsOpen(false);
                  }}
                >
                  <div className="flex gap-3">
                    {chain.icon ? (
                      <div className="rounded-full">{chain.icon}</div>
                    ) : (
                      <div className="w-[24px] h-[24px] inline-flex justify-center items-center bg-gray-100 text-black dark:text-white">
                        {getFirstWord(chain.name)}
                      </div>
                    )}
                    <p>{chain.name}</p>
                  </div>
                  <p className="flex items-center gap-2">
                    <span className="font-bold text-sm">
                      {currentChain?.id === chain.id ? "已连接" : ""}
                    </span>
                    {currentChain?.id === chain.id && (
                      <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                    )}
                  </p>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
