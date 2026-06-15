"use client";

import { useState, useEffect } from "react";
import { useAccount }           from "wagmi";
import { ConnectButton }        from "@rainbow-me/rainbowkit";
import { formatUnits }          from "viem";
import { useStake, useUsdcBalance, useFaucet } from "@/lib/web3/hooks";
import { CHAIN_ID }             from "@/lib/web3/contracts";
import type { AgentName }       from "@/types";

interface Props {
  agentName: AgentName;
  agentEmoji: string;
  agentColor: string;
  onClose: () => void;
}

const MIN_STAKE_USDC = "10";
const DEFAULT_AMOUNT = "10";

function shortHash(hash: `0x${string}`) {
  return `${hash.slice(0, 10)}…${hash.slice(-6)}`;
}
function basescanTx(hash: `0x${string}`) {
  return `https://sepolia.basescan.org/tx/${hash}`;
}

export function StakeModal({ agentName, agentEmoji, agentColor, onClose }: Props) {
  const { address, chainId, isConnected } = useAccount();
  const { step, approveTxHash, stakeTxHash, error, execute, reset } = useStake();
  const { data: rawBalance, refetch: refetchBalance } = useUsdcBalance(address);
  const { drip, loading: faucetLoading, error: faucetError, isSuccess: faucetSuccess } = useFaucet();

  const [amount, setAmount] = useState(DEFAULT_AMOUNT);
  const [amountError, setAmountError] = useState<string | null>(null);

  const balance = rawBalance !== undefined
    ? Number(formatUnits(rawBalance as bigint, 6)).toFixed(2)
    : null;

  const wrongNetwork = isConnected && chainId !== CHAIN_ID;
  const isProcessing = ["approving", "approve_pending", "staking", "stake_pending"].includes(step);

  useEffect(() => {
    if (faucetSuccess) refetchBalance();
  }, [faucetSuccess, refetchBalance]);

  function validateAmount(val: string): boolean {
    const n = parseFloat(val);
    if (isNaN(n) || n < 10) {
      setAmountError("Minimum stake is 10 mUSDC");
      return false;
    }
    if (rawBalance !== undefined && n > Number(formatUnits(rawBalance as bigint, 6))) {
      setAmountError("Insufficient mUSDC balance");
      return false;
    }
    setAmountError(null);
    return true;
  }

  async function handleStake() {
    if (!validateAmount(amount)) return;
    await execute(agentName, amount);
  }

  // ── Step labels ──────────────────────────────────────────────────────────
  const steps = [
    { id: "approve", label: "Approve mUSDC" },
    { id: "stake",   label: "Stake & Unlock" },
  ] as const;

  const currentStepIndex =
    step === "idle"            ? -1 :
    step === "approving"       ? 0  :
    step === "approve_pending" ? 0  :
    step === "staking"         ? 1  :
    step === "stake_pending"   ? 1  :
    step === "success"         ? 2  : -1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label={`Stake mUSDC to unlock ${agentName}`}
    >
      <div className="card glow-purple w-full max-w-md p-7 animate-fade-up">

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div
              className="agent-ring w-12 h-12 text-2xl"
              style={{ borderColor: agentColor, background: `rgba(${hexToRgb(agentColor)},0.1)` }}
            >
              {agentEmoji}
            </div>
            <div>
              <h2 className="font-display font-bold text-white text-lg">Unlock {agentName}</h2>
              <p className="text-slate-400 text-xs mt-0.5">Stake mUSDC on Base Sepolia</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="text-slate-500 hover:text-slate-300 transition-colors text-xl leading-none disabled:opacity-30"
            aria-label="Close modal"
          >×</button>
        </div>

        {/* Not connected */}
        {!isConnected && (
          <div className="text-center py-4">
            <p className="text-slate-400 text-sm mb-5">Connect your wallet to stake mUSDC and unlock this agent.</p>
            <div className="flex justify-center">
              <ConnectButton label="Connect Wallet" />
            </div>
          </div>
        )}

        {/* Wrong network */}
        {isConnected && wrongNetwork && (
          <div className="error-card p-4 text-center">
            <p className="text-red-300 text-sm font-semibold mb-1">Wrong Network</p>
            <p className="text-red-400 text-xs">Switch to <strong>Base Sepolia</strong> in your wallet.</p>
          </div>
        )}

        {/* Main flow */}
        {isConnected && !wrongNetwork && step !== "success" && (
          <>
            {/* Balance + faucet */}
            <div className="flex items-center justify-between mb-4">
              <div className="text-xs text-slate-400">
                mUSDC balance:{" "}
                <span className="text-white font-semibold">
                  {balance !== null ? `${balance} mUSDC` : "…"}
                </span>
              </div>
              <button
                className="text-xs text-cyan-400 border border-cyan-400/30 rounded-lg px-3 py-1 hover:bg-cyan-400/10 transition-colors disabled:opacity-40"
                onClick={drip}
                disabled={faucetLoading || isProcessing}
              >
                {faucetLoading ? "Dripping…" : "🚰 Get free mUSDC"}
              </button>
            </div>
            {faucetError && <p className="text-red-400 text-xs mb-3">{faucetError}</p>}
            {faucetSuccess && <p className="text-green-400 text-xs mb-3">✓ 100 mUSDC received!</p>}

            {/* Amount input */}
            <div className="mb-5">
              <label className="label-tag block mb-2">Stake amount (mUSDC)</label>
              <input
                type="number"
                min={MIN_STAKE_USDC}
                step="1"
                value={amount}
                onChange={(e) => { setAmount(e.target.value); validateAmount(e.target.value); }}
                disabled={isProcessing}
                className="input-field px-4 py-3 text-sm"
                style={{ borderRadius: 10 }}
              />
              {amountError && <p className="text-red-400 text-xs mt-1.5">{amountError}</p>}
              <p className="text-slate-600 text-xs mt-1.5">Minimum: 10 mUSDC · Lock period: 7 days</p>
            </div>

            {/* Step tracker */}
            {isProcessing && (
              <div className="flex items-center gap-2 mb-5">
                {steps.map((s, i) => {
                  const done    = i < currentStepIndex;
                  const active  = i === currentStepIndex;
                  const pending = i > currentStepIndex;
                  return (
                    <div key={s.id} className="flex items-center gap-2">
                      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        done    ? "bg-green-500/15 border border-green-500/30 text-green-400" :
                        active  ? "bg-purple-500/15 border border-purple-500/30 text-purple-300" :
                                  "bg-slate-800/60 border border-slate-700/40 text-slate-500"
                      }`}>
                        {done   && "✓ "}
                        {active && <span className="w-3 h-3 border border-purple-400/40 border-t-purple-400 rounded-full animate-spin inline-block mr-1" />}
                        {s.label}
                      </div>
                      {i < steps.length - 1 && (
                        <div className={`h-px w-4 ${done ? "bg-green-500/40" : "bg-slate-700"}`} />
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Tx hashes */}
            {approveTxHash && (
              <a
                href={basescanTx(approveTxHash)}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-cyan-400 transition-colors mb-2"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                Approve tx: {shortHash(approveTxHash)}
              </a>
            )}

            {/* Error */}
            {step === "error" && error && (
              <div className="error-card p-3 mb-4 text-sm">{error}</div>
            )}

            {/* CTA */}
            <button
              className="btn-stake w-full py-3.5 text-sm tracking-wide"
              onClick={step === "error" ? reset : handleStake}
              disabled={isProcessing || !!amountError}
              style={{ background: isProcessing ? undefined : `linear-gradient(135deg, ${agentColor}cc, ${agentColor})` }}
            >
              {isProcessing ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
                  {step === "approving"       ? "Waiting for approval…"  :
                   step === "approve_pending" ? "Confirming approval…"   :
                   step === "staking"         ? "Sending stake…"         :
                                               "Confirming stake…"}
                </span>
              ) : step === "error" ? "↺ Try Again" : `🔒 Stake ${amount} mUSDC`}
            </button>
          </>
        )}

        {/* Success */}
        {step === "success" && (
          <div className="text-center py-4 animate-fade-up">
            <div className="text-5xl mb-4">🎉</div>
            <h3 className="font-display font-bold text-white text-xl mb-2">
              {agentName} Unlocked!
            </h3>
            <p className="text-slate-400 text-sm mb-5">
              Your stake is confirmed on Base Sepolia. Agent access is now active.
            </p>
            {stakeTxHash && (
              <a
                href={basescanTx(stakeTxHash)}
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:underline mb-6"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                View on Basescan: {shortHash(stakeTxHash)}
              </a>
            )}
            <button className="btn-primary px-8 py-3 text-sm w-full" onClick={onClose}>
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}
