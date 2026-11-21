'use client';

import { Toggle as BaseToggle } from '@base-ui/react/toggle';
import { ToggleGroup as BaseToggleGroup } from '@base-ui/react/toggle-group';
import { createContext, use, useId, useMemo, type ComponentProps, type ReactNode } from 'react';

import { controlFocus } from '../field/control-styles';
import { cn, touchHitArea } from '../lib/cn';

type WithClassName<P> = Omit<P, 'className'> & { className?: string };

export type ToggleSize = 'sm' | 'md';

/** Set by a ToggleGroup, so its toggles take the group's size and the segmented look. */
const GroupContext = createContext<{ size: ToggleSize } | null>(null);

const SIZES: Record<ToggleSize, string> = {
  sm: 'px-(--rx-button-padding-x-sm) text-sm gap-1.5',
  md: 'px-(--rx-button-padding-x-md) text-base gap-2',
};

/**
 * Heights of a toggle on its own, as Button: on touch screens medium grows to the touch height and
 * small reaches it through the hit area. In a group the segments fill the group's height instead.
 */
const HEIGHTS: Record<ToggleSize, string> = {
  sm: 'h-(--rx-button-height-sm)',
  md: 'h-(--rx-button-height-md) pointer-coarse:h-(--rx-button-height-touch)',
};

const ICON_ONLY: Record<ToggleSize, string> = {
  sm: 'w-(--rx-button-height-sm) px-0',
  md: 'w-(--rx-button-height-md) pointer-coarse:w-(--rx-button-height-touch) px-0',
};

/** A segmented group grows to the touch height on touch screens at either size. */
const GROUP_HEIGHTS: Record<ToggleSize, string> = {
  sm: 'h-(--rx-button-height-sm) pointer-coarse:h-(--rx-button-height-touch)',
  md: 'h-(--rx-button-height-md) pointer-coarse:h-(--rx-button-height-touch)',
};

/** Alone, a toggle reads like a ghost button that stays down: a filled surface and an edge. */
const STANDALONE = cn(
  'rounded-(--rx-button-radius) border border-transparent text-fg-muted',
  'hover:bg-surface-hover hover:text-fg',
  'data-pressed:border-line-strong data-pressed:bg-surface-selected data-pressed:text-fg',
);

/**
 * In a group, the pressed segment is a raised chip on the sunken track. `data-glide` on the group
 * hands that chip to the motion add-on's sliding indicator, so the two never draw at once.
 */
const SEGMENT = cn(
  'h-full rounded-(--rx-button-radius) text-fg-muted hover:text-fg',
  'data-pressed:text-fg',
  'data-pressed:not-in-data-glide:bg-surface-overlay data-pressed:not-in-data-glide:shadow-raised',
  // An edge as well as the lift, so the chosen segment reads on any surface.
  'data-pressed:not-in-data-glide:ring-1 data-pressed:not-in-data-glide:ring-line-strong',
  'relative focus-visible:z-10',
  // The track's padding takes a few pixels off each segment; the hit area reaches the track's edge
  // so a segment is still a 44px target on touch screens.
  'pointer-coarse:after:absolute pointer-coarse:after:inset-x-0 pointer-coarse:after:-inset-y-1',
);

export type ToggleProps = WithClassName<ComponentProps<typeof BaseToggle>> & {
  /** Taken from the group when the toggle sits in a ToggleGroup. */
  size?: ToggleSize;
  /** A square toggle holding only an icon. Give it an `aria-label`. */
  iconOnly?: boolean;
  children?: ReactNode;
};

/**
 * A button that stays pressed, on Base UI: a view option or a filter that applies at once, such
 * as "Show archived". Screen readers hear it as pressed or not. In a ToggleGroup, give each
 * toggle a `value`.
 */
export function Toggle({ size, iconOnly = false, className, ...props }: ToggleProps) {
  const group = use(GroupContext);
  const resolved = group?.size ?? size ?? 'md';
  return (
    <BaseToggle
      data-slot="toggle"
      className={cn(
        'inline-flex shrink-0 cursor-pointer items-center justify-center font-(--rx-button-weight) whitespace-nowrap select-none',
        'transition-[background-color,color,border-color,box-shadow] duration-fast ease-standard',
        controlFocus,
        'data-disabled:cursor-not-allowed data-disabled:text-fg-disabled data-disabled:hover:bg-transparent',
        SIZES[resolved],
        group === null
          ? cn(STANDALONE, HEIGHTS[resolved], iconOnly && ICON_ONLY[resolved])
          : cn(SEGMENT, iconOnly && 'aspect-square px-0'),
        group === null && resolved === 'sm' && cn('relative', touchHitArea),
        className,
      )}
      {...props}
    />
  );
}

export type ToggleGroupProps = WithClassName<ComponentProps<typeof BaseToggleGroup>> & {
  /** Sets the size of every toggle in the group. */
  size?: ToggleSize;
  /**
   * A visible name above the group, such as "Period". Without it, give the group an
   * `aria-label`.
   */
  legend?: ReactNode;
  /**
   * In single selection, pressing the chosen toggle again clears the choice. Off by default: a
   * segmented control always shows one choice.
   */
  allowEmpty?: boolean;
};

