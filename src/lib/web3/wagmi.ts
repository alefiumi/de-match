import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { baseSepolia } from "wagmi/chains";

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "placeholder";

// `getDefaultConfig` throws at module-init if projectId is empty string.
// "placeholder" satisfies the format check and is replaced at runtime
// with the real value from the env var on Vercel.
// See: https://www.rainbowkit.com/docs/installation

export const wagmiConfig = getDefaultConfig({
  appName: "De-Match Protocol",
  projectId,
  chains: [baseSepolia],
  ssr: true,
});

export { baseSepolia };
