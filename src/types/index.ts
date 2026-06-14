// ─────────────────────────────────────────────────────────────
// De-Match Protocol — Shared Types
// ─────────────────────────────────────────────────────────────

export type AgentName = "Claude" | "ChatGPT" | "Copilot" | "Gemini";

export interface MatchResult {
  winner: AgentName;
  matchPercentage: string; // e.g. "94%"
  reasoning: string;       // exactly 2 sentences
  mockTrustScore: string;  // e.g. "4.8/5 · 137 On-Chain Attestations"
}

export interface AgentMeta {
  emoji: string;
  color: string;         // hex
  badgeClass: string;
  label: string;
  description: string;
}

// API request / response shapes
export interface MatchRequest {
  workflow: string;
}

export interface MatchResponse {
  result: MatchResult;
}

export interface ApiError {
  error: string;
  code?: string;
}
