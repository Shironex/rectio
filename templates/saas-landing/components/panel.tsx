import { cn } from '@rectio/ui';
import type { ReactNode } from 'react';

/** A raised surface for a piece of live product UI inside a tile or beside a feature. */
export function Panel({
  children,
  compact = false,
  className,
}: {
  children: ReactNode;
  compact?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-panel border border-line bg-surface-raised text-fg shadow-raised',
        compact ? 'p-4' : 'p-5 sm:p-6',
        className,
      )}
    >
      {children}
    </div>
  );
}
