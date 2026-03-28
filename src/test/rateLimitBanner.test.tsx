/**
 * rateLimitBanner.test.tsx
 *
 * Tests for rate-limit detection utilities, the useMarketData hook, and the
 * AssetDrawer component's RateLimitBanner prop-forwarding chain.
 *
 * The central regression: RateLimitBanner must appear inside AssetDrawer even
 * when the query is in a "success then re-fetch fails" state — where isError is
 * false but error is a RateLimitError. isRateLimitError(error) covers this
 * because it inspects the error object directly, not the isError flag.
 */

import { describe, it, expect, vi, beforeEach, afterEach, type MockedFunction } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RateLimitError, isRateLimitError, coingeckoQueryRetry } from '../api/coingecko';
import { useMarketData } from '../hooks/useMarketData';
import { AssetDrawer } from '../components/asset-detail/AssetDrawer';
import type { ReactNode } from 'react';

// ---------------------------------------------------------------------------
// Module-level mocks for hooks used inside AssetDrawer
// ---------------------------------------------------------------------------

vi.mock('../hooks/useCoinDetail', () => ({
  useCoinDetail: vi.fn(),
}));

vi.mock('../hooks/usePriceHistory', () => ({
  usePriceHistory: vi.fn(),
}));

// Import the mocked modules after vi.mock declarations so we can control
// their return values per test.
import { useCoinDetail } from '../hooks/useCoinDetail';
import { usePriceHistory } from '../hooks/usePriceHistory';

const mockedUseCoinDetail = useCoinDetail as MockedFunction<typeof useCoinDetail>;
const mockedUsePriceHistory = usePriceHistory as MockedFunction<typeof usePriceHistory>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Creates a fresh QueryClient for each test to prevent cache bleed-over. */
function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Disable retries in tests so failures surface immediately.
        retry: false,
      },
    },
  });
}

/** Wraps children in a QueryClientProvider with a freshly created client. */
function QueryWrapper({ children, client }: { children: ReactNode; client: QueryClient }) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

/** Sets default hook return values so AssetDrawer renders without throwing. */
function setupDefaultHookMocks() {
  mockedUseCoinDetail.mockReturnValue({
    coin: null,
    isLoading: false,
    isError: false,
    isRateLimited: false,
    refetch: vi.fn(),
  });
  mockedUsePriceHistory.mockReturnValue({
    prices: [],
    isLoading: false,
    isError: false,
    isRateLimited: false,
    refetch: vi.fn(),
  });
}

// ---------------------------------------------------------------------------
// 1. isRateLimitError utility
// ---------------------------------------------------------------------------

