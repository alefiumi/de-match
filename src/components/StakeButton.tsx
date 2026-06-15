"use client";

import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useStake } from "@/hooks/useStake";
import { STAKE_AMOUNT } from "@/lib/web3/contracts";
import type { AgentName } from "@/types";

interface Props {
  winner: AgentName;
}

const BASE_SEPOLIA_EXPLORER = "https://sepolia.basescan.org/tx/";

const STATUS_LABEL: Record<string, string> = {
  idle:            "🔗 Stake 10 mUSDC to Unlock Agent",
  checking:        "Checking balance…",
  approving:       "Step 1/2 — Approve mUSDC spend…",
  approve_pending: "Step 1/2 — Waiting for approval…",
  staking:         "Step 2/2 — Staking…",
  stake_pending:   "Step 2/2 — Waiting for stake…",
  success:         "✅ Agent Unlocked!",
  error:           "🔗 Stake 10 mUSDC to Unlock Agent",
  needs_faucet:    "🔗 Stake 10 mUSDC to Unlock Agent",
};

const LOADING_STATUSES = new Set([
  "checking",
  "approving",
  "approve_pending",
  "staking",
  "stake_pending",
]);

export function StakeButton({ winner }: Props) {
  const { isConnected, chainId } = useAccount();
  const {
    status,
    errorMsg,
    approveTxHash,
    stakeTxHash,
    usdcBalance,
    executeStake,
    claimFaucet,
    reset,
  } = useStake();

  const isLoading  = LOADING_STATUSES.has(status);
  const isSuccess  = status === "success";
  const needsFaucet = status === "needs_faucet";
  const isWrongChain = isConnected && chainId !== 84532;

  // ── Not connected ─────────────────────────────────────────────────────────
  if (!isConnected) {
    return (
      <div className="space-y-3">
        <p className="text-slate-400 text-sm text-center">
          Connect your wallet to stake mUSDC and unlock this agent.
        </p>
        <div className="flex justify-center">
          <ConnectButton label="Connect Wallet to Stake" />
        </div>
      </div>
    );
  }

  // ── Wrong chain ───────────────────────────────────────────────────────────
  if (isWrongChain) {
    return (
      <div className="error-card p-4 text-center">
        <p className="text-red-300 text-sm font-semibold mb-1">Wrong Network</p>
        <p className="text-red-400 text-xs">Please switch to <strong>Base Sepolia</strong> in your wallet.</p>
      </div>
    );
  }

  // ── Needs faucet ──────────────────────────────────────────────────────────
  if (needsFaucet) {
    const balanceFormatted = (Number(usdcBalance) / 1e6).toFixed(2);
    const stakeFormatted   = (Number(STAKE_AMOUNT) / 1e6).toFixed(0);
    return (
      <div className="space-y-3">
        <div className="error-card p-4">
          <p className="text-red-300 text-sm font-semibold mb-1">Insufficient mUSDC</p>
          <p className="text-red-400 text-xs">
            You have {balanceFormatted} mUSDC. You need at least {stakeFormatted} mUSDC to stake.
          </p>
        </div>
        <button
          className="btn-stake w-full py-3.5 text-sm tracking-wide"
          onClick={claimFaucet}
        >
          💧 Claim 100 mUSDC from Faucet
        </button>
        <button
          className="btn-outline w-full py-2 text-xs"
          onClick={reset}
        >
          ← Back
        </button>
      </div>
    );
  }

  // ── Success ───────────────────────────────────────────────────────────────
  if (isSuccess) {
    return (
      <div className="space-y-3">
        <div
          className="rounded-xl p-5 text-center"
          style={{ background: "rgba(34,211,238,0.07)", border: "1px solid rgba(34,211,238,0.25)" }}
        >
          <p className="text-cyan-300 font-display font-bold text-lg mb-1">
            🎉 Agent Unlocked!
          </p>
          <p className="text-cyan-400 text-xs mb-3">
            10 mUSDC staked — your access to {winner} is now active.
          </p>
          {stakeTxHash && (
            <a
              href={`${BASE_SEPOLIA_EXPLORER}${stakeTxHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-500 text-xs underline underline-offset-2 hover:text-cyan-300 transition-colors"
            >
              View on Basescan ↗
            </a>
          )}
        </div>
        <button className="btn-outline w-full py-2 text-xs" onClick={reset}>
          Stake Again
        </button>
      </div>
    );
  }

  // ── Main CTA ──────────────────────────────────────────────────────────────
  return (
    <div className="space-y-3">
      {/* Progress steps (shown while loading) */}
      {isLoading && (
        <div className="flex gap-2">
          <div
            className="flex-1 px-2 py-1.5 rounded text-xs text-center transition-all"
            style={
              ["approving", "approve_pending"].includes(status)
                ? { background: "rgba(168,85,247,0.15)", color: "#a855f7", border: "1px solid rgba(168,85,247,0.3)" }
                : { background: "rgba(34,211,238,0.1)", color: "#22d3ee" }
            }
          >
            {["approving", "approve_pending"].includes(status) ? "⟳" : "✓"} Approve
          </div>
          <div
            className="flex-1 px-2 py-1.5 rounded text-xs text-center transition-all"
            style={
              ["staking", "stake_pending"].includes(status)
                ? { background: "rgba(168,85,247,0.15)", color: "#a855f7", border: "1px solid rgba(168,85,247,0.3)" }
                : { background: "rgba(148,163,184,0.06)", color: "#64748b" }
            }
          >
            {["staking", "stake_pending"].includes(status) ? "⟳" : "◌"} Stake
          </div>
        </div>
      )}

      {/* Approve tx link */}
      {approveTxHash && status === "approve_pending" && (
        <a
          href={`${BASE_SEPOLIA_EXPLORER}${approveTxHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-center text-purple-400 text-xs underline underline-offset-2 hover:text-purple-300"
        >
          Approve tx pending… View on Basescan ↗
        </a>
      )}

      {/* Main button */}
      <button
        className="btn-stake w-full py-3.5 text-sm tracking-wide"
        onClick={() => executeStake(winner)}
        disabled={isLoading}
        aria-busy={isLoading}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <span
              className="w-4 h-4 rounded-full border-2 border-slate-900/30 border-t-slate-900 animate-spin"
              aria-hidden="true"
            />
            {STATUS_LABEL[status]}
          </span>
        ) : (
          STATUS_LABEL[status] ?? STATUS_LABEL.idle
        )}
      </button>

      {/* Error */}
      {status === "error" && errorMsg && (
        <div className="error-card p-3 text-xs">
          <span className="text-red-400">{errorMsg}</span>
        </div>
      )}

      {/* Balance hint */}
      {status === "idle" && usdcBalance > 0n && (
        <p className="text-slate-600 text-xs text-center">
          Balance: {(Number(usdcBalance) / 1e6).toFixed(2)} mUSDC
        </p>
      )}
    </div>
  );
}
