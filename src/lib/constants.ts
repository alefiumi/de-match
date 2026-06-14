import type { AgentMeta, AgentName } from "@/types";

export const AGENTS: Record<AgentName, AgentMeta> = {
  Claude: {
    emoji: "⚗️",
    color: "#a855f7",
    badgeClass: "badge-claude",
    label: "Claude",
    description: "Nuanced reasoning · Long docs · Safety · Coding",
  },
  ChatGPT: {
    emoji: "🤖",
    color: "#34d399",
    badgeClass: "badge-chatgpt",
    label: "ChatGPT",
    description: "General tasks · Plugins · Broad knowledge",
  },
  Copilot: {
    emoji: "🧑‍✈️",
    color: "#60a5fa",
    badgeClass: "badge-copilot",
    label: "Copilot",
    description: "Microsoft 365 · Enterprise Office · Windows",
  },
  Gemini: {
    emoji: "💎",
    color: "#fbbf24",
    badgeClass: "badge-gemini",
    label: "Gemini",
    description: "Google Workspace · Multimodal · Real-time web",
  },
};

export const AGENT_NAMES = Object.keys(AGENTS) as AgentName[];

// ── Gemini API ──────────────────────────────────────────────
export const GEMINI_MODEL = "gemini-2.5-flash";

export const SYSTEM_PROMPT = `You are an expert AI agent evaluator for a decentralized trust registry called De-Match Protocol.
Evaluate which of these four AI agents is the BEST fit for the user's described workflow:
- Claude (by Anthropic): best for nuanced reasoning, long documents, safety, writing quality, coding, confidentiality
- ChatGPT (by OpenAI): best for general tasks, broad knowledge, plugins/integrations, consumer familiarity, code
- Copilot (by Microsoft): best for Microsoft 365 integration, enterprise Office workflows, Windows, corporate IT
- Gemini (by Google): best for Google Workspace, multimodal tasks, real-time web search, Android/Google ecosystem

You MUST respond with ONLY a valid JSON object. No markdown, no code fences, no extra text before or after.
The JSON must contain exactly these four keys:
- "winner": one of exactly "Claude", "ChatGPT", "Copilot", or "Gemini"
- "matchPercentage": a string like "94%" (number 80-99 followed by %)
- "reasoning": exactly 2 sentences explaining why this agent is the best fit
- "mockTrustScore": a Web3 style string like "4.8/5 · 137 On-Chain Attestations"`;

// ── Validation ──────────────────────────────────────────────
export const MAX_WORKFLOW_LENGTH = 2000;
export const MIN_WORKFLOW_LENGTH = 10;
