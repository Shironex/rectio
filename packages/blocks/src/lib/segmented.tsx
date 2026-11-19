import { Toggle } from '@base-ui/react/toggle';
import { ToggleGroup } from '@base-ui/react/toggle-group';
import { cn } from '@rectio/ui';
import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';

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

/** Which ends of the row have options scrolled out of sight: `start`, `end`, both or neither. */
function useOverflow(value: string) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [overflow, setOverflow] = useState('');

  useLayoutEffect(() => {
    const row = ref.current;
    if (row === null) return;
    const measure = () => {
      const start = row.scrollLeft > 1;
      const end = row.scrollLeft + row.clientWidth < row.scrollWidth - 1;
      setOverflow([start && 'start', end && 'end'].filter(Boolean).join(' '));
    };
    measure();
    row.addEventListener('scroll', measure, { passive: true });
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
    observer?.observe(row);
    return () => {
      row.removeEventListener('scroll', measure);
      observer?.disconnect();
    };
  }, []);

  // The chosen option is always in sight, also when it was chosen from outside the row.
  useLayoutEffect(() => {
    const row = ref.current;
    const pressed = row?.querySelector<HTMLElement>('[data-pressed]');
    if (row == null || pressed == null) return;
    const left = pressed.offsetLeft - row.offsetLeft;
    if (left < row.scrollLeft) row.scrollLeft = left;
    else if (left + pressed.offsetWidth > row.scrollLeft + row.clientWidth)
      row.scrollLeft = left + pressed.offsetWidth - row.clientWidth;
  }, [value]);

  return { ref, overflow };
}

/**
 * One choice from a few, always visible: a status filter or a period switch. Arrow keys move
 * between options and the pressed one is announced; pressing the chosen option again keeps it.
 * Always one row: on a narrow block it scrolls sideways, and the end that hides options fades out
 * so the row reads as continuing.
 */
export function Segmented<Value extends string>({
  label,
  value,
  onValueChange,
  options,
  className,
}: SegmentedProps<Value>) {
  const { ref, overflow } = useOverflow(value);
  return (
    <ToggleGroup<Value>
      ref={ref}
      aria-label={label}
      value={[value]}
      onValueChange={(next) => {
        const picked = next[0];
        if (picked !== undefined) onValueChange(picked);
      }}
      data-slot="segmented"
      data-overflow={overflow === '' ? undefined : overflow}
      className={cn(
        'flex w-fit max-w-full gap-0.5 rounded-control border border-line bg-surface-sunken p-0.5',
        'snap-x snap-proximity scroll-px-0.5 overflow-x-auto overscroll-x-contain scrollbar-none',
        'data-[overflow~=end]:mask-r-from-80% data-[overflow~=start]:mask-l-from-80%',
        className,
      )}
    >
      {options.map((option) => (
        <Toggle
          key={option.value}
          value={option.value}
          className={cn(
            'inline-flex h-(--rx-control-height-sm) shrink-0 grow snap-start cursor-pointer items-center justify-center gap-1.5 rounded-control px-2.5',
            'pointer-coarse:h-(--rx-control-height-touch) pointer-coarse:px-3.5',
            'text-sm font-medium whitespace-nowrap text-fg-muted',
            'transition-[background-color,color,box-shadow] duration-fast ease-standard',
            'hover:text-fg data-pressed:bg-surface-raised data-pressed:text-fg data-pressed:shadow-raised',
            // A hairline as well as the fill, so the chosen option holds in dark mode too.
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
