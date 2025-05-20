import { http, createConfig } from "wagmi";
import { hardhat, mainnet, sepolia } from "wagmi/chains";
import { coinbaseWallet, walletConnect } from "wagmi/connectors";

const SEPOLIA_RPC_URL = process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL!;
const HARDHAT_RPC_URL = process.env.NEXT_PUBLIC_HARDHAT_RPC_URL!;
const WALLETCONNECT_PROJECT_ID =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!;

export const config = createConfig({
  chains: [mainnet, sepolia, hardhat],
  transports: {
    [mainnet.id]: http(),
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
