import { networks } from "@/constants/networks";
import { Address, BalanceDataProps, ChainType } from "@/types";
import {
  type Connector,
  type CreateConnectorFn,
  useAccount,
  useBalance,
  useConnect,
  useDisconnect,
  useSwitchChain,
} from "wagmi";

interface WalletProps {
  address: Address | undefined;
  chain: ChainType | undefined;
  isConnected: boolean;
  balanceData: BalanceDataProps | undefined;
  isConnecting: boolean;
  connectors: readonly Connector<CreateConnectorFn>[];
  connect: (args: { connector: Connector }) => void;
  disconnect: () => void;
  chains: ChainType[];
  switchChainAsync: (args: { chainId: number }) => void;
  isSwitching: boolean;
}

export const useWallet = (): WalletProps => {
  const { address, chain, isConnected } = useAccount();
  const { data: balanceData } = useBalance({ address });
  const { connect, connectors, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  const { chains, switchChainAsync, isPending: isSwitching } = useSwitchChain();

  const currentChain = chain
    ? { ...chain, icon: networks.find((n) => n.id === chain.id)?.icon }
    : undefined;

  const mergedChains = chains.map((chain) => ({
    ...chain,
    icon: networks.find((n) => n.id === chain.id)?.icon,
  }));

  return {
    address,
    chain: currentChain,
    isConnected,
    balanceData,
    connect,
    connectors,
    isConnecting,
    disconnect,
    chains: mergedChains,
    switchChainAsync,
    isSwitching,
  };
};
