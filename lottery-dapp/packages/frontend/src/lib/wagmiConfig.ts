import { http, createConfig } from "wagmi";
import {
  arbitrum,
  base,
  hardhat,
  mainnet,
  optimism,
  polygon,
  sepolia,
} from "wagmi/chains";
import { coinbaseWallet, walletConnect } from "wagmi/connectors";

const SEPOLIA_RPC_URL = process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL!;
const HARDHAT_RPC_URL = process.env.NEXT_PUBLIC_HARDHAT_RPC_URL!;
const WALLETCONNECT_PROJECT_ID =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!;

export const config = createConfig({
  chains: [mainnet, sepolia, hardhat, polygon, optimism, arbitrum, base],
  transports: {
    [mainnet.id]: http(),
    [optimism.id]: http(),
    [arbitrum.id]: http(),
    [base.id]: http(),
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
