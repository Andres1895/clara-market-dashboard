import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useMarketData } from "./hooks/useMarketData";
import { MarketTable } from "./components/market-table/MarketTable";
import { AssetDrawer } from "./components/asset-detail/AssetDrawer";

const STALE_TIME = 5 * 60 * 1000;
const GC_TIME = 10 * 60 * 1000;

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: STALE_TIME,
        gcTime: GC_TIME,
        refetchOnWindowFocus: false,
      },
    },
  });
}

function getInitialCoinId(): string | null {
  return new URLSearchParams(window.location.search).get("coin");
}

function syncCoinParam(id: string | null) {
  const url = new URL(window.location.href);
  if (id) {
    url.searchParams.set("coin", id);
  } else {
    url.searchParams.delete("coin");
  }
  history.replaceState(null, "", url.toString());
}

function AppContent() {
  const { coins, isLoading, isRateLimited, refetch, dataUpdatedAt, status } = useMarketData();
  const [selectedCoinId, setSelectedCoinId] = useState<string | null>(getInitialCoinId);

  function selectCoin(id: string | null) {
    setSelectedCoinId(id);
    syncCoinParam(id);
  }

  return (
    <div className="min-h-screen bg-[#0f1117]">
      <header className="flex items-center px-6 py-4">
        <span
          className="text-lg font-bold tracking-widest text-white"
          aria-label="Clara Market"
        >
          CLARA MARKET
        </span>
      </header>

      <main className="px-6 pb-12">
        <MarketTable
          coins={coins}
          loading={isLoading}
          isRateLimited={status === "error" }
          onRetry={refetch}
          selectedId={selectedCoinId}
          onRowClick={selectCoin}
          lastUpdatedAt={dataUpdatedAt}
        />
      </main>

      <AssetDrawer
        coinId={selectedCoinId}
        onClose={() => selectCoin(null)}
        isRateLimited={isRateLimited}
        onRetry={refetch}
      />
    </div>
  );
}

export function App() {
  const [queryClient] = useState(makeQueryClient);
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}

export default App;
