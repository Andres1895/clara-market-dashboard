const FALLBACK = "—";
const TRILLION = 1_000_000_000_000;
const BILLION = 1_000_000_000;
const MILLION = 1_000_000;

// Module-level instances — created once, reused on every call.

const priceFormatterLarge = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

// Avoid mixing style:"currency" with significantDigits in case of strict TS Intl types;
// prepend "$" manually instead.
const priceFormatterSmall = new Intl.NumberFormat("en-US", {
  minimumSignificantDigits: 3,
  maximumSignificantDigits: 6,
});

const percentFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  signDisplay: "always",
});

const capSuffixFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export function formatPrice(value: number | null | undefined): string {
  if (value == null) return FALLBACK;
  if (value >= 1) return priceFormatterLarge.format(value);
  return `$${priceFormatterSmall.format(value)}`;
}

export function formatPercentage(value: number | null | undefined): string {
  if (value == null) return FALLBACK;
  return `${percentFormatter.format(value)}%`;
}

export function formatMarketCap(value: number | null | undefined): string {
  if (value == null) return FALLBACK;
  if (value >= TRILLION) return `$${capSuffixFormatter.format(value / TRILLION)}T`;
  if (value >= BILLION) return `$${capSuffixFormatter.format(value / BILLION)}B`;
  if (value >= MILLION) return `$${capSuffixFormatter.format(value / MILLION)}M`;
  return priceFormatterLarge.format(value);
}

export function formatDate(dateString: string | null | undefined): string {
  if (dateString == null) return FALLBACK;
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return FALLBACK;
  return dateFormatter.format(date);
}
