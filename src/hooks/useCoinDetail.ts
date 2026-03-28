import { useQuery } from "@tanstack/react-query";
import { coingeckoQueryRetry, fetchCoinDetail, isRateLimitError } from "../api/coingecko";

const STALE_TIME = 5 * 60 * 1000;
const GC_TIME = 10 * 60 * 1000;

/**
 * Fetches full detail for a single coin, skipping the query when `coinId` is null.
 * Exposes `isRateLimited` so callers can surface a retry button instead of a generic error.
 *
 * @param coinId - CoinGecko coin id (e.g. `"bitcoin"`), or null to disable fetching
 * @returns `coin` object (or null), loading/error flags, rate-limit flag, and a `refetch` trigger
 */
export function useCoinDetail(coinId: string | null) {
  const { data, isLoading, isError, error, refetch, status } = useQuery({
    queryKey: ["coinDetail", coinId],
    queryFn: () => fetchCoinDetail(coinId!),
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    enabled: !!coinId,
    retry: coingeckoQueryRetry,
  });
  return {
    coin: data ?? null,
    isLoading,
    isError,
    isRateLimited: isRateLimitError(error),
    refetch,
    status,
  };
}
