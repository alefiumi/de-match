"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";

export function Header() {
  return (
    <header className="relative z-20 border-b border-purple-900/30 bg-slate-950/70 backdrop-blur-md sticky top-0">
      <div className="max-w-5xl mx-auto px-5 py-3 flex items-center justify-between">

        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-purple-600/20 border border-purple-500/30">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <path d="M9 2L15.5 5.5V12.5L9 16L2.5 12.5V5.5L9 2Z" stroke="#a855f7" strokeWidth="1.4" fill="none"/>
              <path d="M9 2V16M2.5 5.5L15.5 12.5M15.5 5.5L2.5 12.5" stroke="#22d3ee" strokeWidth="0.8" opacity="0.6"/>
            </svg>
          </div>
          <div>
            <p className="font-display font-bold text-white text-[15px] leading-none">De-Match Protocol</p>
            <p className="label-tag mt-0.5">AI Trust Registry v0.9.1</p>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5">
            <div className="live-dot" aria-hidden="true"><span /></div>
            <span className="text-cyan-400 text-xs font-medium">Base Sepolia</span>
          </div>

          {/* RainbowKit connect button — handles all wallet/chain state */}
          <ConnectButton
            chainStatus="icon"
            showBalance={false}
            accountStatus="avatar"
          />
        </div>
      </div>
    </header>
  );
}
