# De-Match Protocol

**Decentralized AI Trust Registry** — Find your perfect AI agent match.

Built with Next.js 15 (App Router) · TypeScript · Tailwind CSS · Google Gemini API · Vercel

---

## Architecture Overview

```
de-match/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── match/route.ts      ← POST /api/match  (secure, server-side)
│   │   │   └── health/route.ts     ← GET  /api/health
│   │   ├── layout.tsx              ← Root layout, fonts, metadata
│   │   ├── page.tsx                ← Home page (client component)
│   │   └── globals.css
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── WorkflowInput.tsx
│   │   ├── LoadingState.tsx
│   │   ├── ErrorState.tsx
│   │   └── ResultsDashboard.tsx
│   ├── lib/
│   │   ├── gemini.ts               ← Server-only Gemini client
│   │   ├── rate-limit.ts           ← In-memory rate limiter
│   │   ├── constants.ts            ← Agent metadata, prompts
│   │   ├── validation.ts           ← Zod schemas
│   │   └── utils.ts                ← cn(), hex helpers, mock data
│   └── types/
│       └── index.ts                ← Shared TypeScript types
├── vercel.json                     ← Security headers + redirects
├── .env.example                    ← Environment variable template
└── tailwind.config.ts
```

---

## Security Model

| Concern | Solution |
|---|---|
| **API key exposure** | `GEMINI_API_KEY` is server-only (no `NEXT_PUBLIC_` prefix). Never sent to the browser. |
| **Input injection** | Zod validation on every request. Min/max length enforced. |
| **Rate limiting** | In-memory limiter (10 req / 60 s per IP). Swap for Upstash Redis for multi-instance. |
| **Security headers** | `vercel.json` sets CSP, HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy. |
| **Error leakage** | Internal errors are logged server-side; clients receive safe generic messages. |
| **Method restriction** | `/api/match` rejects all methods except `POST`. |

---

## Local Development

### Prerequisites

- Node.js ≥ 18
- A [Gemini API key](https://aistudio.google.com/app/apikey)

### Setup

```bash
# 1. Clone / copy the project
cd de-match

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env.local
# → Edit .env.local and set GEMINI_API_KEY=your_key_here

# 4. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `GEMINI_API_KEY` | ✅ | — | Your Google Gemini API key |
| `RATE_LIMIT_WINDOW_S` | ❌ | `60` | Rate-limit window in seconds |
| `RATE_LIMIT_MAX` | ❌ | `10` | Max requests per window per IP |

---

## Deploying to Vercel

### 1. Push to GitHub / GitLab

```bash
git init
git add .
git commit -m "feat: initial De-Match Protocol"
git remote add origin https://github.com/YOUR_ORG/de-match.git
git push -u origin main
```

### 2. Import on Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your repository
3. Framework preset: **Next.js** (auto-detected)

### 3. Set Environment Variables

In Vercel Dashboard → Settings → Environment Variables:

| Key | Value | Environments |
|---|---|---|
| `GEMINI_API_KEY` | `your_key_here` | Production, Preview, Development |

> ⚠️ Never set `NEXT_PUBLIC_GEMINI_API_KEY` — that would expose it to the browser.

### 4. Deploy

Click **Deploy**. Vercel will:
- Build the Next.js app
- Apply security headers from `vercel.json`
- Serve the API route as a serverless function

### Verify deployment

```bash
# Health check
curl https://your-app.vercel.app/api/health

# Should return:
# {"status":"ok","timestamp":"...","geminiConfigured":true}
```

---

## API Reference

### `POST /api/match`

Evaluates a workflow description and returns the recommended AI agent.

**Request**
```json
{ "workflow": "I need to review confidential legal contracts and integrate with Word…" }
```

**Success response (200)**
```json
{
  "result": {
    "winner": "Claude",
    "matchPercentage": "94%",
    "reasoning": "Claude excels at nuanced reasoning over long confidential documents. Its safety features and deep reasoning capability make it ideal for legal workflows.",
    "mockTrustScore": "4.8/5 · 137 On-Chain Attestations"
  }
}
```

**Error responses**

| Status | `code` | Meaning |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Workflow too short, too long, or missing |
| 429 | `RATE_LIMITED` | Too many requests from this IP |
| 500 | `MISCONFIGURED` | `GEMINI_API_KEY` not set on server |
| 502 | `ORACLE_ERROR` | Gemini API unavailable or returned bad data |

---

## Upgrading the Rate Limiter

The default in-memory limiter works for a single serverless instance. For production multi-region deployments, replace `src/lib/rate-limit.ts` with [Upstash Redis](https://upstash.com/):

```bash
npm install @upstash/ratelimit @upstash/redis
```

```ts
// src/lib/rate-limit.ts (Upstash version)
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "60 s"),
});

export async function isRateLimited(ip: string): Promise<boolean> {
  const { success } = await ratelimit.limit(ip);
  return !success;
}
```

Add `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` to your Vercel environment variables.

---

## Scripts

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run start        # Start production server locally
npm run lint         # ESLint
npm run type-check   # TypeScript type check (no emit)
```
