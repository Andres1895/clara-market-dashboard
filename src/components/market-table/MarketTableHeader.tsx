export type SortKey =
  | "market_cap_rank"
  | "name"
  | "current_price"
  | "price_change_percentage_24h"
  | "market_cap";

export type SortDir = "asc" | "desc";

interface Column {
  label: string;
  key: SortKey | null;
}

const COLUMNS: Column[] = [
  { label: "#", key: "market_cap_rank" },
  { label: "Asset Name", key: "name" },
  { label: "Price", key: "current_price" },
  { label: "24h Change", key: "price_change_percentage_24h" },
  { label: "Market Cap", key: "market_cap" },
  { label: "7d Trend", key: null },
];

interface MarketTableHeaderProps {
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (key: SortKey) => void;
}

export function MarketTableHeader({ sortKey, sortDir, onSort }: MarketTableHeaderProps) {
  return (
    <thead>
      <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
        {COLUMNS.map((col) => {
          const isActive = col.key !== null && col.key === sortKey;
          const ariaSort = col.key === null
            ? undefined
            : isActive
              ? sortDir === "asc" ? "ascending" : "descending"
              : "none";

          return (
            <th
              key={col.label}
              role="columnheader"
              aria-sort={ariaSort}
              className={`px-4 py-3 ${col.key !== null ? "cursor-pointer select-none hover:text-gray-800" : ""}`}
              onClick={col.key !== null ? () => onSort(col.key!) : undefined}
            >
              <span className="inline-flex items-center gap-1">
                {col.label}
                {isActive && (
                  <span aria-hidden="true">{sortDir === "asc" ? "▲" : "▼"}</span>
                )}
              </span>
            </th>
          );
        })}
      </tr>
    </thead>
  );
}
