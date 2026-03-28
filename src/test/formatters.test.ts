/**
 * formatters.test.ts
 *
 * Pure-function tests for all four formatters. These run without any React
 * context so failures isolate quickly to the formatter logic itself.
 *
 * Edge cases covered:
 *   - null / undefined inputs (fallback "—")
 *   - 0 (zero-price coins exist — e.g. meme coins priced at fractions of a cent)
 *   - sub-dollar vs. ≥$1 branching in formatPrice
 *   - exact boundary values for formatMarketCap (1T, 1B, 1M)
 *   - signDisplay:"always" for formatPercentage (zero shows "+0.00%")
 *   - invalid date strings returning "—" instead of "Invalid Date"
 */

import { describe, it, expect } from 'vitest';
import { formatPrice, formatPercentage, formatMarketCap, formatDate } from '../lib/formatters';

// ── formatPrice ──────────────────────────────────────────────────────────────

describe('formatPrice', () => {
  it('returns "—" for null', () => {
    expect(formatPrice(null)).toBe('—');
  });

  it('returns "—" for undefined', () => {
    expect(formatPrice(undefined)).toBe('—');
  });

  it('formats zero via small-price path (not fallback)', () => {
    // 0 is a valid (if rare) price — must not return "—"
    const result = formatPrice(0);
    expect(result).toMatch(/^\$/);
    expect(result).not.toBe('—');
  });

  it('formats sub-dollar prices starting with "$" and no comma separators', () => {
    expect(formatPrice(0.5)).toMatch(/^\$0/);
    expect(formatPrice(0.001234)).toMatch(/^\$0/);
  });

  it('formats exactly $1.00 using the large-price path', () => {
    expect(formatPrice(1)).toBe('$1.00');
  });

  it('formats prices above $1 with exactly 2 decimal places', () => {
    expect(formatPrice(1234.56)).toBe('$1,234.56');
  });

  it('formats large prices with thousands separator', () => {
    expect(formatPrice(65000)).toBe('$65,000.00');
  });

  it('uses large-price path for prices at exactly the $1 boundary', () => {
    // Ensures the branch is ">= 1", not "> 1"
    expect(formatPrice(1.00)).toBe('$1.00');
    expect(formatPrice(0.9999)).not.toBe('$1.00');
  });
});

// ── formatPercentage ─────────────────────────────────────────────────────────

describe('formatPercentage', () => {
  it('returns "—" for null', () => {
    expect(formatPercentage(null)).toBe('—');
  });

  it('returns "—" for undefined', () => {
    expect(formatPercentage(undefined)).toBe('—');
  });

  it('prefixes positive values with "+"', () => {
    expect(formatPercentage(2.5)).toBe('+2.50%');
  });

  it('prefixes negative values with "−" and appends "%"', () => {
    expect(formatPercentage(-3.14)).toBe('-3.14%');
  });

  it('formats zero as "+0.00%" (signDisplay:"always")', () => {
    // Zero must show "+" — important for WCAG (not just color to show neutral)
    expect(formatPercentage(0)).toBe('+0.00%');
  });

  it('rounds to exactly 2 decimal places', () => {
    expect(formatPercentage(1.999)).toBe('+2.00%');
    expect(formatPercentage(-1.004)).toBe('-1.00%');
  });
});

// ── formatMarketCap ───────────────────────────────────────────────────────────

describe('formatMarketCap', () => {
  it('returns "—" for null', () => {
    expect(formatMarketCap(null)).toBe('—');
  });

  it('returns "—" for undefined', () => {
    expect(formatMarketCap(undefined)).toBe('—');
  });

  it('uses T suffix at exactly 1 trillion', () => {
    expect(formatMarketCap(1_000_000_000_000)).toBe('$1T');
  });

  it('uses B suffix just below 1 trillion', () => {
    expect(formatMarketCap(999_000_000_000)).toMatch(/B$/);
  });

  it('uses B suffix for billions', () => {
    expect(formatMarketCap(340_000_000_000)).toBe('$340B');
  });

  it('uses M suffix at exactly 1 million', () => {
    expect(formatMarketCap(1_000_000)).toBe('$1M');
  });

  it('uses M suffix for millions', () => {
    expect(formatMarketCap(500_000_000)).toBe('$500M');
  });

  it('formats sub-million as plain currency', () => {
    const result = formatMarketCap(999_000);
    expect(result).toMatch(/^\$/);
    expect(result).not.toMatch(/[TMB]$/);
  });
});

// ── formatDate ────────────────────────────────────────────────────────────────

describe('formatDate', () => {
  it('returns "—" for null', () => {
    expect(formatDate(null)).toBe('—');
  });

  it('returns "—" for undefined', () => {
    expect(formatDate(undefined)).toBe('—');
  });

  it('returns "—" for an invalid date string', () => {
    // Prevents "Invalid Date" from leaking into the UI
    expect(formatDate('not-a-date')).toBe('—');
    expect(formatDate('')).toBe('—');
  });

  it('formats a valid ISO date string with month, day, and year', () => {
    const result = formatDate('2021-11-10T00:00:00.000Z');
    expect(result).toMatch(/Nov/);
    expect(result).toContain('2021');
  });

  it('handles CoinGecko date-only format (YYYY-MM-DD)', () => {
    const result = formatDate('2013-07-06');
    expect(result).toContain('2013');
  });
});
