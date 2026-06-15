"use client";

import { useState, useEffect } from "react";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { wagmiConfig } from "@/lib/web3/wagmi";

import "@rainbow-me/rainbowkit/styles.css";

const queryClient = new QueryClient();

const rainbowTheme = darkTheme({
  accentColor: "#a855f7",
  accentColorForeground: "#ffffff",
  borderRadius: "medium",
  fontStack: "system",
  overlayBlur: "small",
});

export function Web3Provider({ children }: { children: React.ReactNode }) {
  // Prevent RainbowKit from running during SSR/prerender.
  // It throws if NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is absent at build time.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={rainbowTheme} modalSize="compact">
          {/* Render children always so the page HTML is correct;
              RainbowKit UI elements only activate client-side */}
          {children}
          {/* Suppress RainbowKit's SSR hydration warning */}
          {!mounted && (
            <style>{`:root { --rk-radii-modal: 16px; }`}</style>
          )}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
