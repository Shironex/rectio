import type { ComponentProps } from 'react';

import { cn } from '../lib/cn';

export type MoneyTone = 'auto' | 'neutral';

export interface MoneyProps extends Omit<ComponentProps<'span'>, 'children'> {
  amount: number;
  /** ISO 4217 code. */
  currency: string;
  /** BCP 47 locale. Defaults to the runtime locale. */
  locale?: string;
  /**
   * `auto` colours a credit positive and a debit negative. The sign is always printed, so colour is
   * never the only signal.
   */
  tone?: MoneyTone;
  /** `exceptZero` prints a plus on credits, for movement columns. */
  signDisplay?: 'auto' | 'exceptZero' | 'never';
  /** Wrap debits in parentheses, as ledgers do, instead of a minus sign. */
  accounting?: boolean;
  /** Dim the currency symbol so the figures lead. */
  quietCurrency?: boolean;
}

/** U+2212 MINUS SIGN: the width of a plus, so signed figures stay aligned. */
const MINUS = '\u2212';

export interface FormatMoneyOptions {
  locale?: string | undefined;
  signDisplay?: MoneyProps['signDisplay'];
  accounting?: boolean;
}

/** Locale-correct parts, with the true minus sign instead of the hyphen Intl returns. */
export function formatMoneyParts(
  amount: number,
  currency: string,
  { locale, signDisplay = 'auto', accounting = false }: FormatMoneyOptions = {},
): Intl.NumberFormatPart[] {
  const format = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    currencySign: accounting ? 'accounting' : 'standard',
    signDisplay,
  });
  return format
    .formatToParts(amount)
    .map((part) => (part.type === 'minusSign' ? { ...part, value: MINUS } : part));
}

export function formatMoney(amount: number, currency: string, options?: FormatMoneyOptions) {
  return formatMoneyParts(amount, currency, options)
    .map((p) => p.value)
    .join('');
}

/**
 * A formatted amount in the tabular numeric face, so stacked amounts align digit by digit.
 * Badge was the alternative for the fifth component; Money is the one a finance product shows on
 * every screen, and it is easy to get subtly wrong (hyphen minus, colour-only sign, ragged digits).
 */
export function Money({
  amount,
  currency,
  locale,
  tone = 'neutral',
  signDisplay = 'auto',
  accounting = false,
  quietCurrency = false,
  className,
  ...props
}: MoneyProps) {
  const parts = formatMoneyParts(amount, currency, { locale, signDisplay, accounting });
  const direction = amount > 0 ? 'credit' : amount < 0 ? 'debit' : 'zero';
  return (
    <span
      data-slot="money"
      data-direction={direction}
      className={cn(
        'font-(family-name:--rx-money-family) whitespace-nowrap tabular-nums lining-nums',
        tone === 'auto' && direction === 'credit' && 'text-positive-strong',
        tone === 'auto' && direction === 'debit' && 'text-negative-strong',
        className,
      )}
      {...props}
    >
      {parts.map((part, index) =>
        part.type === 'currency' && quietCurrency ? (
          <span
            key={`${part.type}-${String(index)}`}
            className={cn(tone === 'neutral' && 'text-fg-muted')}
          >
            {part.value}
          </span>
        ) : (
          part.value
        ),
      )}
    </span>
  );
}
