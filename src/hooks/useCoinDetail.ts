import { useQuery } from "@tanstack/react-query";
import { fetchCoinDetail, RateLimitError } from "../api/coingecko";

const STALE_TIME = 5 * 60 * 1000;
const GC_TIME = 10 * 60 * 1000;

export function useCoinDetail(coinId: string | null) {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["coinDetail", coinId],
    // coinId is guaranteed non-null here by the enabled guard below
    queryFn: () => fetchCoinDetail(coinId!),
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    enabled: !!coinId,
  });

  return {
    coin: data ?? null,
    isLoading,
    isError,
    isRateLimited: error instanceof RateLimitError,
    refetch,
  };
}
