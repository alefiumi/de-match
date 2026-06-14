"use client";

import { useState } from "react";
import { WorkflowInput } from "@/components/WorkflowInput";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import { ResultsDashboard } from "@/components/ResultsDashboard";
import type { MatchResult } from "@/types";

export default function HomePage() {
  const [workflow, setWorkflow] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MatchResult | null>(null);

  async function findMatch() {
    if (!workflow.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workflow }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? `Server error (${res.status})`);
      }

      setResult(data.result);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Unknown error contacting oracle."
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="max-w-5xl mx-auto px-5 py-12 relative z-10">

      {/* Hero */}
      <div className="text-center mb-12">
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6"
          style={{ background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.25)" }}
        >
          <span className="text-purple-400 text-xs font-semibold tracking-wide uppercase">
            Decentralized Oracle
          </span>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <circle cx="6" cy="6" r="4" fill="#a855f7" opacity="0.5"/>
            <circle cx="6" cy="6" r="2" fill="#a855f7"/>
          </svg>
        </div>

        <h1 className="font-display text-4xl sm:text-5xl font-bold text-white mb-4 leading-tight tracking-tight">
          Find Your Perfect
          <br />
          <span
            style={{
              background: "linear-gradient(135deg,#a855f7,#22d3ee)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            AI Agent Match
          </span>
        </h1>

        <p className="text-slate-400 text-lg max-w-xl mx-auto leading-relaxed">
          Describe your workflow. Our on-chain AI oracle evaluates your needs and surfaces
          the best agent — verified by trust attestations.
        </p>
      </div>

      {/* Input */}
      <WorkflowInput
        value={workflow}
        onChange={setWorkflow}
        onSubmit={findMatch}
        isLoading={isLoading}
      />

      {/* Loading */}
      <LoadingState visible={isLoading} />

      {/* Error */}
      <ErrorState message={error} />

      {/* Results */}
      <ResultsDashboard result={result} />

    </main>
  );
}
