import { useState } from "react";
import { Check, ChevronDown, Copy, LogOut } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/hooks/useWallet";
import { copyToClipboard, formatAddress, getFirstWord } from "./utils";
import SwitchNetwork from "./SwitchNetwork";
import { useMarketplaceContext } from "@/context/MarketplaceContext";
import { useNftContext } from "@/context/NftContext";

export default function WalletButton() {
  const { address, chain, balanceData, disconnect } = useWallet();
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const { fetchMarketNFTs } = useMarketplaceContext();
  const { fetchUserNFTs } = useNftContext();

  const handleCopyAddress = () => {
    if (address) {
      const result = copyToClipboard(address);
      if (result) {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }
    }
  };

  const handleDisconnect = async () => {
    disconnect();
    await fetchUserNFTs(true);
    await fetchMarketNFTs();
  };

  return (
    <div className="flex gap-3">
      <SwitchNetwork />
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            className="h-[46px] shadow-md font-bold py-2 rounded-xl
            transform hover:scale-105 transition-transform duration-300"
          >
            <p className="max-md:hidden">
              <span
                title={balanceData?.formatted}
                className="inline-block truncation max-w-[100px]"
              >
                {balanceData?.formatted?.replace(/(\.\d{4}).+/, "$1...")}
              </span>
              {balanceData?.symbol}
            </p>
            <p className="flex items-center py-1 ml-2 rounded-md">
              <span>{formatAddress(address!)}</span>
              <ChevronDown className="w-4 h-4 ml-1" />
            </p>
          </Button>
        </DialogTrigger>

        <DialogContent className="sm:max-w-[425px] bg-gray-800/95">
          <DialogTitle />
          <div className="flex flex-col justify-center items-center">
            {chain?.icon ? (
              <img
                src={chain.icon}
                alt={chain.name}
                className="w-18 h-18 rounded-full"
              />
            ) : (
              <p className="w-[72px] h-[72px] rounded-full text-center leading-[72px] text-2xl bg-gray-100 text-black">
                {getFirstWord(chain?.name!)}
              </p>
            )}
            <div className="text-center mt-3">
              <p className="text-lg font-bold">{formatAddress(address!)}</p>
              <p className="text-gray-400">
                {balanceData?.formatted} {balanceData?.symbol}
              </p>
            </div>

            <div className="w-full flex gap-5">
              <Button
                variant="outline"
                className="flex-1 h-auto mt-4 py-3"
                onClick={handleCopyAddress}
              >
                {copied ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                {copied ? "Copied" : "Copy Address"}
              </Button>
              <Button
                variant="outline"
                className="flex-1 h-auto mt-4 py-3"
                onClick={() => handleDisconnect()}
              >
                <LogOut className="w-4 h-4" />
                Disconnect
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
