/**
 * Lightweight in-memory rate limiter.
 * Good enough for a single Vercel serverless function.
 * For multi-instance deployments, swap this for Redis / Upstash.
 */

interface Window {
  count: number;
  resetAt: number;
}

const store = new Map<string, Window>();

const WINDOW_MS =
  (parseInt(process.env.RATE_LIMIT_WINDOW_S ?? "60", 10) || 60) * 1000;
const MAX_REQUESTS =
  parseInt(process.env.RATE_LIMIT_MAX ?? "10", 10) || 10;

/**
 * Returns true when the IP has exceeded the limit.
 */
export function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = store.get(ip);

  if (!entry || now > entry.resetAt) {
    store.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }

  if (entry.count >= MAX_REQUESTS) {
    return true;
  }

  entry.count++;
  return false;
}

/** Exported for tests */
export { WINDOW_MS, MAX_REQUESTS };
