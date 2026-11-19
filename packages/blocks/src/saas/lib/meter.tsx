import { Meter } from '@base-ui/react/meter';
import { cn } from '@rectio/ui';
import type { ReactNode } from 'react';

export type MeterLevel = 'ok' | 'warning' | 'over';

// A calm allowance is neutral ink; colour is kept for the levels that ask for attention, so a
// theme whose accent sits near amber (ledger's citron) never reads as a warning.
const FILL: Record<MeterLevel, string> = {
  ok: 'bg-fg-muted',
  warning: 'bg-warning',
  over: 'bg-negative',
};

export interface UsageMeterProps {
  label: ReactNode;
  /** What is used, in the meter's own unit. */
  value: number;
  max: number;
  /** "8,420 of 10,000 runs": the figure in words, read out with the label. */
  valueText: string;
  level?: MeterLevel;
  /** A line under the bar, such as "Resets on 1 April". */
  note?: ReactNode;
  className?: string;
}

/**
 * How much of an allowance is used: a labelled bar with the figure in words beside it. The level
 * changes the fill and the note carries the words, so a full meter is never red alone.
 */
export function UsageMeter({
  label,
  value,
  max,
  valueText,
  level = 'ok',
  note,
  className,
}: UsageMeterProps) {
  const clamped = Math.min(Math.max(value, 0), max);
  return (
    <Meter.Root
      value={clamped}
      max={max}
      getAriaValueText={() => valueText}
      className={cn('flex flex-col gap-1.5', className)}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
        <Meter.Label className="text-sm font-medium text-fg">{label}</Meter.Label>
        <span className="text-sm text-fg-muted numeric">{valueText}</span>
      </div>
      {/* The track is the sunken surface with a hairline, so an empty meter still reads as one. */}
      <Meter.Track className="h-1 w-full overflow-hidden rounded-full bg-surface-sunken ring-1 ring-line ring-inset">
        <Meter.Indicator className={cn('h-full rounded-full', FILL[level])} />
      </Meter.Track>
      {note !== undefined && (
        <p
          className={cn(
            'text-sm text-fg-muted',
            level === 'warning' && 'text-warning-strong',
            level === 'over' && 'text-negative-strong',
          )}
        >
          {note}
        </p>
      )}
    </Meter.Root>
  );
}
