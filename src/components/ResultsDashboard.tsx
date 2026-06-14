"use client";

import { useEffect, useState } from "react";
import { AGENTS } from "@/lib/constants";
import { hexToRgb, mockBlockNum, mockGasPrice, mockTxHash } from "@/lib/utils";
import type { MatchResult } from "@/types";

interface Props {
  result: MatchResult | null;
}

export function ResultsDashboard({ result }: Props) {
  const [barWidth, setBarWidth] = useState(0);
  const [chainData] = useState(() => ({
    block: mockBlockNum(),
    gas: mockGasPrice(),
    tx: mockTxHash(),
  }));

  useEffect(() => {
    if (!result) return;
    const pct = parseFloat(result.matchPercentage) || 85;
    // Delay lets CSS transition fire
    const id = setTimeout(() => setBarWidth(pct), 80);
    return () => clearTimeout(id);
  }, [result]);

  if (!result) return null;

  const meta = AGENTS[result.winner] ?? AGENTS.Claude;
  const rgb = hexToRgb(meta.color);

  function stakeAction() {
    alert(
      "🔗 Simulating Web3 Transaction…\n\nApprove USDC spend → Sign message → Broadcasting…\n\n✓ Mock tx confirmed. Agent access unlocked!"
    );
  }

  return (
    <div className="animate-fade-up">

      {/* Winner card */}
      <div className="card glow-cyan p-7 mb-5">

        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <p className="label-tag mb-2">Oracle Result — Top Match</p>
            <h2 className="font-display text-3xl font-bold text-white">{result.winner}</h2>
            <p className="text-slate-400 text-sm mt-1">Recommended AI Agent</p>
          </div>
          <div
            className="agent-ring shrink-0"
            style={{
              borderColor: meta.color,
              background: `rgba(${rgb},0.1)`,
            }}
            aria-label={`${result.winner} icon`}
          >
            <span role="img" aria-hidden="true" style={{ fontSize: 28 }}>{meta.emoji}</span>
          </div>
        </div>

        {/* Match percentage bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-slate-400 text-xs">Compatibility Score</span>
            <span className="font-display font-bold text-white text-lg">{result.matchPercentage}</span>
          </div>
          <div className="match-bar-bg" role="progressbar" aria-valuenow={barWidth} aria-valuemin={0} aria-valuemax={100}>
            <div className="match-bar-fill" style={{ width: `${barWidth}%` }} />
          </div>
        </div>

        <hr className="divider mb-6" />

        {/* Reasoning */}
        <div className="mb-6">
          <p className="label-tag mb-2">Oracle Reasoning</p>
          <p className="text-slate-300 text-sm leading-relaxed">{result.reasoning}</p>
        </div>

        {/* Trust score */}
        <div className="trust-cell px-5 py-4 mb-6">
          <div className="flex items-center gap-3">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            <div>
              <p className="label-tag">On-Chain Trust Score</p>
              <p className="text-cyan-400 font-semibold text-sm mt-0.5">{result.mockTrustScore}</p>
            </div>
          </div>
        </div>

        {/* Agent comparison grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6" aria-label="Agent comparison">
          {(Object.entries(AGENTS) as [string, typeof AGENTS[keyof typeof AGENTS]][]).map(([name, agentMeta]) => {
            const isWinner = name === result.winner;
            const agentRgb = hexToRgb(agentMeta.color);
            return (
              <div
                key={name}
                className={`rounded-xl p-3 text-center ${isWinner ? "" : "opacity-40"}`}
                style={
                  isWinner
                    ? {
                        background: `rgba(${agentRgb},0.12)`,
                        border: `1px solid rgba(${agentRgb},0.35)`,
                      }
                    : {
                        background: "rgba(148,163,184,0.04)",
                        border: "1px solid rgba(148,163,184,0.1)",
                      }
                }
                aria-current={isWinner ? "true" : undefined}
              >
                <div style={{ fontSize: 22, marginBottom: 4 }}>{agentMeta.emoji}</div>
                <p
                  className="font-display text-xs font-semibold"
                  style={{ color: isWinner ? agentMeta.color : "#64748b" }}
                >
                  {name}
                </p>
                {isWinner && (
                  <p style={{ fontSize: 10, color: agentMeta.color, marginTop: 2 }}>
                    ✓ Best Match
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Stake CTA */}
        <button className="btn-stake w-full py-3.5 text-sm tracking-wide" onClick={stakeAction}>
          🔗 Stake USDC to Unlock Agent
        </button>
      </div>

      {/* Meta info bar */}
      <div className="card px-5 py-4">
        <div className="flex flex-wrap gap-4 justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="live-dot" aria-hidden="true"><span /></div>
            <span className="text-slate-400 text-xs">Attestation broadcasted to 12 peer nodes</span>
          </div>
          <div className="flex gap-3">
            <span className="text-slate-500 text-xs">
              Block: <span className="text-slate-300">#21,{chainData.block}</span>
            </span>
            <span className="text-slate-500 text-xs">
              Gas: <span className="text-slate-300">{chainData.gas} gwei</span>
            </span>
            <span className="text-slate-500 text-xs">
              Tx: <span className="text-cyan-500 text-xs">{chainData.tx}</span>
            </span>
          </div>
        </div>
      </div>

    </div>
  );
}
