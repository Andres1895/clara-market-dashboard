import { useQuery } from "@tanstack/react-query";
import { coingeckoQueryRetry, fetchMarketData, isRateLimitError } from "../api/coingecko";

const STALE_TIME = 5 * 60 * 1000;
const GC_TIME = 10 * 60 * 1000;
const REFETCH_INTERVAL = 60 * 1000;

/**
 * Fetches and caches the top coins by market cap, auto-refreshing every 60 seconds.
 * Exposes `isRateLimited` to distinguish 429 errors from other failures.
 *
 * @returns `coins` array, loading/error flags, rate-limit flag, and a `refetch` trigger
 */
export function useMarketData() {
  const { data, isLoading, isError, error, refetch, dataUpdatedAt } = useQuery({
    queryKey: ["marketData"],
    queryFn: fetchMarketData,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    refetchInterval: (query) => (query.state.error ? false : REFETCH_INTERVAL),
    retry: coingeckoQueryRetry,
  });

  return {
    coins: data ?? [],
    isLoading,
    isError,
    isRateLimited: isRateLimitError(error),
    refetch,
    dataUpdatedAt,
  };
}
