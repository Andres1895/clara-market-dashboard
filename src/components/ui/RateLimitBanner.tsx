interface RateLimitBannerProps {
  onRetry: () => void;
  retryIn?: number;
}

export function RateLimitBanner({ onRetry, retryIn }: RateLimitBannerProps) {
  return (
    <div
      role="alert"
      className="flex items-center justify-between gap-4 rounded-lg bg-amber-50 px-4 py-3 text-amber-800 ring-1 ring-amber-200"
    >
      <div className="flex items-center gap-2 text-sm">
        <span aria-hidden="true">⚠</span>
        <span>
          Rate limit reached.{" "}
          {retryIn !== undefined
            ? `Retrying in ${retryIn}s…`
            : "Please retry manually."}
        </span>
      </div>
      <button
        onClick={onRetry}
        className="shrink-0 rounded-md bg-amber-100 px-3 py-1 text-sm font-medium text-amber-900 hover:bg-amber-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500"
      >
        Retry
      </button>
    </div>
  );
}
