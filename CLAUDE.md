## Project: Clara Market Dashboard
## Stack: React 19, TypeScript (strict), Vite, TanStack Query, Tailwind CSS, Recharts

## Hard Rules — never violate these
- No `any` in TypeScript. Ever. Derive types from API shapes in src/types/coingecko.ts
- All API calls go through src/api/coingecko.ts — never fetch() inline in components
- No useEffect for data fetching — TanStack Query only
- Functional components and hooks only
- All async boundaries must have error + loading states

## Code Standards
- Named exports over default exports
- Small focused components — if it's over 150 lines, split it
- Formatters live in src/lib/formatters.ts (currency, %, human-readable market cap)
- No magic numbers — use named constants

## Rate Limit Strategy
- staleTime: 5 * 60 * 1000 on all queries (5 min)
- gcTime: 10 * 60 * 1000 (10 min)
- On 429 response, surface RateLimitError with retry button — never silently fail

## Accessibility Requirements
- Table must be keyboard navigable (arrow keys to move rows, Enter to open drawer)
- Side drawer must trap focus when open, return focus to trigger row on close
- All interactive elements must have aria-label where text is ambiguous
- Color alone must never be the only signal (24h change needs icon + color)

## Red Flags — always surface these in review
- useEffect used for data fetching
- Type assertions (as SomeType) without a comment explaining why
- Missing error boundary or loading state
- console.log left in code
- Inline styles instead of Tailwind classes