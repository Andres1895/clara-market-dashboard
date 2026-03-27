# Documentation Agent — Rules & Standards

## Scope
Only document **exported** symbols. Internal helpers, private functions, and
implementation details should not have JSDoc unless they are complex enough
to warrant explanation.

## JSDoc Format (Functions & Hooks)
```ts
/**
 * One sentence describing what it does (not how).
 * Second sentence only if the first is insufficient.
 *
 * @param paramName - Description of what it represents
 * @returns Description of the return value
 *
 * @example
 * const result = myFunction('arg')
 * // result: { id: 1, name: 'example' }
 */
```

## React Components
Document props interfaces, not the component function itself unless it has
non-obvious behavior (portals, forwarded refs, context providers).

```ts
/**
 * Props for the MarketTable component.
 */
interface MarketTableProps {
  /** List of coins to display. */
  coins: CoinMarket[]
  /** Called when a row is clicked. Receives the coin id. */
  onRowClick: (id: string) => void
  /** Optional column to sort by on initial render. Defaults to 'market_cap_rank'. */
  defaultSortKey?: SortKey
}
```

## COMPONENTS.md Format
```markdown
## ComponentName
**File:** `src/components/path/ComponentName.tsx`
**Props:**
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| prop | type | yes/no   | -       | description |

**Usage:**
\`\`\`tsx
<ComponentName prop="value" />
\`\`\`
```

## API.md Format
```markdown
## functionName(params)
**File:** `src/api/coingecko.ts`
**Returns:** `Promise<ReturnType>`

| Param | Type | Description |
|-------|------|-------------|
| param | type | description |

**Example:**
\`\`\`ts
const data = await functionName(param)
\`\`\`
```

## CHANGELOG.md Format
One line per commit, prepended to the file (newest first):
```
- [2025-01-15 14:32] Add useCoinDetail hook with 429 retry logic
- [2025-01-15 13:10] Add CoinMarket and SparklineData types
```

## Rules
- Never write docs that just restate the function signature
- Prefer documenting WHY over WHAT when the code is self-explanatory
- If a type is already self-documenting (e.g. `isLoading: boolean`), skip it
- Never touch test files, config files, or anything outside src/ and docs/
- Max 3 lines of JSDoc per symbol — if it needs more, the code needs refactoring