describe('isRateLimitError', () => {
  it('returns true for a RateLimitError instance', () => {
    // Proves the primary instanceof path works.
    const error = new RateLimitError();
    expect(isRateLimitError(error)).toBe(true);
  });

  it('returns true for a plain Error whose name is "RateLimitError" (HMR case)', () => {
    // Proves the fallback name-check path works.
    // After hot-module replacement the class identity is lost but the name survives.
    const error = new Error('Rate limit exceeded');
    error.name = 'RateLimitError';
    expect(isRateLimitError(error)).toBe(true);
  });

  it('returns false for a generic Error', () => {
    // Proves ordinary errors are NOT classified as rate-limit errors.
    const error = new Error('Network failure');
    expect(isRateLimitError(error)).toBe(false);
  });

  it('returns false for null', () => {
    // Proves the guard is safe to call before an error is present (query idle state).
    expect(isRateLimitError(null)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 2. coingeckoQueryRetry
// ---------------------------------------------------------------------------

describe('coingeckoQueryRetry', () => {
  it('returns false immediately for a RateLimitError, regardless of failure count', () => {
    // Proves 429 errors are never retried so error state is set without delay.
    const rateLimitError = new RateLimitError();
    expect(coingeckoQueryRetry(0, rateLimitError)).toBe(false);
    expect(coingeckoQueryRetry(1, rateLimitError)).toBe(false);
    expect(coingeckoQueryRetry(2, rateLimitError)).toBe(false);
  });

  it('allows up to 3 retries for non-rate-limit errors', () => {
    // Proves generic errors still get the standard retry budget.
    const genericError = new Error('Server error');
    expect(coingeckoQueryRetry(0, genericError)).toBe(true);
    expect(coingeckoQueryRetry(1, genericError)).toBe(true);
    expect(coingeckoQueryRetry(2, genericError)).toBe(true);
  });

  it('stops retrying generic errors once failure count reaches 3', () => {
    // Proves the retry budget cap is enforced.
    const genericError = new Error('Server error');
    expect(coingeckoQueryRetry(3, genericError)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 3. useMarketData hook — rate-limit detection
// ---------------------------------------------------------------------------

/**
 * A minimal React component that renders the current hook state into the DOM
 * so waitFor can assert on it without needing act() wrappers.
 */
function MarketDataProbe() {
  const { isRateLimited, isError, isLoading } = useMarketData();
  return (
    <div>
      <span data-testid="isRateLimited">{String(isRateLimited)}</span>
      <span data-testid="isError">{String(isError)}</span>
      <span data-testid="isLoading">{String(isLoading)}</span>
    </div>
  );
}

describe('useMarketData — rate-limit detection', () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('sets isRateLimited=true when the API returns 429', async () => {
    // Proves the hook correctly maps a 429 response to the isRateLimited flag.
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(null, { status: 429, statusText: 'Too Many Requests' }),
    );

    const client = makeQueryClient();
    // Override the client-level retry default to stop on RateLimitError.
    client.setDefaultOptions({
      queries: {
        retry: (failureCount, error) => {
          if (isRateLimitError(error)) return false;
          return failureCount < 3;
        },
      },
    });

    render(
      <QueryWrapper client={client}>
        <MarketDataProbe />
      </QueryWrapper>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('isRateLimited').textContent).toBe('true');
    });
  });

  it('sets isRateLimited=true after a background refetch returns 429 even though isError may be false', async () => {
    /**
     * This is the critical regression test.
     *
     * TanStack Query keeps isError=false on background refetch failures when
     * staleTime is still valid (the cached data is preserved). The hook must
     * NOT guard isRateLimitError behind `isError &&` — it must call
     * isRateLimitError(error) directly.
     *
     * Sequence:
     *   1st fetch → 200 OK with valid data  → isRateLimited=false
     *   2nd fetch → 429                      → isRateLimited=true (even if isError is false)
     */
    let callCount = 0;
    globalThis.fetch = vi.fn().mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // First call succeeds — data is cached, stale time starts.
        return Promise.resolve(
          new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } }),
        );
      }
      // Subsequent calls simulate a 429 (background refetch failure).
      return Promise.resolve(new Response(null, { status: 429, statusText: 'Too Many Requests' }));
    });

    const client = makeQueryClient();
    client.setDefaultOptions({
      queries: {
        // Use a zero stale time so the second render immediately triggers a
        // background refetch, and stop retrying on 429.
        staleTime: 0,
        retry: (failureCount, error) => {
          if (isRateLimitError(error)) return false;
          return failureCount < 3;
        },
      },
    });

    const { rerender } = render(
      <QueryWrapper client={client}>
        <MarketDataProbe />
      </QueryWrapper>,
    );

    // Wait for the first successful fetch to complete.
    await waitFor(() => {
      expect(screen.getByTestId('isLoading').textContent).toBe('false');
    });

    // Trigger a re-render to force a background refetch (staleTime=0 makes
    // data immediately stale, so remounting will trigger another fetch).
    rerender(
      <QueryWrapper client={client}>
        <MarketDataProbe />
      </QueryWrapper>,
    );

    // Manually invalidate so TanStack Query fires the background refetch.
    await client.invalidateQueries({ queryKey: ['marketData'] });

    // isRateLimited must become true even if the cached data is still present
    // and isError might still be false.
    await waitFor(() => {
      expect(screen.getByTestId('isRateLimited').textContent).toBe('true');
    });
  });

  it('sets isRateLimited=false when the API responds successfully', async () => {
    // Proves the happy path: no false positives on a 200 response.
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } }),
    );

    const client = makeQueryClient();

    render(
      <QueryWrapper client={client}>
        <MarketDataProbe />
      </QueryWrapper>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('isLoading').textContent).toBe('false');
    });

    // Proves isRateLimited stays false on success.
    expect(screen.getByTestId('isRateLimited').textContent).toBe('false');
  });
});

// ---------------------------------------------------------------------------
// 4. AssetDrawer component — RateLimitBanner prop forwarding
// ---------------------------------------------------------------------------

