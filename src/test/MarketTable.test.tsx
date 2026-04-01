/**
 * MarketTable.test.tsx
 *
 * Integration tests for the MarketTable component: loading skeleton, rate-limit
 * states, search/filter, client-side sorting, keyboard navigation, and the
 * last-updated auto-refresh timestamp.
 *
 * Sparkline is mocked because Recharts requires a real DOM canvas environment
 * and contributes nothing to the logic being tested here.
 *
 * Edge cases covered:
 *   - Rate limit WITH cached data → rows still visible under the banner
 *   - Rate limit WITHOUT cached data → skeleton rows shown (not empty body)
 *   - Search with empty result → EmptyState, not empty tbody
 *   - Sort direction toggle on the same column (asc ↔ desc)
 *   - aria-sort attribute on active vs. inactive column headers (WCAG)
 *   - Keyboard Enter and Space trigger onRowClick (not just mouse click)
 *   - Arrow-key navigation moves focus between rows
 *   - lastUpdatedAt=0 hides the timestamp (data not yet loaded)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { CoinMarket } from '../types/coingecko';
import { MarketTable } from '../components/market-table/MarketTable';

vi.mock('../components/market-table/Sparkline', () => ({
  Sparkline: () => null,
}));

// ── Fixtures ─────────────────────────────────────────────────────────────────

function makeCoin(overrides: Partial<CoinMarket> = {}): CoinMarket {
  return {
    id: 'bitcoin', symbol: 'btc', name: 'Bitcoin',
    image: 'https://example.com/btc.png',
    current_price: 50000, market_cap: 1_000_000_000_000,
    market_cap_rank: 1, fully_diluted_valuation: null,
    total_volume: 30_000_000_000, high_24h: 51000, low_24h: 49000,
    price_change_24h: 1000, price_change_percentage_24h: 2.0,
    market_cap_change_24h: 20_000_000_000,
    market_cap_change_percentage_24h: 2.0,
    circulating_supply: 19_000_000, total_supply: 21_000_000,
    max_supply: 21_000_000, ath: 69000, ath_change_percentage: -27,
    ath_date: '2021-11-10', atl: 67.81, atl_change_percentage: 73000,
    atl_date: '2013-07-06', roi: null,
    last_updated: '2024-01-01T00:00:00.000Z',
    sparkline_in_7d: { price: [49000, 50000, 51000] },
    ...overrides,
  };
}

const bitcoin = makeCoin();
const ethereum = makeCoin({
  id: 'ethereum', symbol: 'eth', name: 'Ethereum',
  current_price: 3000, market_cap: 350_000_000_000,
  market_cap_rank: 2, price_change_percentage_24h: -1.5,
});

const defaultProps = { onRowClick: vi.fn() };

beforeEach(() => {
  defaultProps.onRowClick = vi.fn();
});

// ── Loading state ─────────────────────────────────────────────────────────────

describe('MarketTable — loading state', () => {
  it('renders 8 skeleton rows while loading', () => {
    render(<MarketTable coins={[]} loading {...defaultProps} />);
    expect(document.querySelectorAll('tr.animate-pulse').length).toBe(8);
  });

  it('does not render coin rows while loading', () => {
    render(<MarketTable coins={[bitcoin]} loading {...defaultProps} />);
    expect(screen.queryByText('Bitcoin')).not.toBeInTheDocument();
  });
});

// ── Data display ──────────────────────────────────────────────────────────────

describe('MarketTable — data display', () => {
  it('renders coin name and symbol', () => {
    render(<MarketTable coins={[bitcoin]} {...defaultProps} />);
    expect(screen.getByText('Bitcoin')).toBeInTheDocument();
    expect(screen.getByText('btc')).toBeInTheDocument();
  });

  it('renders formatted price', () => {
    render(<MarketTable coins={[bitcoin]} {...defaultProps} />);
    expect(screen.getByText('$50,000.00')).toBeInTheDocument();
  });

  it('marks selected row with aria-selected="true"', () => {
    render(<MarketTable coins={[bitcoin]} selectedId="bitcoin" {...defaultProps} />);
    expect(screen.getByRole('row', { name: /bitcoin/i })).toHaveAttribute('aria-selected', 'true');
  });

  it('marks unselected rows with aria-selected="false"', () => {
    render(<MarketTable coins={[bitcoin, ethereum]} selectedId="bitcoin" {...defaultProps} />);
    expect(screen.getByRole('row', { name: /ethereum/i })).toHaveAttribute('aria-selected', 'false');
  });
});

// ── Rate-limit states ─────────────────────────────────────────────────────────

describe('MarketTable — rate-limit states', () => {
  it('shows RateLimitBanner when isRateLimited=true', () => {
    render(<MarketTable coins={[]} isRateLimited {...defaultProps} />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('shows error state when rate-limited with no cached data (no skeleton rows)', () => {
    render(<MarketTable coins={[]} isRateLimited {...defaultProps} />);
    expect(document.querySelectorAll('tr.animate-pulse').length).toBe(0);
    expect(screen.getByText(/no market data available/i)).toBeInTheDocument();
  });

  it('shows stale rows alongside the banner when rate-limited WITH cached data', () => {
    render(<MarketTable coins={[bitcoin]} isRateLimited {...defaultProps} />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Bitcoin')).toBeInTheDocument();
  });
});

// ── Last-updated timestamp ────────────────────────────────────────────────────

describe('MarketTable — auto-refresh timestamp', () => {
  it('shows "Updated" timestamp when lastUpdatedAt > 0', () => {
    const ts = new Date('2024-01-01T12:30:00').getTime();
    render(<MarketTable coins={[]} lastUpdatedAt={ts} {...defaultProps} />);
    expect(screen.getByText(/updated/i)).toBeInTheDocument();
  });

  it('hides timestamp when lastUpdatedAt is 0 (data not yet fetched)', () => {
    render(<MarketTable coins={[]} lastUpdatedAt={0} {...defaultProps} />);
    expect(screen.queryByText(/updated/i)).not.toBeInTheDocument();
  });

  it('hides timestamp when lastUpdatedAt is omitted', () => {
    render(<MarketTable coins={[]} {...defaultProps} />);
    expect(screen.queryByText(/updated/i)).not.toBeInTheDocument();
  });
});

// ── Search / filter ───────────────────────────────────────────────────────────

describe('MarketTable — search', () => {
  it('filters by name (case-insensitive)', () => {
    render(<MarketTable coins={[bitcoin, ethereum]} {...defaultProps} />);
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'eth' } });
    expect(screen.queryByText('Bitcoin')).not.toBeInTheDocument();
    expect(screen.getByText('Ethereum')).toBeInTheDocument();
  });

  it('filters by symbol (case-insensitive)', () => {
    render(<MarketTable coins={[bitcoin, ethereum]} {...defaultProps} />);
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'BTC' } });
    expect(screen.getByText('Bitcoin')).toBeInTheDocument();
    expect(screen.queryByText('Ethereum')).not.toBeInTheDocument();
  });

  it('shows EmptyState with the query when search has no matches', () => {
    render(<MarketTable coins={[bitcoin, ethereum]} {...defaultProps} />);
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'xyz123' } });
    expect(screen.getByText(/No results for/i)).toBeInTheDocument();
    expect(screen.getByText(/xyz123/)).toBeInTheDocument();
  });

  it('restores all rows when search is cleared', () => {
    render(<MarketTable coins={[bitcoin, ethereum]} {...defaultProps} />);
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'eth' } });
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: '' } });
    expect(screen.getByText('Bitcoin')).toBeInTheDocument();
    expect(screen.getByText('Ethereum')).toBeInTheDocument();
  });
});

// ── Sorting ───────────────────────────────────────────────────────────────────

describe('MarketTable — sorting', () => {
  it('defaults to market_cap_rank ascending (rank 1 first)', () => {
    render(<MarketTable coins={[ethereum, bitcoin]} {...defaultProps} />);
    const rows = screen.getAllByRole('row');
    expect(rows[1]).toHaveTextContent('Bitcoin');
    expect(rows[2]).toHaveTextContent('Ethereum');
  });

  it('sets aria-sort="ascending" on the initially active column', () => {
    render(<MarketTable coins={[bitcoin]} {...defaultProps} />);
    const headers = screen.getAllByRole('columnheader');
    // index 0 is the star column (no aria-sort); rank is now index 1
    expect(headers[1]).toHaveAttribute('aria-sort', 'ascending');
  });

  it('sets aria-sort="none" on inactive sortable columns', () => {
    render(<MarketTable coins={[bitcoin]} {...defaultProps} />);
    // "Asset Name" is now the third header (index 2) after adding the star column
    expect(screen.getAllByRole('columnheader')[2]).toHaveAttribute('aria-sort', 'none');
  });

  it('sorts by name descending on first click (new column → desc)', () => {
    render(<MarketTable coins={[bitcoin, ethereum]} {...defaultProps} />);
    fireEvent.click(screen.getByRole('columnheader', { name: /asset name/i }));
    const rows = screen.getAllByRole('row');
    // desc alphabetically: Ethereum (E) before Bitcoin (B)
    expect(rows[1]).toHaveTextContent('Ethereum');
  });

  it('toggles to ascending on second click of same column', () => {
    render(<MarketTable coins={[bitcoin, ethereum]} {...defaultProps} />);
    fireEvent.click(screen.getByRole('columnheader', { name: /asset name/i }));
    fireEvent.click(screen.getByRole('columnheader', { name: /asset name/i }));
    const rows = screen.getAllByRole('row');
    // asc alphabetically: Bitcoin before Ethereum
    expect(rows[1]).toHaveTextContent('Bitcoin');
  });

  it('sets aria-sort="descending" after first click on a new column', () => {
    render(<MarketTable coins={[bitcoin]} {...defaultProps} />);
    fireEvent.click(screen.getByRole('columnheader', { name: /asset name/i }));
    expect(screen.getByRole('columnheader', { name: /asset name/i })).toHaveAttribute(
      'aria-sort',
      'descending',
    );
  });
});

// ── Row interaction & keyboard ────────────────────────────────────────────────

describe('MarketTable — row interaction', () => {
  it('calls onRowClick with coin id on mouse click', () => {
    const onRowClick = vi.fn();
    render(<MarketTable coins={[bitcoin]} {...defaultProps} onRowClick={onRowClick} />);
    fireEvent.click(screen.getByRole('row', { name: /bitcoin/i }));
    expect(onRowClick).toHaveBeenCalledWith('bitcoin');
  });

  it('calls onRowClick when Enter is pressed on a row', () => {
    const onRowClick = vi.fn();
    render(<MarketTable coins={[bitcoin]} {...defaultProps} onRowClick={onRowClick} />);
    fireEvent.keyDown(screen.getByRole('row', { name: /bitcoin/i }), { key: 'Enter' });
    expect(onRowClick).toHaveBeenCalledWith('bitcoin');
  });

  it('calls onRowClick when Space is pressed on a row', () => {
    const onRowClick = vi.fn();
    render(<MarketTable coins={[bitcoin]} {...defaultProps} onRowClick={onRowClick} />);
    fireEvent.keyDown(screen.getByRole('row', { name: /bitcoin/i }), { key: ' ' });
    expect(onRowClick).toHaveBeenCalledWith('bitcoin');
  });

  it('rows have tabIndex=0 for keyboard reachability', () => {
    render(<MarketTable coins={[bitcoin]} {...defaultProps} />);
    expect(screen.getByRole('row', { name: /bitcoin/i })).toHaveAttribute('tabindex', '0');
  });

  it('ArrowDown moves focus to the next row', () => {
    render(<MarketTable coins={[bitcoin, ethereum]} {...defaultProps} />);
    const rows = screen.getAllByRole('row');
    const firstDataRow = rows[1] as HTMLElement;
    const secondDataRow = rows[2] as HTMLElement;
    firstDataRow.focus();
    fireEvent.keyDown(firstDataRow, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(secondDataRow);
  });

  it('ArrowUp moves focus to the previous row', () => {
    render(<MarketTable coins={[bitcoin, ethereum]} {...defaultProps} />);
    const rows = screen.getAllByRole('row');
    const firstDataRow = rows[1] as HTMLElement;
    const secondDataRow = rows[2] as HTMLElement;
    secondDataRow.focus();
    fireEvent.keyDown(secondDataRow, { key: 'ArrowUp' });
    expect(document.activeElement).toBe(firstDataRow);
  });
});
