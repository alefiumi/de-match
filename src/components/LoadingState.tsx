"use client";

import { useEffect, useState } from "react";

const LOADING_MSGS = [
  "Broadcasting to peer nodes",
  "Sampling 12 oracle validators",
  "Cross-referencing trust graph",
  "Aggregating attestations",
  "Finalizing consensus score",
];

interface Props {
  visible: boolean;
}

export function LoadingState({ visible }: Props) {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    if (!visible) {
      setMsgIndex(0);
      return;
    }
    const id = setInterval(() => {
      setMsgIndex((i) => (i + 1) % LOADING_MSGS.length);
    }, 1400);
    return () => clearInterval(id);
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="card p-8 text-center mb-6" role="status" aria-live="polite" aria-label="Loading">
      <div className="flex flex-col items-center gap-4">
        <div
          className="w-12 h-12 rounded-full border-2 border-purple-500/20 border-t-purple-500 animate-spin"
          aria-hidden="true"
        />
        <div>
          <p className="font-display font-semibold text-white mb-1">
            Querying Decentralized AI Oracle…
          </p>
          <p className="text-slate-400 text-sm" aria-live="polite">
            {LOADING_MSGS[msgIndex]}
          </p>
        </div>
        <div className="flex gap-2 mt-1">
          <div className="px-2 py-1 rounded text-xs" style={{ background: "rgba(34,211,238,0.1)", color: "#22d3ee" }}>
            ✓ Input validated
          </div>
          <div className="px-2 py-1 rounded text-xs" style={{ background: "rgba(168,85,247,0.1)", color: "#a855f7" }}>
            ⟳ Oracle consensus
          </div>
          <div className="px-2 py-1 rounded text-xs" style={{ background: "rgba(148,163,184,0.06)", color: "#64748b" }}>
            ◌ Result attestation
          </div>
        </div>
      </div>
    </div>
  );
}
