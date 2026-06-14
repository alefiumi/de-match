"use client";

import { MAX_WORKFLOW_LENGTH } from "@/lib/constants";

interface Props {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

const AGENT_BADGES = [
  { label: "Claude",  cls: "badge-claude"  },
  { label: "ChatGPT", cls: "badge-chatgpt" },
  { label: "Copilot", cls: "badge-copilot" },
  { label: "Gemini",  cls: "badge-gemini"  },
];

export function WorkflowInput({ value, onChange, onSubmit, isLoading }: Props) {
  const charCount = value.length;
  const nearLimit = charCount > MAX_WORKFLOW_LENGTH * 0.8;

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && e.ctrlKey) {
      e.preventDefault();
      onSubmit();
    }
  }

  return (
    <div className="card glow-purple p-7 mb-6">
      <div className="flex items-center gap-2 mb-5">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
        </svg>
        <span className="font-display font-semibold text-white text-sm">Oracle Query Interface</span>
      </div>

      <label htmlFor="workflow-input" className="label-tag block mb-2">
        Describe your workflow &amp; data requirements
      </label>

      <textarea
        id="workflow-input"
        className="input-field p-4 mb-1"
        rows={5}
        placeholder="e.g. I need to build a legal document review pipeline that handles confidential contracts, requires deep reasoning, stays up-to-date with case law, and integrates with Microsoft 365 tools…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        maxLength={MAX_WORKFLOW_LENGTH}
        disabled={isLoading}
        aria-describedby="char-count"
      />

      <div className="flex justify-between items-center mb-5">
        <p id="char-count" className={`text-xs ${nearLimit ? "text-amber-400" : "text-slate-600"}`}>
          {charCount} / {MAX_WORKFLOW_LENGTH}
        </p>
        <p className="text-xs text-slate-600 hidden sm:block">Ctrl + Enter to submit</p>
      </div>

      {/* Agent chips */}
      <div className="flex flex-wrap gap-2 mb-5">
        <span className="label-tag mr-1 self-center">Evaluating:</span>
        {AGENT_BADGES.map(({ label, cls }) => (
          <span key={label} className={`px-3 py-1 rounded-full text-xs font-medium ${cls}`}>
            {label}
          </span>
        ))}
      </div>

      <button
        className="btn-primary w-full py-3.5 text-sm"
        onClick={onSubmit}
        disabled={isLoading || charCount < 10}
        aria-busy={isLoading}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-purple-300/30 border-t-purple-400 rounded-full animate-spin" aria-hidden="true" />
            Querying Oracle…
          </span>
        ) : (
          "⚡ Find My Agent Match"
        )}
      </button>
    </div>
  );
}