describe('AssetDrawer — RateLimitBanner prop forwarding', () => {
  beforeEach(() => {
    setupDefaultHookMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders RateLimitBanner when isRateLimited=true and coinId is set', () => {
    // Proves the basic happy-path: rate-limit banner appears when the prop is true.
    const client = makeQueryClient();
    render(
      <QueryWrapper client={client}>
        <AssetDrawer
          coinId="bitcoin"
          onClose={vi.fn()}
          isRateLimited={true}
          onRetry={vi.fn()}
        />
      </QueryWrapper>,
    );

    // RateLimitBanner renders a role="alert" element with its retry button.
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry request now/i })).toBeInTheDocument();
  });

  it('renders nothing when coinId is null, even if isRateLimited=true', () => {
    // Proves the guard at the top of AssetDrawer (if !coinId return null) takes
    // precedence — no drawer content is mounted when no coin is selected.
    const client = makeQueryClient();
    const { container } = render(
      <QueryWrapper client={client}>
        <AssetDrawer
          coinId={null}
          onClose={vi.fn()}
          isRateLimited={true}
          onRetry={vi.fn()}
        />
      </QueryWrapper>,
    );

    expect(container.firstChild).toBeNull();
  });

  it('still renders RateLimitBanner after coinId changes from one coin to another (regression for second-selection bug)', () => {
    /**
     * Regression test for the "second selection" bug.
     *
     * When the user selects coin A → rate limit hits → drawer shows banner.
     * Then selects coin B → drawer unmounts/remounts with new coinId.
     *
     * The banner must still appear because:
     *   - marketRateLimited is forwarded directly from the parent's prop
     *   - AssetDrawer passes it through to AssetDrawerPanel
     *   - AssetDrawerPanel combines it with detailRateLimited and historyRateLimited
     *
     * If the prop-forwarding chain breaks (e.g., prop is not forwarded on
     * remount, or combined incorrectly), this test catches the regression.
     */
    const client = makeQueryClient();
    const onClose = vi.fn();
    const onRetry = vi.fn();

    const { rerender } = render(
      <QueryWrapper client={client}>
        <AssetDrawer
          coinId="bitcoin"
          onClose={onClose}
          isRateLimited={true}
          onRetry={onRetry}
        />
      </QueryWrapper>,
    );

    // First coin selection: banner must be visible.
    expect(screen.getByRole('alert')).toBeInTheDocument();

    // Simulate user selecting a different coin while rate-limit is still active.
    rerender(
      <QueryWrapper client={client}>
        <AssetDrawer
          coinId="ethereum"
          onClose={onClose}
          isRateLimited={true}
          onRetry={onRetry}
        />
      </QueryWrapper>,
    );

    // After coin change: banner must still be visible — this is the regression assertion.
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry request now/i })).toBeInTheDocument();
  });

  it('does not render RateLimitBanner when isRateLimited=false and hooks report no rate limit', () => {
    // Proves the banner stays hidden in the normal (no error) state — no false positives.
    const client = makeQueryClient();
    render(
      <QueryWrapper client={client}>
        <AssetDrawer
          coinId="bitcoin"
          onClose={vi.fn()}
          isRateLimited={false}
          onRetry={vi.fn()}
        />
      </QueryWrapper>,
    );

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('renders RateLimitBanner when useCoinDetail reports isRateLimited=true (internal hook)', () => {
    // Proves that the drawer also shows the banner when the coin-detail hook hits a 429,
    // independently of the marketRateLimited prop from the parent.
    mockedUseCoinDetail.mockReturnValue({
      coin: null,
      isLoading: false,
      isError: true,
      isRateLimited: true,
      refetch: vi.fn(),
    });

    const client = makeQueryClient();
    render(
      <QueryWrapper client={client}>
        <AssetDrawer
          coinId="bitcoin"
          onClose={vi.fn()}
          isRateLimited={false}
          onRetry={vi.fn()}
        />
      </QueryWrapper>,
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('renders RateLimitBanner when usePriceHistory reports isRateLimited=true (internal hook)', () => {
    // Proves that the price-history hook's rate-limit signal is also surfaced in the banner.
    mockedUsePriceHistory.mockReturnValue({
      prices: [],
      isLoading: false,
      isError: true,
      isRateLimited: true,
      refetch: vi.fn(),
    });

    const client = makeQueryClient();
    render(
      <QueryWrapper client={client}>
        <AssetDrawer
          coinId="bitcoin"
          onClose={vi.fn()}
          isRateLimited={false}
          onRetry={vi.fn()}
        />
      </QueryWrapper>,
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});
