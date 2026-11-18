import { NumberField } from '@base-ui/react/number-field';
import type { ComponentProps } from 'react';

import { controlSurface } from '../field/field';
import { cn } from '../lib/cn';

export interface AmountInputProps extends Omit<
  ComponentProps<typeof NumberField.Root>,
  'className' | 'format'
> {
  className?: string;
  /** ISO 4217 code. Sets the symbol and the number of decimals. */
  currency: string;
  /** BCP 47 locale for grouping, decimals and the symbol position. */
  locale?: string;
  placeholder?: string;
  /** Only when no FieldLabel names the input. */
  'aria-label'?: string;
}

/** Symbol and position of a currency in a locale, read from Intl. */
function currencyAffix(currency: string, locale: string | undefined) {
  const parts = new Intl.NumberFormat(locale, { style: 'currency', currency }).formatToParts(1);
  const index = parts.findIndex((p) => p.type === 'currency');
  const integer = parts.findIndex((p) => p.type === 'integer');
  return { symbol: parts[index]?.value ?? currency, before: index < integer };
}

/**
 * A money entry field on Base UI's NumberField. Parses and formats with Intl in the given locale,
 * shows the currency as a fixed affix, and sets figures in the tabular numeric face so a column of
 * amounts lines up. Wrap it in a Field for the label, description and error.
 */
export function AmountInput({
  currency,
  locale,
  placeholder,
  'aria-label': ariaLabel,
  className,
  min = 0,
  step = 0.01,
  ...props
}: AmountInputProps) {
  const digits =
    new Intl.NumberFormat(locale, { style: 'currency', currency }).resolvedOptions()
      .maximumFractionDigits ?? 2;
  const { symbol, before } = currencyAffix(currency, locale);
  // Decorative: the symbol is outside the input, so screen readers would not tie it to the value.
  // Name the currency in the label or description instead ("Amount, PLN").
  const affix = (
    <span aria-hidden className="shrink-0 text-fg-subtle select-none">
      {symbol}
    </span>
  );
  return (
    <NumberField.Root
      data-slot="amount-input"
      locale={locale}
      min={min}
      step={step}
      format={{ minimumFractionDigits: digits, maximumFractionDigits: digits }}
      className={cn('w-full', className)}
      {...props}
    >
      <NumberField.Group
        className={cn(
          controlSurface,
          'flex items-center gap-2 px-(--rx-field-padding-x) numeric',
          'has-focus-visible:outline-2 has-focus-visible:outline-focus',
        )}
      >
        {before && affix}
        <NumberField.Input
          placeholder={placeholder}
          aria-label={ariaLabel}
          className={cn(
            'h-full min-w-0 flex-1 bg-transparent outline-none placeholder:text-fg-subtle',
            // The figures sit against the symbol, so "€ 129.40" and "129,40 €" each read as one.
            before ? 'text-start' : 'text-end',
            'data-disabled:cursor-not-allowed',
          )}
        />
        {!before && affix}
      </NumberField.Group>
    </NumberField.Root>
  );
}
