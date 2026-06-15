# De-Match Protocol

**Decentralized AI Trust Registry** — Find your perfect AI agent match, then stake mUSDC on-chain to unlock it.

Built with **Next.js 15** · **TypeScript** · **Tailwind CSS** · **RainbowKit** · **wagmi v2** · **viem** · **Hardhat** · **Base Sepolia** · **Vercel**

---

## Architecture Overview

```
de-match/
├── contracts/                        ← Hardhat project (deploy separately)
│   ├── contracts/
│   │   ├── MockUSDC.sol              ← ERC-20 faucet token (6 decimals)
│   │   └── DeMatchStaking.sol        ← approve → stake → unlock flow
│   ├── scripts/deploy.ts             ← Deploy both contracts to Base Sepolia
│   └── hardhat.config.ts
│
└── src/                              ← Next.js App Router
    ├── app/
    │   ├── api/match/route.ts        ← POST /api/match (Gemini, server-side)
    │   ├── layout.tsx                ← Web3Provider wraps everything
    │   └── page.tsx
    ├── components/
    │   ├── Web3Provider.tsx          ← wagmi + RainbowKit + React Query
    │   ├── Header.tsx                ← RainbowKit ConnectButton
    │   ├── StakeButton.tsx           ← Full approve→stake UI with all states
    │   └── ResultsDashboard.tsx
    ├── hooks/
    │   └── useStake.ts               ← approve → stake orchestration hook
    └── lib/web3/
        ├── wagmi.ts                  ← wagmi config (Base Sepolia only)
        └── contracts.ts              ← Addresses + ABIs + AGENT_ID enum
```

---

## Quick Start

### Prerequisites

- Node.js ≥ 18
- A [Gemini API key](https://aistudio.google.com/app/apikey)
- A [WalletConnect Project ID](https://cloud.walletconnect.com) (free)
- MetaMask (or any EVM wallet) with Base Sepolia configured

### 1. Install & configure

```bash
cp .env.example .env.local
# Fill in GEMINI_API_KEY and NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
npm install
npm run dev
```

### 2. Deploy contracts (Base Sepolia)

```bash
cd contracts
cp .env.example .env
# Fill in DEPLOYER_PRIVATE_KEY (needs Base Sepolia ETH)
# Get free ETH: https://faucet.quicknode.com/base/sepolia
npm install
npm run deploy:sepolia
```

The script prints the deployed addresses. Copy them into `src/lib/web3/contracts.ts`:

```ts
export const CONTRACT_ADDRESSES = {
  MOCK_USDC: "0xYOUR_MOCK_USDC_ADDRESS",
  STAKING:   "0xYOUR_STAKING_ADDRESS",
};
```

Then redeploy to Vercel (or restart the dev server).

---

## On-Chain Flow

The stake panel in the UI walks users through two transactions:

```
User
 │
 ├─ 1. MockUSDC.approve(stakingContract, 10_000_000)
 │      → MetaMask / WalletConnect prompt
 │      → Wait for confirmation on Base Sepolia
 │
 └─ 2. DeMatchStaking.stake(agentId, 10_000_000)
        → Pulls mUSDC via transferFrom
        → Records stake with 7-day lock
        → Emits Staked + AgentUnlocked events
        → UI shows "Agent Unlocked!" + Basescan link
```

If the user has no mUSDC, a **"Claim from Faucet"** button calls `MockUSDC.faucet()` to drip 100 mUSDC (1 hr cooldown).

---

## Environment Variables

### Next.js app (`/.env.local`)

| Variable | Side | Required | Description |
|---|---|---|---|
| `GEMINI_API_KEY` | Server | ✅ | Gemini API key — never sent to browser |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | Client | ✅ | WalletConnect Project ID |
| `RATE_LIMIT_WINDOW_S` | Server | ❌ | Rate-limit window in seconds (default: 60) |
| `RATE_LIMIT_MAX` | Server | ❌ | Max requests per window per IP (default: 10) |

### Contracts (`/contracts/.env`)

| Variable | Required | Description |
|---|---|---|
| `DEPLOYER_PRIVATE_KEY` | ✅ | Private key for deployment wallet |
| `BASE_SEPOLIA_RPC` | ❌ | Custom RPC (default: `https://sepolia.base.org`) |
| `BASESCAN_API_KEY` | ❌ | For contract verification on Basescan |

---

## Deploying to Vercel

1. Push to GitHub
2. Import on [vercel.com/new](https://vercel.com/new)
3. Add environment variables in **Settings → Environment Variables**:
   - `GEMINI_API_KEY`
   - `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`
4. Deploy — security headers applied automatically from `vercel.json`

---

## Security

| Concern | Solution |
|---|---|
| API key exposure | `GEMINI_API_KEY` is server-only. Never sent to the browser. |
| Input injection | Zod validation on every `/api/match` request. |
| Rate limiting | In-memory per-IP limiter. Swap for Upstash Redis for multi-region. |
| Security headers | CSP, HSTS, X-Frame-Options, Referrer-Policy via `vercel.json`. |
| Contract safety | `ReentrancyGuard`, `SafeERC20`, `Ownable`. Minimum stake enforced. |
| Wrong network | UI detects chain ID and blocks staking if not on Base Sepolia. |

---

## Contract Reference

### MockUSDC

| Function | Description |
|---|---|
| `faucet()` | Drips 100 mUSDC to caller (1 hr cooldown) |
| `approve(spender, amount)` | Standard ERC-20 approve |
| `balanceOf(address)` | Standard ERC-20 balance |

### DeMatchStaking

| Function | Description |
|---|---|
| `stake(agentId, amount)` | Pull mUSDC from caller, record stake, unlock agent |
| `withdraw(stakeIndex)` | Return mUSDC after 7-day lock period |
| `hasActiveStake(staker, agentId)` | Check if address has active stake for agent |
| `stakeCount(staker)` | Number of stakes for address |

Agent IDs: `0 = Claude`, `1 = ChatGPT`, `2 = Copilot`, `3 = Gemini`

---

## Scripts

```bash
# Next.js
npm run dev          # Start dev server
npm run build        # Production build
npm run type-check   # TypeScript check

# Contracts (from /contracts)
npm run compile      # Compile Solidity
npm run test         # Run Hardhat tests
npm run deploy:sepolia  # Deploy to Base Sepolia
npm run node         # Local Hardhat node
```
