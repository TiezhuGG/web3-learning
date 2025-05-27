import { createPublicClient } from "viem";
import { http, createConfig } from "wagmi";
import { hardhat, sepolia } from "wagmi/chains";
// import { coinbaseWallet, walletConnect } from "wagmi/connectors";

const SEPOLIA_RPC_URL = process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL!;
const HARDHAT_RPC_URL = process.env.NEXT_PUBLIC_HARDHAT_RPC_URL!;
// const WALLETCONNECT_PROJECT_ID =
//   process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!;

export const publicClient = createPublicClient({
  chain: hardhat,
  transport: http(HARDHAT_RPC_URL),
});

export const config = createConfig({
  chains: [hardhat, sepolia],
  transports: {
    [sepolia.id]: http(SEPOLIA_RPC_URL),
    [hardhat.id]: http(HARDHAT_RPC_URL),
  },
  connectors: [
    // walletConnect({
    //   projectId: WALLETCONNECT_PROJECT_ID,
    // }),
    // coinbaseWallet({
    //   appName: "My Dapp",
    // }),
  ],
  ssr: true,
});


