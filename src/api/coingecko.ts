import type { CoinDetail, CoinMarketList, PriceHistory } from "../types/coingecko";

const BASE_URL = "https://api.coingecko.com/api/v3";

const MARKETS_PARAMS = new URLSearchParams({
  vs_currency: "usd",
  order: "market_cap_desc",
  per_page: "20",
  page: "1",
  sparkline: "true",
});

const DETAIL_PARAMS = new URLSearchParams({
  localization: "false",
  tickers: "false",
  community_data: "false",
  developer_data: "false",
});

const CHART_PARAMS = new URLSearchParams({
  vs_currency: "usd",
  days: "7",
});

export class RateLimitError extends Error {
  constructor() {
    super("Rate limit exceeded. Please wait a moment before retrying.");
    this.name = "RateLimitError";
  }
}

async function apiFetch<T>(url: string): Promise<T> {
  const response = await fetch(url);

  if (response.status === 429) {
    throw new RateLimitError();
  }

  if (!response.ok) {
    throw new Error(`API error ${response.status}: ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

export async function fetchMarketData(): Promise<CoinMarketList> {
  return apiFetch<CoinMarketList>(`${BASE_URL}/coins/markets?${MARKETS_PARAMS}`);
}

export async function fetchCoinDetail(id: string): Promise<CoinDetail> {
  return apiFetch<CoinDetail>(`${BASE_URL}/coins/${encodeURIComponent(id)}?${DETAIL_PARAMS}`);
}

export async function fetchPriceHistory(id: string): Promise<PriceHistory> {
  return apiFetch<PriceHistory>(
    `${BASE_URL}/coins/${encodeURIComponent(id)}/market_chart?${CHART_PARAMS}`,
  );
}
