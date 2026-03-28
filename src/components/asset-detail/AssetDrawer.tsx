import { useEffect, useRef } from "react";
import { useCoinDetail } from "../../hooks/useCoinDetail";
import { usePriceHistory } from "../../hooks/usePriceHistory";
import { formatPrice, formatPercentage, formatDate } from "../../lib/formatters";
import { RateLimitBanner } from "../ui/RateLimitBanner";
import { PriceChart } from "./PriceChart";
import { AssetDescription } from "./AssetDescription";

interface AssetDrawerProps {
  coinId: string | null;
  onClose: () => void;
  isRateLimited?: boolean;
  onRetry?: () => void;
}

function DrawerSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-4 p-4">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-gray-200" />
        <div className="space-y-2">
          <div className="h-4 w-32 rounded bg-gray-200" />
          <div className="h-3 w-16 rounded bg-gray-200" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="h-12 rounded bg-gray-200" />
        <div className="h-12 rounded bg-gray-200" />
      </div>
      <div className="space-y-2">
        <div className="h-3 w-full rounded bg-gray-200" />
        <div className="h-3 w-5/6 rounded bg-gray-200" />
        <div className="h-3 w-4/5 rounded bg-gray-200" />
      </div>
      <div className="h-40 w-full rounded bg-gray-200" />
    </div>
  );
}

export function AssetDrawer({ coinId, onClose, isRateLimited: marketRateLimited, onRetry }: AssetDrawerProps) {
  if (!coinId) return null;
  return (
    <AssetDrawerPanel
      coinId={coinId}
      onClose={onClose}
      marketRateLimited={marketRateLimited ?? false}
      onMarketRetry={onRetry}
    />
  );
}

interface AssetDrawerPanelProps {
  coinId: string;
  onClose: () => void;
  marketRateLimited: boolean;
  onMarketRetry?: () => void;
}

function AssetDrawerPanel({ coinId, onClose, marketRateLimited, onMarketRetry }: AssetDrawerPanelProps) {
  const { coin, isLoading, isRateLimited: detailRateLimited, refetch: refetchDetail } =
    useCoinDetail(coinId);
  const { prices, isRateLimited: historyRateLimited, refetch: refetchHistory } =
    usePriceHistory(coinId);

  const isRateLimited = detailRateLimited || historyRateLimited || marketRateLimited;

  function handleRetry() {
    void refetchDetail();
    void refetchHistory();
    onMarketRetry?.();
  }

  const drawerRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const prev = document.activeElement;
    if (prev instanceof HTMLElement) previousFocusRef.current = prev;
    closeButtonRef.current?.focus();
    return () => { previousFocusRef.current?.focus(); };
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    const drawer = drawerRef.current;
    if (!drawer) return;
    const root = drawer;
    function handleTab(e: KeyboardEvent) {
      if (e.key !== "Tab") return;
      const focusable = root.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input, textarea, select, [tabindex]:not([tabindex="-1"])'
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    }
    root.addEventListener("keydown", handleTab);
    return () => root.removeEventListener("keydown", handleTab);
  }, []);

  const isPositive = (coin?.market_data.price_change_percentage_24h ?? 0) >= 0;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40 sm:hidden" aria-hidden="true" onClick={onClose} />
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label={coin ? `${coin.name} details` : "Asset details"}
        className="fixed right-0 top-0 z-50 flex h-full w-96 flex-col overflow-y-auto bg-white shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <span className="text-sm font-semibold text-gray-700">Asset Details</span>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            aria-label="Close asset details"
            className="rounded-md p-1 text-gray-400 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            ✕
          </button>
        </div>

        {isRateLimited ? (
          <div className="p-4"><RateLimitBanner onRetry={handleRetry} /></div>
        ) : isLoading || !coin ? (
          <DrawerSkeleton />
        ) : (
          <div className="flex flex-col gap-5 p-4">
            <div className="flex items-center gap-3">
              <img src={coin.image.small} alt={coin.name} className="h-10 w-10 rounded-full" />
              <div>
                <h2 className="text-base font-semibold text-gray-900">{coin.name}</h2>
                <span className="text-xs uppercase text-gray-400">{coin.symbol}</span>
              </div>
              <div className="ml-auto text-right">
                <p className="text-lg font-bold text-gray-900">
                  {formatPrice(coin.market_data.current_price["usd"])}
                </p>
                <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${isPositive ? "text-green-600" : "text-red-500"}`}>
                  <span aria-hidden="true">{isPositive ? "↑" : "↓"}</span>
                  {formatPercentage(coin.market_data.price_change_percentage_24h)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-gray-400">All-Time High</p>
                <p className="font-medium text-gray-900">{formatPrice(coin.market_data.ath["usd"])}</p>
                <p className="text-xs text-gray-400">{formatDate(coin.market_data.ath_date["usd"])}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">All-Time Low</p>
                <p className="font-medium text-gray-900">{formatPrice(coin.market_data.atl["usd"])}</p>
                <p className="text-xs text-gray-400">{formatDate(coin.market_data.atl_date["usd"])}</p>
              </div>
            </div>

            <AssetDescription text={coin.description.en || null} />

            <div>
              <p className="mb-1 text-xs font-medium text-gray-500">7-Day Price</p>
              <PriceChart prices={prices} />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
