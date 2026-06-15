import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Web3Provider } from "@/components/Web3Provider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

export const metadata: Metadata = {
  title: "De-Match Protocol — AI Trust Registry",
  description:
    "Describe your workflow. Our on-chain AI oracle evaluates your needs and surfaces the best agent — verified by trust attestations.",
  keywords: ["AI", "agent", "Claude", "ChatGPT", "Gemini", "Copilot", "oracle"],
  robots: { index: true, follow: true },
  openGraph: {
    title: "De-Match Protocol",
    description: "Find your perfect AI agent match.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body className="bg-[#0a0d14] text-slate-200 font-sans min-h-screen overflow-x-hidden antialiased">
        <Web3Provider>
          <Header />
          {children}
          <Footer />
        </Web3Provider>
      </body>
    </html>
  );
}
