/**
 * Server-side Gemini client.
 * The API key lives ONLY in process.env — never exposed to the browser.
 */

import { AGENT_NAMES, GEMINI_MODEL, SYSTEM_PROMPT } from "@/lib/constants";
import type { MatchResult } from "@/types";

const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

interface GeminiPart {
  text?: string;
}

interface GeminiCandidate {
  content: { parts: GeminiPart[] };
}

interface GeminiResponse {
  candidates?: GeminiCandidate[];
  error?: { message: string; code: number };
}

/**
 * Calls Gemini and returns a parsed MatchResult.
 * Throws a descriptive Error on any failure.
 */
export async function callGemini(workflow: string): Promise<MatchResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured on the server.");
  }

  const url = `${GEMINI_ENDPOINT}?key=${apiKey}`;

  const body = {
    system_instruction: {
      parts: [{ text: SYSTEM_PROMPT }],
    },
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `Evaluate my workflow and recommend the best AI agent:\n\n${workflow}`,
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 1,
      maxOutputTokens: 512,
      thinkingConfig: { thinkingBudget: 0 },
      responseMimeType: "application/json",
      responseSchema: {
        type: "object",
        properties: {
          winner: {
            type: "string",
            enum: AGENT_NAMES,
          },
          matchPercentage: { type: "string" },
          reasoning: { type: "string" },
          mockTrustScore: { type: "string" },
        },
        required: ["winner", "matchPercentage", "reasoning", "mockTrustScore"],
      },
    },
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    // Vercel edge/Node: abort after 25s (well within Vercel's 30s limit)
    signal: AbortSignal.timeout(25_000),
  });

  const data: GeminiResponse = await response.json();

  if (!response.ok || data.error) {
    const msg = data.error?.message ?? `Gemini HTTP ${response.status}`;
    throw new Error(msg);
  }

  const parts = data?.candidates?.[0]?.content?.parts ?? [];
  const rawText =
    parts.find((p) => p.text && p.text.trim().length > 0)?.text ?? "";

  if (!rawText) {
    throw new Error("Empty response from Gemini oracle.");
  }

  return parseGeminiResponse(rawText);
}

/** Multi-strategy JSON extraction (handles model quirks) */
function parseGeminiResponse(raw: string): MatchResult {
  let parsed: MatchResult | undefined;

  // Strategy 1: direct parse
  try {
    parsed = JSON.parse(raw.trim()) as MatchResult;
  } catch (_) {
    // continue
  }

  // Strategy 2: strip markdown fences
  if (!parsed) {
    try {
      const stripped = raw
        .replace(/^```json\s*/im, "")
        .replace(/```\s*$/im, "")
        .replace(/^```\s*/im, "")
        .trim();
      parsed = JSON.parse(stripped) as MatchResult;
    } catch (_) {
      // continue
    }
  }

  // Strategy 3: first complete {...} block
  if (!parsed) {
    try {
      const match = raw.match(/\{[\s\S]*?\}/);
      if (match) parsed = JSON.parse(match[0]) as MatchResult;
    } catch (_) {
      // continue
    }
  }

  // Strategy 4: greedy match for largest JSON object
  if (!parsed) {
    try {
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) parsed = JSON.parse(match[0]) as MatchResult;
    } catch (_) {
      // continue
    }
  }

  if (!parsed) {
    throw new Error("Gemini returned malformed JSON — could not parse oracle response.");
  }

  // Validate required keys
  const required: (keyof MatchResult)[] = [
    "winner",
    "matchPercentage",
    "reasoning",
    "mockTrustScore",
  ];
  for (const key of required) {
    if (!parsed[key]) {
      throw new Error(`Missing field in oracle response: "${key}"`);
    }
  }

  // Normalize winner casing
  const normalizedWinner = AGENT_NAMES.find(
    (n) => n.toLowerCase() === String(parsed!.winner).toLowerCase()
  );
  if (!normalizedWinner) {
    throw new Error(`Invalid winner value: "${parsed.winner}"`);
  }
  parsed.winner = normalizedWinner;

  return parsed;
}
