interface RateLimitBannerProps {
  onRetry: () => void;
  retryIn?: number;
}

export function RateLimitBanner({ onRetry, retryIn }: RateLimitBannerProps) {
  return (
    <div
      role="alert"
      aria-live="polite"
      className="flex w-full items-center justify-between gap-4 rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-3"
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 text-red-500" aria-hidden="true">⚠</span>
        <div className="flex flex-col gap-0.5">
          <span className="text-sm text-red-500">Rate limit reached.</span>
          {retryIn !== undefined && (
            <span className="text-sm text-amber-400/80">
              Auto-retrying in {retryIn}s…
            </span>
          )}
          <span className="text-xs text-amber-500/60">
            CoinGecko free tier allows ~10–30 requests/min
          </span>
        </div>
      </div>

      <button
        onClick={onRetry}
        aria-label="Retry request now"
        className="shrink-0 rounded-md border border-amber-500/40 px-3 py-1.5 text-sm font-medium text-amber-400 hover:border-amber-500/70 hover:text-amber-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
      >
        Retry now
      </button>
    </div>
  );
}
