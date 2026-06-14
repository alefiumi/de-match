/**
 * POST /api/match
 *
 * Receives a workflow description, calls Gemini server-side,
 * and returns the recommended AI agent.
 *
 * Security checklist:
 *  ✓ API key never sent to browser
 *  ✓ Input validated with Zod
 *  ✓ Rate-limited per IP
 *  ✓ Only POST allowed
 *  ✓ Errors never leak internal details to the client
 */

import { NextRequest, NextResponse } from "next/server";
import { callGemini } from "@/lib/gemini";
import { isRateLimited } from "@/lib/rate-limit";
import { matchRequestSchema } from "@/lib/validation";
import type { ApiError, MatchResponse } from "@/types";

export const runtime = "nodejs"; // use Node runtime for full fetch + AbortSignal support

export async function POST(req: NextRequest): Promise<NextResponse<MatchResponse | ApiError>> {
  // ── 1. Rate limiting ────────────────────────────────────────
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json<ApiError>(
      { error: "Too many requests. Please wait a moment and try again.", code: "RATE_LIMITED" },
      { status: 429 }
    );
  }

  // ── 2. Parse + validate body ────────────────────────────────
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json<ApiError>(
      { error: "Invalid JSON body.", code: "BAD_REQUEST" },
      { status: 400 }
    );
  }

  const parsed = matchRequestSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.errors[0]?.message ?? "Invalid request.";
    return NextResponse.json<ApiError>(
      { error: message, code: "VALIDATION_ERROR" },
      { status: 400 }
    );
  }

  // ── 3. Call Gemini (server-side, key never exposed) ─────────
  try {
    const result = await callGemini(parsed.data.workflow);
    return NextResponse.json<MatchResponse>({ result }, { status: 200 });
  } catch (err: unknown) {
    // Log full error server-side; return safe message to client
    console.error("[/api/match] Gemini error:", err);

    const isServerMisconfigured =
      err instanceof Error &&
      err.message.includes("GEMINI_API_KEY is not configured");

    return NextResponse.json<ApiError>(
      {
        error: isServerMisconfigured
          ? "Server configuration error. Contact the administrator."
          : "Oracle temporarily unavailable. Please try again.",
        code: isServerMisconfigured ? "MISCONFIGURED" : "ORACLE_ERROR",
      },
      { status: isServerMisconfigured ? 500 : 502 }
    );
  }
}

// Reject all other methods
export async function GET(): Promise<NextResponse<ApiError>> {
  return NextResponse.json<ApiError>(
    { error: "Method not allowed.", code: "METHOD_NOT_ALLOWED" },
    { status: 405 }
  );
}
