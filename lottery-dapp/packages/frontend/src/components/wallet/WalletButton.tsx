import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAccount, useBalance } from "wagmi";
import { useState } from "react";
import { formatAddress } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

export default function ConnectedWallet() {
  const { address } = useAccount();
  const { data: balanceData } = useBalance({ address });
  console.log("balanceData", balanceData);

  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            className="justify-between shadow-md font-bold py-2
            transform hover:scale-105 transition-transform duration-300"
          >
            <p>
              {balanceData?.formatted} {balanceData?.symbol}
            </p>
            <p className="flex items-center py-1 ml-2 rounded-md">
              <span>{formatAddress(address!)}</span>
              <ChevronDown className="w-4 h-4 ml-1" />
            </p>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]"></DialogContent>
      </Dialog>
    </div>
  );
}
