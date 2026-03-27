import { useQuery } from "@tanstack/react-query";
import { fetchMarketData, RateLimitError } from "../api/coingecko";

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
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["marketData"],
    queryFn: fetchMarketData,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    refetchInterval: REFETCH_INTERVAL,
  });

  return {
    coins: data ?? [],
    isLoading,
    isError,
    isRateLimited: error instanceof RateLimitError,
    refetch,
  };
}
