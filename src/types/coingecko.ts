export interface SparklineIn7d {
  price: number[];
}

export interface Roi {
  times: number;
  currency: string;
  percentage: number;
}

export interface CoinMarket {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  fully_diluted_valuation: number | null;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  market_cap_change_24h: number;
  market_cap_change_percentage_24h: number;
  circulating_supply: number;
  total_supply: number | null;
  max_supply: number | null;
  ath: number;
  ath_change_percentage: number;
  ath_date: string;
  atl: number;
  atl_change_percentage: number;
  atl_date: string;
  roi: Roi | null;
  last_updated: string;
  sparkline_in_7d: SparklineIn7d;
}

export type CoinMarketList = CoinMarket[];

// [timestamp_ms, value]
export type DataPoint = [number, number];

export interface PriceHistory {
  prices: DataPoint[];
  market_caps: DataPoint[];
  total_volumes: DataPoint[];
}

export interface CoinDetailImage {
  thumb: string;
  small: string;
  large: string;
}

export interface CoinDetailLinks {
  homepage: string[];
  subreddit_url: string;
  twitter_screen_name: string;
}

export interface CoinDetailMarketData {
  current_price: Record<string, number>;
  market_cap: Record<string, number>;
  total_volume: Record<string, number>;
  high_24h: Record<string, number>;
  low_24h: Record<string, number>;
  price_change_24h: number;
  price_change_percentage_24h: number;
  price_change_percentage_7d: number;
  price_change_percentage_30d: number;
  circulating_supply: number;
  total_supply: number | null;
  max_supply: number | null;
  ath: Record<string, number>;
  ath_change_percentage: Record<string, number>;
  ath_date: Record<string, string>;
  atl: Record<string, number>;
  atl_change_percentage: Record<string, number>;
  atl_date: Record<string, string>;
  market_cap_rank: number;
  last_updated: string;
}

export interface CoinDetail {
  id: string;
  symbol: string;
  name: string;
  image: CoinDetailImage;
  description: { en: string };
  links: CoinDetailLinks;
  categories: string[];
  genesis_date: string | null;
  sentiment_votes_up_percentage: number;
  sentiment_votes_down_percentage: number;
  market_cap_rank: number;
  market_data: CoinDetailMarketData;
  last_updated: string;
}
