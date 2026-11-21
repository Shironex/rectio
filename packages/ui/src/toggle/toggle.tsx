import { Toggle as BaseToggle } from '@base-ui/react/toggle';
import { ToggleGroup as BaseToggleGroup } from '@base-ui/react/toggle-group';
import { createContext, use, useId, useMemo, type ComponentProps, type ReactNode } from 'react';

import { controlFocus } from '../field/field';
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