/**
 * Toggles drawn as one segmented control, on Base UI. Single selection by default, for a view
 * switch such as Day, Week, Month; set `multiple` for independent filters. Arrow keys move
 * between toggles, Space or Enter presses. The value is always an array of toggle values.
 */
export function ToggleGroup({
  size = 'md',
  legend,
  allowEmpty = false,
  multiple = false,
  onValueChange,
  className,
  children,
  ...props
}: ToggleGroupProps) {
  const legendId = useId();
  const context = useMemo(() => ({ size }), [size]);
  const group = (
    <BaseToggleGroup
      data-slot="toggle-group"
      multiple={multiple}
      {...(legend === undefined ? {} : { 'aria-labelledby': legendId })}
      onValueChange={(value, details) => {
        // Keep one segment chosen: cancelling leaves an uncontrolled group as it was.
        if (!multiple && !allowEmpty && value.length === 0) {
          details.cancel();
          return;
        }
        onValueChange?.(value, details);
      }}
      className={cn(
        'inline-flex w-fit items-center gap-0.5 p-0.5',
        'rounded-(--rx-button-radius) border border-line bg-surface-sunken',
        GROUP_HEIGHTS[size],
        className,
      )}
      {...props}
    >
      <GroupContext value={context}>{children}</GroupContext>
    </BaseToggleGroup>
  );
  if (legend === undefined) return group;
  return (
    <div data-slot="toggle-group-field" className="flex flex-col gap-1.5">
      <span id={legendId} className="text-sm font-medium text-fg">
        {legend}
      </span>
      {group}
    </div>
  );
}

export interface SegmentedOption<Value extends string = string> {
  value: Value;
  label: ReactNode;
  /** A count or figure after the label, such as the number of invoices in a status. */
  hint?: ReactNode;
  disabled?: boolean;
}

export type SegmentedControlProps<Value extends string = string> = Omit<
  ToggleGroupProps,
  'value' | 'defaultValue' | 'onValueChange' | 'multiple' | 'allowEmpty' | 'children' | 'aria-label'
> & {
  /** Names the control for screen readers, such as "Status". Use `legend` for a visible name. */
  label?: string;
  options: readonly SegmentedOption<Value>[];
  value?: Value;
  defaultValue?: Value;
  onValueChange?: (value: Value) => void;
  /**
   * `columns` (default): one row while it fits; in a narrow container (under 28rem, inside an
   * `@container`) or on a phone the options sit in two even columns, so every label stays whole and
   * in sight. `row`: always one row, for two or three short options.
   */
  layout?: 'columns' | 'row';
};

/**
 * One choice from a few, always in sight: a status filter or a period switch. A ToggleGroup with
 * single selection that always keeps one option chosen, driven by a list of options and a single
 * value instead of toggles and an array. Arrow keys move between options, Space or Enter picks.
 */
export function SegmentedControl<Value extends string = string>({
  label,
  options,
  value,
  defaultValue,
  onValueChange,
  layout = 'columns',
  size = 'md',
  className,
  ...props
}: SegmentedControlProps<Value>) {
  const columns = layout === 'columns';
  return (
    <ToggleGroup
      data-slot="segmented-control"
      {...(label === undefined ? {} : { 'aria-label': label })}
      {...(value === undefined ? {} : { value: [value] })}
      {...(defaultValue === undefined ? {} : { defaultValue: [defaultValue] })}
      onValueChange={(next) => {
        const picked = next[0] as Value | undefined;
        if (picked !== undefined) onValueChange?.(picked);
      }}
      size={size}
      className={cn(
        'max-w-full',
        columns && [
          'flex-wrap',
          // Two even columns in a narrow container or on a phone, instead of a ragged wrap. Each
          // row keeps the control's height, so the options stay level with a button beside them.
          '@max-md:grid @max-md:h-auto @max-md:w-full @max-md:grid-cols-2',
          'max-sm:grid max-sm:h-auto max-sm:w-full max-sm:grid-cols-2',
          // The group's touch height comes later in the sheet; the grid grows past it.
          '@max-md:pointer-coarse:h-auto max-sm:pointer-coarse:h-auto',
          SEGMENT_ROWS[size],
        ],
        className,
      )}
      {...props}
    >
      {options.map((option) => (
        <Toggle
          key={option.value}
          value={option.value}
          {...(option.disabled === true ? { disabled: true } : {})}
          className={cn(
            'shrink-0 grow',
            // An odd last option takes the whole row, so no empty cell sits beside it.
            columns && '@max-md:last:odd:col-span-2 max-sm:last:odd:col-span-2',
          )}
        >
          {option.label}
          {/* A space for the accessible name ("Unpaid 11"); the flex gap draws the visible one. */}
          {option.hint !== undefined && ' '}
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

/** Row height of a segmented control laid out in two columns: the control's own height. */
const SEGMENT_ROWS: Record<ToggleSize, string> = {
  sm: '@max-md:auto-rows-(--rx-button-height-sm) max-sm:auto-rows-(--rx-button-height-sm) pointer-coarse:auto-rows-(--rx-button-height-touch)',
  md: '@max-md:auto-rows-(--rx-button-height-md) max-sm:auto-rows-(--rx-button-height-md) pointer-coarse:auto-rows-(--rx-button-height-touch)',
};
