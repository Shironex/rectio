import { Separator as BaseSeparator } from '@base-ui/react/separator';
import type { ComponentProps, ReactNode } from 'react';

import { cn } from '../lib/cn';

type WithClassName<P> = Omit<P, 'className'> & { className?: string };

export type SeparatorProps = WithClassName<ComponentProps<typeof BaseSeparator>> & {
  /**
   * Words in the middle of a horizontal rule, such as `or` between two ways to sign in. The words
   * are read; the two hairlines around them are not.
   */
  label?: ReactNode | undefined;
  /** `strong` for a rule that has to hold its own against busy content, such as a totals line. */
  tone?: 'default' | 'strong' | undefined;
};

const TONES = { default: 'bg-line', strong: 'bg-line-strong' } as const;

/**
 * A hairline between groups of content. Horizontal by default; vertical between items in a row,
 * where it stretches to the row's height.
 */
export function Separator({
  orientation = 'horizontal',
  label,
  tone = 'default',
  className,
  ...props
}: SeparatorProps) {
  const line = orientation === 'vertical' ? 'w-px self-stretch shrink-0' : 'h-px w-full shrink-0';
  if (label !== undefined && orientation === 'horizontal') {
    return (
      <div
        data-slot="separator"
        className={cn('flex w-full items-center gap-3 text-xs text-fg-subtle', className)}
      >
        <BaseSeparator {...props} className={cn('flex-1', line, TONES[tone])} />
        <span className="shrink-0 font-medium tracking-caps uppercase">{label}</span>
        <BaseSeparator {...props} className={cn('flex-1', line, TONES[tone])} />
      </div>
    );
  }
  return (
    <BaseSeparator
      data-slot="separator"
      orientation={orientation}
      className={cn(line, TONES[tone], className)}
      {...props}
    />
  );
}
