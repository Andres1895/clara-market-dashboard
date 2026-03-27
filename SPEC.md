# Clara Market Dashboard — Spec

## Problem Statement
A responsive crypto dashboard showing top 20 coins by market cap,
with real-time refresh and per-asset detail exploration.

## Assumptions
- CoinGecko free tier (~10-30 req/min) — caching is a constraint, not an afterthought
- No auth required
- No persistence needed — all state is ephemeral or URL-driven
- Mobile responsiveness required (responsive = works, not pixel-perfect on mobile)

## Out of Scope
- No persistence across sessions (no localStorage, no backend storage)
- TanStack Query in-memory cache IS used — aggressively — to minimize API calls
  within a session (staleTime: 5min on all queries)
  
## Key Architectural Decisions
1. Vite over CRA — faster dev server, not deprecated
2. Side drawer over modal — preserves table context, stronger dashboard UX,
   demonstrates correct WCAG focus management
3. TanStack Query for all data fetching — staleTime as first rate-limit defense,
   graceful 429 handling as fallback

## Definition of Done
- [ ] Table renders top 20, sortable by all columns, filterable by name/symbol
- [ ] Sparkline visible per row
- [ ] Auto-refresh every 60s without reload
- [ ] Side drawer opens on row click with detail + 7d chart
- [ ] Skeleton loaders on all async boundaries
- [ ] 429 error shows friendly message + retry button
- [ ] Empty search state handled
- [ ] Keyboard navigable table (arrow keys, Enter to open drawer)
- [ ] WCAG AA contrast passes
- [ ] Zero `any` in TypeScript