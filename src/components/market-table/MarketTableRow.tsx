import type { KeyboardEvent } from "react";
import type { CoinMarket } from "../../types/coingecko";
import { formatPrice, formatPercentage, formatMarketCap } from "../../lib/formatters";
import { Sparkline } from "./Sparkline";

interface MarketTableRowProps {
  coin: CoinMarket;
  isSelected: boolean;
  onClick: () => void;
}

export function MarketTableRow({ coin, isSelected, onClick }: MarketTableRowProps) {
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
