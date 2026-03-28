import { useQuery } from "@tanstack/react-query";
import { coingeckoQueryRetry, fetchMarketData, isRateLimitError } from "../api/coingecko";

const STALE_TIME = 5 * 60 * 1000;
const GC_TIME = 10 * 60 * 1000;
const REFETCH_INTERVAL = 60 * 1000;

/**
 * Fetches and caches the top coins by market cap, auto-refreshing every 60 seconds.
 * Auto-refresh pauses only on 429 errors — non-rate-limit errors (e.g. network) still allow retry.
 *
 * @returns `coins` array, loading/error flags, rate-limit flag, `refetch` trigger, and TanStack `status`
 */
export function useMarketData() {
  const { data, isLoading, isError, error, refetch, dataUpdatedAt, status } = useQuery({
    queryKey: ["marketData"],
    queryFn: fetchMarketData,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    refetchInterval: (query) => (isRateLimitError(query.state.error) ? false : REFETCH_INTERVAL),
    retry: coingeckoQueryRetry,
  });

  return {
    coins: data ?? [],
    isLoading,
    isError,
    isRateLimited: isRateLimitError(error),
    refetch,
    dataUpdatedAt,  
    status,
  };
}
