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
  refetchBalance: () => void;
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
  const { data: balanceData, refetch: refetchBalance } = useBalance({
    address,
    query: {
      staleTime: 0,
      gcTime: 0,
    },
  });
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
    refetchBalance,
    connect,
    connectors,
    isConnecting,
    disconnect,
    chains: mergedChains,
    switchChainAsync,
    isSwitching,
  };
};
