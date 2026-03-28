/**
 * AssetDescription.test.tsx
 *
 * Tests for the AssetDescription component: HTML stripping, 300-char
 * truncation boundary, and the Read more / Show less toggle.
 *
 * Edge cases covered:
 *   - null / empty / whitespace-only text → renders nothing
 *   - text composed entirely of HTML tags → renders nothing after stripping
 *   - exactly 300 chars → no toggle (boundary is strictly ">")
 *   - exactly 301 chars → toggle appears
 *   - aria-expanded reflects expanded state (accessibility requirement)
 */

import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AssetDescription } from '../components/asset-detail/AssetDescription';

const EXACTLY_300 = 'x'.repeat(300);
const OVER_300 = 'x'.repeat(301);

describe('AssetDescription — renders nothing', () => {
  it('renders nothing for null', () => {
    const { container } = render(<AssetDescription text={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing for empty string', () => {
    const { container } = render(<AssetDescription text="" />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when text is whitespace-only after HTML stripping', () => {
    // "   " contains only spaces → plain.trim() === ""
    const { container } = render(<AssetDescription text="   " />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when text is only HTML tags with no visible content', () => {
    const { container } = render(<AssetDescription text="<b><i></i></b>" />);
    expect(container.firstChild).toBeNull();
  });
});

describe('AssetDescription — HTML stripping', () => {
  it('strips anchor tags and shows plain text', () => {
    render(
      <AssetDescription text='<a href="https://bitcoin.org">Bitcoin</a> is a decentralised currency.' />,
    );
    expect(screen.getByText(/Bitcoin is a decentralised currency/)).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('strips mixed tags while preserving text content', () => {
    render(<AssetDescription text="<p><strong>Hello</strong> world</p>" />);
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });
});

describe('AssetDescription — truncation boundary', () => {
  it('shows full text without a toggle when text is short', () => {
    render(<AssetDescription text="Short description." />);
    expect(screen.getByText('Short description.')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('shows full text without toggle when text is exactly 300 chars', () => {
    // boundary: length > 300 triggers toggle, so 300 must not
    render(<AssetDescription text={EXACTLY_300} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('shows truncated text and Read more button when text is 301 chars', () => {
    render(<AssetDescription text={OVER_300} />);
    expect(screen.getByRole('button', { name: /read more/i })).toBeInTheDocument();
    // Full text must NOT appear — only the first 300 chars + ellipsis
    expect(screen.queryByText(OVER_300)).not.toBeInTheDocument();
  });
});

describe('AssetDescription — Read more / Show less toggle', () => {
  it('expands to full text when Read more is clicked', () => {
    render(<AssetDescription text={OVER_300} />);
    fireEvent.click(screen.getByRole('button', { name: /read more/i }));
    expect(screen.getByText(OVER_300)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /show less/i })).toBeInTheDocument();
  });

  it('collapses back when Show less is clicked', () => {
    render(<AssetDescription text={OVER_300} />);
    fireEvent.click(screen.getByRole('button', { name: /read more/i }));
    fireEvent.click(screen.getByRole('button', { name: /show less/i }));
    expect(screen.getByRole('button', { name: /read more/i })).toBeInTheDocument();
    expect(screen.queryByText(OVER_300)).not.toBeInTheDocument();
  });

  it('sets aria-expanded="false" on the Read more button by default', () => {
    render(<AssetDescription text={OVER_300} />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'false');
  });

  it('sets aria-expanded="true" after expanding', () => {
    render(<AssetDescription text={OVER_300} />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'true');
  });

  it('sets aria-expanded="false" again after collapsing', () => {
    render(<AssetDescription text={OVER_300} />);
    fireEvent.click(screen.getByRole('button')); // expand
    fireEvent.click(screen.getByRole('button')); // collapse
    expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'false');
  });
});
