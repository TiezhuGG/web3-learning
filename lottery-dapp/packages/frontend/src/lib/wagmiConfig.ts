import { http, createConfig } from "wagmi";
import {
  arbitrum,
  base,
  hardhat,
  mainnet,
  optimism,
  polygon,
  sepolia,
  avalanche,
  bsc,
} from "wagmi/chains";
import { coinbaseWallet, walletConnect } from "wagmi/connectors";

const SEPOLIA_RPC_URL = process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL!;
const HARDHAT_RPC_URL = process.env.NEXT_PUBLIC_HARDHAT_RPC_URL!;
const WALLETCONNECT_PROJECT_ID =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!;

export const config = createConfig({
  chains: [
    mainnet,
    hardhat,
    sepolia,
    bsc,
    avalanche,
    base,
    polygon,
    optimism,
    arbitrum,
  ],
  transports: {
    [mainnet.id]: http(),
    [bsc.id]: http(),
    [optimism.id]: http(),
    [arbitrum.id]: http(),
    [base.id]: http(),
    [avalanche.id]: http(),
    [polygon.id]: http(),
    [sepolia.id]: http(SEPOLIA_RPC_URL),
    [hardhat.id]: http(HARDHAT_RPC_URL),
  },
  connectors: [
    walletConnect({
      projectId: WALLETCONNECT_PROJECT_ID,
    }),
    coinbaseWallet({
      appName: "My Dapp",
    }),
  ],
  ssr: true,
});
