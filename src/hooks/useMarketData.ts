import { useQuery } from "@tanstack/react-query";
import { fetchMarketData, RateLimitError } from "../api/coingecko";

const STALE_TIME = 5 * 60 * 1000;
const GC_TIME = 10 * 60 * 1000;
const REFETCH_INTERVAL = 60 * 1000;

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
