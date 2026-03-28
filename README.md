# Clara Market Dashboard
 
Real-time crypto market data for the top 20 coins by market cap.
 
**Live:** https://clara-market-dashboard.vercel.app
 
---
 
## Run locally
 
```bash
git clone https://github.com/YOUR_USERNAME/clara-market-dashboard
cd clara-market-dashboard
npm install       # also installs git hooks automatically
npm run dev       # http://localhost:5173
```
 
That's it. No env vars, no API keys — CoinGecko's public endpoints are used directly.
 
---
 
## What it does
 
- **Market table** — top 20 coins by market cap, sortable by any column, filterable by name or symbol in real time, auto-refreshes every 60s
- **Asset drawer** — click any row to open a side panel with ATH, ATL, 7-day price chart, and description. State lives in the URL (`?coin=bitcoin`) so it survives a refresh
- **Loading** — skeleton rows while data fetches
- **Rate limit handling** — if CoinGecko returns 429, a banner appears with a retry button
- **Empty state** — when search returns nothing
 
---
 
## Technical decisions
 
**Vite over CRA** — CRA is deprecated and Vite's dev server is significantly faster. No real tradeoff here.
 
**Side drawer over modal** — modals are one of the worst patterns for WCAG AA compliance. A drawer keeps the table visible for context, handles focus trap more naturally, and feels more native to a data dashboard. The drawer state lives in a URL param so it's shareable and refresh-safe.
 
**TanStack Query for everything** — all data fetching goes through React Query with `staleTime: 5min`. This is the first line of defense against CoinGecko's rate limit: the same coin detail won't re-fetch for 5 minutes even if you close and reopen the drawer. The 429 error is caught as a typed `RateLimitError` and surfaced separately from generic errors so the UI can show the right message.
 
**Types before components** — the first Claude Code session derived all TypeScript types directly from the live CoinGecko API response before any components were written. This meant the type system caught shape mismatches at the boundary, not inside components. No `any` anywhere in the codebase.
 
**Formatters in one place** — all number formatting (price, market cap, percentage, date) lives in `src/lib/formatters.ts` using `Intl.NumberFormat`. Every component pulls from there — no inline formatting scattered across files.
 
---
 
## How I used AI in this project
 
I used Claude Code as a structured pair programmer, not as an autocomplete tool. Before writing any code I drafted a `SPEC.md` and a `CLAUDE.md` that encoded my standards (no `any`, TanStack Query only for fetching, named exports, Tailwind only) so every Claude session started with those constraints already enforced.
 
I also used Google Stitch to mock the UI before touching any components [Project link for your reference](https://stitch.withgoogle.com/projects/257570273185129988?pli=1) — drawer layout, table columns, error states, empty states — so I had a visual contract to code against.
 
My workflow for each feature was: write a focused prompt in plan mode first, review the proposed approach before any code was written, then let Claude implement. I did manual reviews after each session — the main things I caught and fixed were the drawer not closing on Escape, the 24h change icon missing on the WCAG side (color alone wasn't enough), and the rate limit banner not being wired up to the real `isRateLimited` state from the hook.
 
I also run git hooks on every project — a `pre-commit` hook that enforces [Conventional Commits](https://www.conventionalcommits.org/) format and blocks oversized commits, and a `post-commit` hook that runs Claude headlessly to auto-update `docs/CHANGELOG.md` and `docs/JOURNEY.md` after each commit. These are checked into `scripts/hooks/` and installed automatically on `npm install` via the `prepare` script, so they'd work for any team member who clones the repo.
 
---
 
## Project structure
 
```
src/
  api/            — all CoinGecko fetch calls, typed, one place
  components/
    market-table/ — MarketTable, MarketTableRow, Sparkline
    asset-detail/ — AssetDrawer, PriceChart, AssetDescription
    ui/           — SkeletonRow, RateLimitBanner, EmptyState
  hooks/          — useMarketData, useCoinDetail, usePriceHistory
  lib/            — formatters (price, %, market cap, date)
  types/          — all CoinGecko API response types
docs/
  CHANGELOG.md    — auto-updated after every commit
  JOURNEY.md      — narrative of every decision made during development
```
 