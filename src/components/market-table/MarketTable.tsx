import { useState, type KeyboardEvent } from "react";
import type { CoinMarket } from "../../types/coingecko";
import { SkeletonRow } from "../ui/SkeletonRow";
import { EmptyState } from "../ui/EmptyState";
import { RateLimitBanner } from "../ui/RateLimitBanner";
import { MarketTableHeader, type SortKey, type SortDir } from "./MarketTableHeader";
import { MarketTableRow } from "./MarketTableRow";

const SKELETON_ROW_COUNT = 8;

interface MarketTableProps {
  coins: CoinMarket[];
  selectedId?: string | null;
  onRowClick: (id: string) => void;
  loading?: boolean;
  isRateLimited?: boolean;
  onRetry?: () => void;
  lastUpdatedAt?: number;
}

export function MarketTable({
  coins,
  selectedId = null,
  onRowClick,
  loading = false,
  isRateLimited = false,
  onRetry = () => {},
  lastUpdatedAt,
}: MarketTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("market_cap_rank");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [searchQuery, setSearchQuery] = useState("");

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const filtered = coins.filter((coin) => {
    const q = searchQuery.toLowerCase();
    return coin.name.toLowerCase().includes(q) || coin.symbol.toLowerCase().includes(q);
  });

  const sorted = [...filtered].sort((a, b) => {
    const dir = sortDir === "asc" ? 1 : -1;
    if (sortKey === "name") {
      return a.name.localeCompare(b.name) * dir;
    }
    return (a[sortKey] - b[sortKey]) * dir;
  });

  function handleTbodyKeyDown(e: KeyboardEvent<HTMLTableSectionElement>) {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    const rows = Array.from(e.currentTarget.querySelectorAll<HTMLElement>('[role="row"]'));
    const activeIndex = rows.indexOf(document.activeElement as HTMLElement);
    if (activeIndex === -1) return;
    const nextIndex = e.key === "ArrowDown" ? activeIndex + 1 : activeIndex - 1;
    rows[nextIndex]?.focus();
  }

  return (
    <div className="flex flex-col gap-3">
      {isRateLimited && <RateLimitBanner onRetry={onRetry} />}

      <div className="flex items-center gap-4">
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name or symbol…"
          aria-label="Filter coins by name or symbol"
          className="w-full max-w-sm rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {lastUpdatedAt != null && lastUpdatedAt > 0 && (
          <span className="whitespace-nowrap text-xs text-gray-400" aria-live="polite">
            Updated {new Date(lastUpdatedAt).toLocaleTimeString()}
          </span>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table role="table" className="w-full border-collapse text-left">
          <MarketTableHeader sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
          <tbody onKeyDown={handleTbodyKeyDown}>
            {loading
              ? Array.from({ length: SKELETON_ROW_COUNT }, (_, i) => <SkeletonRow key={i} />)
              : isRateLimited && coins.length === 0
                ? (
                  <tr role="row">
                    <td colSpan={6}>
                      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                        <span className="text-4xl" aria-hidden="true">⚠</span>
                        <p className="text-base font-medium text-gray-800">No market data available</p>
                        <p className="text-sm text-gray-500">Use the retry button above to reload</p>
                      </div>
                    </td>
                  </tr>
                )
              : sorted.length === 0 && searchQuery
                ? (
                  <tr role="row">
                    <td colSpan={6}>
                      <EmptyState query={searchQuery} />
                    </td>
                  </tr>
                )
                : sorted.map((coin) => (
                  <MarketTableRow
                    key={coin.id}
                    coin={coin}
                    isSelected={coin.id === selectedId}
                    onClick={() => onRowClick(coin.id)}
                  />
                ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
