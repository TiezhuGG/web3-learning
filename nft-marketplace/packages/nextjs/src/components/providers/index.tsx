"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { WagmiProvider } from "wagmi";
import { config } from "@/lib/wagmi";
import { NftProvider } from "@/context/NftContext";
import { MarketplaceProvider } from "@/context/MarketplaceContext";

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <NftProvider>
            <MarketplaceProvider>{children}</MarketplaceProvider>
          </NftProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
