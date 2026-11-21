import { Toggle } from '@base-ui/react/toggle';
import { ToggleGroup } from '@base-ui/react/toggle-group';
import { cn } from '@rectio/ui';
import type { ReactNode } from 'react';

export interface SegmentedOption<Value extends string> {
  value: Value;
  label: ReactNode;
  /** A count or figure after the label, such as the number of invoices in a status. */
  hint?: ReactNode;
}

export interface SegmentedProps<Value extends string> {
  /** Names the group, such as "Status" or "Period". */
  label: string;
  value: Value;
  onValueChange: (value: Value) => void;
  options: readonly SegmentedOption<Value>[];
  className?: string;
}

/**
 * One choice from a few, always visible: a status filter or a period switch. Arrow keys move
 * between options and the pressed one is announced; pressing the chosen option again keeps it.
 * One row while it fits. In a narrow block (under 28rem) and on a phone the options sit in two even
 * columns instead of a ragged wrap, so every label stays whole and every option stays in sight;
 * only a row that still cannot fit on a wider block wraps, and nothing ever scrolls out of view.
 */
export function Segmented<Value extends string>({
  label,
  value,
  onValueChange,
  options,
  className,
}: SegmentedProps<Value>) {
  return (
    <ToggleGroup<Value>
      aria-label={label}
      value={[value]}
      onValueChange={(next) => {
        const picked = next[0];
        if (picked !== undefined) onValueChange(picked);
      }}
      data-slot="segmented"
      className={cn(
        'flex w-fit max-w-full flex-wrap gap-0.5 rounded-control border border-line bg-surface-sunken p-0.5',
        // In a narrow block or on a phone, two even columns instead of a row that breaks unevenly.
        '@max-md:grid @max-md:w-full @max-md:grid-cols-2',
        'max-sm:grid max-sm:w-full max-sm:grid-cols-2',
        className,
      )}
    >
      {options.map((option) => (
        <Toggle
          key={option.value}
          value={option.value}
          className={cn(
            'inline-flex h-(--rx-control-height-sm) shrink-0 grow cursor-pointer items-center justify-center gap-1.5 rounded-control px-2.5',
            'pointer-coarse:h-(--rx-control-height-touch) pointer-coarse:px-3.5',
            // An odd last option takes the whole row on a phone, so no empty cell sits beside it.
            '@max-md:last:odd:col-span-2 max-sm:last:odd:col-span-2',
            'text-sm font-medium whitespace-nowrap text-fg-muted',
            'transition-[background-color,color,box-shadow] duration-fast ease-standard',
            // The raised chip on the sunken track, as the kit's segmented tabs and toggle group.
            'hover:text-fg data-pressed:bg-surface-overlay data-pressed:text-fg data-pressed:shadow-raised',
            // A hairline as well as the lift, so the chosen option holds in dark mode too.
            'data-pressed:ring-1 data-pressed:ring-line-strong',
            '-outline-offset-1 focus-visible:outline-2 focus-visible:outline-focus',
          )}
        >
          {option.label}
          {option.hint !== undefined && (
            <span className="text-fg-subtle numeric in-data-pressed:text-fg-muted">
              {option.hint}
            </span>
          )}
        </Toggle>
      ))}
    </ToggleGroup>
  );
}
