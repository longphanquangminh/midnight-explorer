# Nocturne — Midnight Explorer

<img src="https://raw.githubusercontent.com/longphanquangminh/minhlong-responsive-portfolio/refs/heads/master/images/nocturne-banner.png" />

A privacy-first block explorer for the Midnight Network testnet.
Built with Next.js 15 (App Router) + TypeScript, it renders live blockchain data directly from the Midnight node using the Polkadot JS API over WebSockets.

---

## Table of Contents
1. Project Overview
2. Features
3. Architecture & Tech Stack
4. Pages & Routing
5. Pagination Behaviour
6. Local Setup
7. Environment Variables
8. Development Workflow
9. Production Build
10. Deploying to Vercel
11. Security & Content-Security-Policy Notes
12. Troubleshooting
13. Limitations & Future Work
14. Available NPM Scripts
15. License

---

## 1. Project Overview
Nocturne provides a clean, dark-themed UI to browse blocks, transactions and (soon) account data on the Midnight privacy testnet.

* **Live data** – all information is fetched at request time from the testnet RPC via `@polkadot/api`; no mock or indexer required.
* **Privacy-first** – zero analytics, fonts served locally, strict CSP.
* **Contest entry** – developed for Midnight’s _“Privacy-First” Enhance the Ecosystem_ challenge.

---

## 2. Features
- Latest blocks & latest transactions on the home page.
- Dedicated lists for all blocks (`/blocks`) and all transactions (`/txs`) with **Next** and **Previous** paging.
- Individual detail pages:
  - Block: `/blocks/[height]`
  - Block transactions: `/blocks/[height]/txs`
  - Transaction: `/txs/[hash]`
  - Address (stub – requires indexer): `/address/[address]`
- Search bar with smart routing (height → block, long hex → tx, else → address).
- Responsive Tailwind UI, dark mode by default.

---

## 3. Architecture & Tech Stack
| Layer | Technology |
|-------|------------|
| Front-end | Next.js 15 App Router, React Server Components, Tailwind CSS |
| Data | Custom `HttpProvider` wrapper around `@polkadot/api` WebSocket client |
| Language | TypeScript everywhere |
| Runtime | Node.js (not Edge) |
| Deployment | Vercel (works locally with any Node 18+) |
| Security | Strict CSP headers set in `next.config.ts` |

### High-level Flow
1. Client hits a route → Server Component executes in Node runtime.
2. Server Component calls `getProvider()` (singleton) → `HttpProvider` → `@polkadot/api`.
3. Data is streamed to the React tree and rendered.
4. CSP headers sent with every response.

---

## 4. Pages & Routing
| Path | Description |
|------|-------------|
| `/` | Dashboard with latest 10 blocks & 10 txs |
| `/blocks` | Paginated list of blocks (`?cursor=offset`) |
| `/blocks/[id]` | Block details |
| `/blocks/[id]/txs` | Paginated transactions of a block |
| `/txs` | Paginated list of transactions |
| `/txs/[hash]` | Transaction details |
| `/address/[address]` | Address summary (placeholder) |

---

## 5. Pagination Behaviour
- Server-side offset pagination (`pageSize = 20`).
- URL param `cursor` equals **offset** (0, 20, 40, …).
- “Next Page →” link appears when more results exist.
- “← Previous” link appears when `cursor > 0`; if `cursor <= 20` it returns to base route without query string.

---

## 6. Local Setup

```bash
git clone https://github.com/your-org/midnight-explorer.git
cd midnight-explorer
npm install
```

Create `.env.local`:

```env
# optional – defaults to public Midnight RPC if omitted
NEXT_PUBLIC_RPC_URL=wss://rpc.testnet-02.midnight.network
# leave blank until an indexer is available
NEXT_PUBLIC_INDEXER_URL=
```

> The project falls back to `wss://rpc.testnet-02.midnight.network` when `NEXT_PUBLIC_RPC_URL` is not set.

---

## 7. Environment Variables

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `NEXT_PUBLIC_RPC_URL` | no | Midnight public node | WebSocket RPC endpoint |
| `NEXT_PUBLIC_INDEXER_URL` | no | *empty* | Reserved for future GraphQL indexer |
| `USE_MOCK_DATA` | no | `undefined` (= **false**) | If set to `1` will switch to mock provider (dev only) |

---

## 8. Development Workflow

```bash
npm run dev
```

- Starts Next.js on <http://localhost:3000>.
- Hot-reloads on file change.

> Make sure the dev server prints “Connecting to Midnight RPC …” – otherwise check WebSocket connectivity or CSP errors in the console.

---

## 9. Production Build

```bash
npm run build   # next build --turbopack
npm start       # next start
```

---

## 10. Deploying to Vercel

1. **Import** the repo into Vercel.
2. Set the env vars in **Project Settings → Environment Variables**.
3. Framework Preset: **Next.js**.
4. Ensure the **Node.js runtime** is selected (Edge Functions OFF).
5. Deploy.

---

## 11. Security & Content-Security-Policy Notes
`next.config.ts` injects strict headers:

```
Content-Security-Policy:
  default-src 'self';
  style-src 'self' 'unsafe-inline';
  script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' 'unsafe-eval';
  img-src 'self' data:;
  font-src 'self';
  connect-src 'self' <RPC_URL> <INDEXER_URL>;
```

Why:
- `@polkadot/api` loads WASM crypto which internally calls `WebAssembly.instantiate` (requires `'wasm-unsafe-eval'` or fallback `'unsafe-eval'`).

---

## 12. Troubleshooting

| Symptom | Fix |
|---------|-----|
| **WASM instantiate CSP error** | Ensure `script-src` includes `'wasm-unsafe-eval' 'unsafe-eval'` and redeploy. |
| **“Server Components render” digest error** | Check server logs. Common causes: RPC offline or env vars missing. Digest is now surfaced in `/app/error.tsx`. |
| **Long loading / blank lists** | Public node may rate-limit. Try custom `NEXT_PUBLIC_RPC_URL`. |

---

## 13. Limitations & Future Work
- Address summary (`/address/[address]`) returns **404** until a GraphQL indexer or substrate indexer is available.
- Latest transactions page scans recent blocks (max 200) – deep history requires indexer.
- No charting or token balances yet.

---

## 14. Available NPM Scripts

| Command | Description |
|---------|-------------|
| `dev` | Start dev server |
| `build` | Production compile (Turbopack) |
| `start` | Run production server |
| `lint` | Run ESLint |

---

## 15. License
This project is licensed under the **Apache License 2.0**.
See [`LICENSE`](./LICENSE) for the full text.
