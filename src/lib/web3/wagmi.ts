import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { baseSepolia } from "wagmi/chains";

// Get your WalletConnect Project ID at https://cloud.walletconnect.com
// Add it to .env.local as NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "";

if (!projectId && typeof window !== "undefined") {
  console.warn(
    "[De-Match] NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is not set. " +
      "WalletConnect will not work. Get a free project ID at https://cloud.walletconnect.com"
  );
}

export const wagmiConfig = getDefaultConfig({
  appName: "De-Match Protocol",
  projectId,
  chains: [baseSepolia],
  ssr: true,
});

export { baseSepolia };
