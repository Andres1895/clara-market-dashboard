# Plan: Starred Assets with localStorage Persistence

## What already exists that's relevant

- **`MarketTable.tsx`** — owns `sortKey`, `sortDir`, `searchQuery` state; applies filter then sort before rendering rows. This is where pinned rows need to be hoisted to the top.
- **`MarketTableRow.tsx`** — renders each coin row with 6 columns (rank, name, price, 24h, market cap, sparkline). The star icon will live here as a new first column.
- **`MarketTableHeader.tsx`** — defines the `COLUMNS` array and renders `<th>` elements with sort controls. Needs a new non-sortable star column header.
- **No localStorage hooks exist yet** — needs to be created from scratch.
- **No constants file** — constants live per-file; the localStorage key should be a named constant inside the new hook.

---

## Files to create

### `src/hooks/useStarredAssets.ts`
Custom hook that encapsulates all localStorage interaction.

```
useStarredAssets()
  → starredIds: Set<string>
  → toggleStar: (id: string) => void
  → isStarred: (id: string) => boolean
```

- Read from `localStorage.getItem("starred_assets")` on init (parse JSON array → Set).
- `toggleStar` adds or removes an id, then writes the updated Set back as a JSON array.
- Use `useState` initializer (not `useEffect`) so the read is synchronous and there's no flash.
- Named export only.
- localStorage key as a named constant: `STARRED_ASSETS_KEY = "starred_assets"`.

---

## Files to modify

### `src/components/market-table/MarketTable.tsx`
1. Call `useStarredAssets()` inside the component.
2. After the existing sort step, partition the result into `pinned` (starred) and `unpinned`, then concatenate: `[...pinned, ...unpinned]`. Pinned coins are sorted among themselves using the active sort; unpinned the same. This preserves user sort intent within each group.
3. Pass `starredIds`, `toggleStar` (or `isStarred` + `toggleStar`) down to `MarketTableRow` via props.
4. No change to the keyboard navigation logic — it already operates on the rendered rows.

### `src/components/market-table/MarketTableRow.tsx`
1. Add `isStarred: boolean` and `onToggleStar: (id: string) => void` to the props interface.
2. Add a new first `<td>` containing a star button:
   - `<button>` with `aria-label="Star {coin.name}"` / `"Unstar {coin.name}"` depending on state.
   - Filled star (★) when starred, outline star (☆) when not — or use an SVG icon consistent with the existing design.
   - `onClick` calls `onToggleStar(coin.id)` and stops event propagation so it doesn't also trigger the row's `onRowClick`.
   - Tailwind classes for color: `text-yellow-400` when starred, `text-gray-300 hover:text-yellow-300` when not.
3. Keep the row's existing `onClick`/keyboard handler for drawer navigation unchanged.

### `src/components/market-table/MarketTableHeader.tsx`
1. Prepend a new entry to `COLUMNS` (or add it separately before the map):
   ```ts
   { label: "★", key: null }  // Not sortable, aria-label="Starred"
   ```
2. Render it as a non-interactive `<th>` with `aria-label="Starred"` and `scope="col"`.

---

## Risks and decisions to make

### 1. Sort behavior for pinned rows — within-group vs. flat
**Decision needed:** Should starred coins be sorted among themselves by the active sort key, or should they always appear in a fixed order (e.g., order they were starred)?

The plan above sorts within each group using the same active sort key. This is the most intuitive UX. **Alternative:** preserve starring order (requires storing an ordered array instead of a Set, and using `.indexOf()` for the within-group order). Pick one before implementing.

### 2. Starred coins that scroll off the data set
The API always returns the same 20 coins. If in the future the list changes (e.g., pagination or coin rotation), a stored ID that no longer appears in the current data will simply produce no pinned row — no crash, no stale data. No special handling needed now, but worth noting.

### 3. Star button click vs. row click — event propagation
The star button sits inside a clickable row. `event.stopPropagation()` on the button's `onClick` is required. Keyboard: the star button will naturally receive focus and respond to Enter/Space independently since it's a `<button>`. No extra keyboard wiring needed.

### 4. localStorage read failure (corrupted data)
Wrap the `JSON.parse` in a try/catch and fall back to an empty Set. Do not surface an error to the user — silent fallback is correct here since it's non-critical UI state.

### 5. Column count alignment
Adding a new first column changes the `colspan` of any existing full-width cells (e.g., the "no results" empty state or skeleton rows). Check `EmptyState.tsx` and `SkeletonRow.tsx` for hardcoded `colSpan` values and increment them by 1.

### 6. Accessibility for the star button inside a keyboard-navigable row
The row has arrow-key navigation. The star `<button>` inside the row will participate in the tab order. Consider whether the star button should be reachable via Tab (normal tab stop) or only via the row's arrow-key nav. Simplest compliant approach: leave it as a normal tab stop — screen reader users expect buttons to be focusable.
