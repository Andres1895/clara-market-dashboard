import { useQuery } from "@tanstack/react-query";
import { coingeckoQueryRetry, fetchPriceHistory, isRateLimitError } from "../api/coingecko";

const STALE_TIME = 5 * 60 * 1000;
const GC_TIME = 10 * 60 * 1000;

/**
 * Fetches the 7-day price history for a coin, skipping the query when `coinId` is null.
 *
 * @param coinId - CoinGecko coin id (e.g. `"bitcoin"`), or null to disable fetching
 * @returns `prices` array of `[timestamp, price]` tuples, loading/error flags, rate-limit flag, and `refetch`
 */
export function usePriceHistory(coinId: string | null) {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["priceHistory", coinId],
    // coinId is guaranteed non-null here by the enabled guard below
    queryFn: () => fetchPriceHistory(coinId!),
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    enabled: !!coinId,
    retry: coingeckoQueryRetry,
  });
  return {
    prices: data?.prices ?? [],
    isLoading,
    isError,
    isRateLimited: isRateLimitError(error),
    refetch,
  };
}
