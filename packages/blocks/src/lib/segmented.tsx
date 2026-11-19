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
        // Scrolls sideways on a phone rather than wrapping into a second ragged row.
        'flex max-w-full gap-0.5 overflow-x-auto rounded-control border border-line bg-surface-sunken p-0.5',
        className,
      )}
    >
      {options.map((option) => (
        <Toggle
          key={option.value}
          value={option.value}
          className={cn(
            'inline-flex h-(--rx-control-height-sm) shrink-0 cursor-pointer items-center gap-1.5 rounded-control px-2.5',
            'pointer-coarse:h-(--rx-control-height-touch) pointer-coarse:px-3.5',
            'text-sm font-medium whitespace-nowrap text-fg-muted',
            'transition-[background-color,color,box-shadow] duration-fast ease-standard',
            'hover:text-fg data-pressed:bg-surface-raised data-pressed:text-fg data-pressed:shadow-raised',
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
