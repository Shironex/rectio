import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Money, formatMoney } from './money';

describe('formatMoney', () => {
  it('formats in the locale with the true minus sign', () => {
    expect(formatMoney(-1234.5, 'USD', { locale: 'en-US' })).toBe('−$1,234.50');
    expect(formatMoney(1234.5, 'EUR', { locale: 'de-DE' })).toBe('1.234,50 €');
  });

  it('prints a plus on credits with exceptZero, and parentheses for accounting', () => {
    expect(formatMoney(12, 'USD', { locale: 'en-US', signDisplay: 'exceptZero' })).toBe('+$12.00');
    expect(formatMoney(0, 'USD', { locale: 'en-US', signDisplay: 'exceptZero' })).toBe('$0.00');
    expect(formatMoney(-12, 'USD', { locale: 'en-US', accounting: true })).toBe('($12.00)');
  });

  it('uses the currency precision', () => {
    expect(formatMoney(1500, 'JPY', { locale: 'ja-JP' })).toBe('￥1,500');
  });
});

describe('Money', () => {
  it('marks direction and keeps the sign in the text, so colour is not the only signal', () => {
    render(<Money amount={-42} currency="USD" locale="en-US" tone="auto" />);
    const node = screen.getByText('−$42.00');
    expect(node).toHaveAttribute('data-direction', 'debit');
    expect(node.className).toContain('text-negative-strong');
  });

  it('stays neutral unless asked to colour', () => {
    render(<Money amount={42} currency="USD" locale="en-US" />);
    expect(screen.getByText('$42.00').className).not.toContain('text-positive-strong');
  });
});

describe('Money font', () => {
  it('sets the numeric family, not a weight (font-(--x) means font-weight in Tailwind v4)', () => {
    render(<Money amount={1} currency="USD" locale="en-US" />);
    expect(screen.getByText('$1.00').className).toContain('font-(family-name:--rx-money-family)');
  });
});
