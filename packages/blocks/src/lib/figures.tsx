import { cn } from '@rectio/ui';
import type { ReactNode } from 'react';

import { useBlockParts } from './block-parts';

export interface Figure {
  label: ReactNode;
  amount: number;
  /** A short line under the figure, such as "4 invoices" or "since 1 March". */
  note?: ReactNode;
  /** Colour the figure by its sign; the sign itself is always printed. */
  signed?: boolean;
  /** Draw attention to the figure, for a total that needs action. Pair it with words in `note`. */
  emphasis?: 'negative' | 'warning';
}

/**
 * A row of headline figures above a table. Plain type on hairlines, not cards: the table below is
 * the content, these are its totals read first.
 */
export function Figures({
  items,
  currency,
  locale,
  className,
}: {
  items: readonly Figure[];
  currency: string;
  locale: string;
  className?: string;
}) {
  const { Money } = useBlockParts();
  return (
    <dl
      className={cn(
        'grid grid-cols-2 gap-px overflow-hidden rounded-control border border-line bg-line @xl:grid-flow-col @xl:auto-cols-fr @xl:grid-cols-none',
        className,
      )}
    >
      {items.map((item, index) => (
        <div key={index} className="flex min-w-0 flex-col gap-0.5 bg-surface px-3.5 py-2.5">
          <dt className="truncate text-sm text-fg-muted">{item.label}</dt>
          <dd className="flex flex-col">
            <Money
              amount={item.amount}
              currency={currency}
              locale={locale}
              tone={item.signed === true ? 'auto' : 'neutral'}
              quietCurrency
              className={cn(
                'text-xl font-strong tracking-tight',
                item.emphasis === 'negative' && 'text-negative-strong',
                item.emphasis === 'warning' && 'text-warning-strong',
              )}
            />
            {item.note !== undefined && (
              <span
                className={cn(
                  'text-sm text-fg-muted',
                  item.emphasis === 'negative' && 'text-negative-strong',
                  item.emphasis === 'warning' && 'text-warning-strong',
                )}
              >
                {item.note}
              </span>
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}
