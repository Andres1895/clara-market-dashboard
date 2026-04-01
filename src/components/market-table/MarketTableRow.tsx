import type { KeyboardEvent } from "react";
import type { CoinMarket } from "../../types/coingecko";
import { formatPrice, formatPercentage, formatMarketCap } from "../../lib/formatters";
import { Sparkline } from "./Sparkline";

interface MarketTableRowProps {
  coin: CoinMarket;
  isSelected: boolean;
  onClick: () => void;
  isStarred: boolean;
  onToggleStar: (id: string) => void;
}

export function MarketTableRow({ coin, isSelected, onClick, isStarred, onToggleStar }: MarketTableRowProps) {
  const isPositive = coin.price_change_percentage_24h >= 0;

  function handleKeyDown(e: KeyboardEvent<HTMLTableRowElement>) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick();
    }
  }

  return (
    <tr
      role="row"
      tabIndex={0}
      aria-selected={isSelected}
      aria-label={`${coin.name}, press Enter to view details`}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      className={`cursor-pointer border-b border-gray-100 transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 ${
        isSelected ? "bg-blue-50 hover:bg-blue-50" : ""
      }`}
    >
      {/* Star */}
      <td className="px-4 py-3">
        <button
          aria-label={isStarred ? `Unstar ${coin.name}` : `Star ${coin.name}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleStar(coin.id);
          }}
          className="flex items-center justify-center text-gray-300 hover:text-yellow-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          {isStarred ? (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-yellow-400" aria-hidden="true">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
            </svg>
          )}
        </button>
      </td>

      {/* Rank */}
      <td className="px-4 py-3 text-sm text-gray-500">{coin.market_cap_rank}</td>

      {/* Asset Name */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <img src={coin.image} alt={coin.name} className="h-8 w-8 rounded-full" />
          <div>
            <p className="text-sm font-medium text-gray-900">{coin.name}</p>
            <p className="text-xs uppercase text-gray-400">{coin.symbol}</p>
          </div>
        </div>
      </td>

      {/* Price */}
      <td className="px-4 py-3 text-sm text-gray-900">
        {formatPrice(coin.current_price)}
      </td>

      {/* 24h Change — icon + color per CLAUDE.md (never color alone) */}
      <td className={`px-4 py-3 text-sm font-medium ${isPositive ? "text-green-600" : "text-red-500"}`}>
        <span aria-hidden="true">{isPositive ? "↑" : "↓"}</span>{" "}
        {formatPercentage(coin.price_change_percentage_24h)}
      </td>

      {/* Market Cap */}
      <td className="px-4 py-3 text-sm text-gray-900">
        {formatMarketCap(coin.market_cap)}
      </td>

      {/* 7d Sparkline */}
      <td className="px-4 py-3">
        <Sparkline prices={coin.sparkline_in_7d.price} positive={isPositive} />
      </td>
    </tr>
  );
}
