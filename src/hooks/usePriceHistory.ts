import { useQuery } from "@tanstack/react-query";
import { fetchPriceHistory } from "../api/coingecko";

const STALE_TIME = 5 * 60 * 1000;
const GC_TIME = 10 * 60 * 1000;

export function usePriceHistory(coinId: string | null) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["priceHistory", coinId],
    // coinId is guaranteed non-null here by the enabled guard below
    queryFn: () => fetchPriceHistory(coinId!),
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    enabled: !!coinId,
  });

  return {
    prices: data?.prices ?? [],
    isLoading,
    isError,
  };
}
