'use client';

import { Toggle } from '@base-ui/react/toggle';
import { ToggleGroup } from '@base-ui/react/toggle-group';
import { cn } from '@rectio/ui';
import type { ReactNode } from 'react';

export interface SegmentedOption<T extends string> {
  value: T;
  label: ReactNode;
}

/**
 * One choice from a few, as a row of pressed buttons. Arrow keys move between options; the
 * pressed one is the value. Used for mode, width and variant switches on the site.
 */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
  size = 'sm',
  touch = false,
  className,
}: {
  value: T;
  options: readonly SegmentedOption<T>[];
  /** `origin` is the centre of the pressed option, for effects that start where the user acted. */
  onChange: (value: T, origin?: { x: number; y: number }) => void;
  /** Names the group for assistive technology. */
  label: string;
  size?: 'sm' | 'md';
  /** Grows each option to a full touch target on a coarse pointer, for controls used on phones. */
  touch?: boolean;
  className?: string;
}) {
  return (
    <ToggleGroup
      aria-label={label}
      value={[value]}
      onValueChange={(next, details) => {
        const picked = options.find((o) => o.value === next[0]);
        if (picked === undefined) return;
        // Only a pointer press has a place to start from; keyboard changes report no origin.
        const { event } = details;
        // A click from Enter or Space is a MouseEvent too, with no click count.
        const target = event instanceof MouseEvent && event.detail > 0 ? event.target : null;
        const box = target instanceof Element ? target.getBoundingClientRect() : null;
        onChange(
          picked.value,
          box === null ? undefined : { x: box.left + box.width / 2, y: box.top + box.height / 2 },
        );
      }}
      className={cn(
        'inline-flex shrink-0 items-center gap-0.5 rounded-control border border-line bg-surface-sunken p-0.5',
        className,
      )}
    >
      {options.map((option) => (
        <Toggle
          key={option.value}
          value={option.value}
          className={cn(
            'inline-flex cursor-pointer items-center gap-1.5 rounded-control font-medium whitespace-nowrap text-fg-muted select-none',
            'transition-[color,background-color,box-shadow] duration-fast ease-standard',
            'data-pressed:bg-surface-overlay data-pressed:text-fg data-pressed:shadow-raised',
            'pointer-fine:hover:text-fg',
            'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-focus',
            size === 'sm' ? 'h-7 px-2.5 text-sm' : 'h-9 px-3.5 text-base',
            touch && 'pointer-coarse:h-11 pointer-coarse:min-w-11 pointer-coarse:justify-center',
          )}
        >
          {option.label}
        </Toggle>
      ))}
    </ToggleGroup>
  );
}
