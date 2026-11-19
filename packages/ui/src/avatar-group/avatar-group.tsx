import type { ComponentProps, CSSProperties } from 'react';

import { Avatar, type AvatarSize, type AvatarStatus } from '../avatar/avatar';
import { cn } from '../lib/cn';

export interface AvatarGroupItem {
  name: string;
  src?: string | undefined;
  status?: AvatarStatus | undefined;
}

/** How far each avatar tucks under the one before it, by size. */
const OVERLAP: Record<AvatarSize, string> = {
  xs: '-ms-1',
  sm: '-ms-1.5',
  md: '-ms-2',
  lg: '-ms-2.5',
  xl: '-ms-3.5',
};

const CHIP: Record<AvatarSize, string> = {
  xs: 'size-5 text-xs',
  sm: 'size-6 text-xs',
  md: 'size-8 text-xs',
  lg: 'size-10 text-sm',
  xl: 'size-14 text-base',
};

/**
 * Fan out on hover or focus: each avatar moves by its index, so the gaps open evenly from the
 * first. Transform only, so nothing around the group reflows.
 */
const FAN = cn(
  'transition-[translate] duration-base ease-enter motion-reduce:transition-none',
  'group-hover/avatars:translate-x-(--rx-avatar-spread) group-focus-visible/avatars:translate-x-(--rx-avatar-spread)',
);

const spread = (index: number) =>
  ({ '--rx-avatar-spread': `calc(${String(index)} * var(--rx-space-unit))` }) as CSSProperties;

/** `Ana, Tomasz and Lena`, in the language's own list style. */
function listNames(names: readonly string[], locale?: string): string {
  return new Intl.ListFormat(locale, { style: 'long', type: 'conjunction' }).format(names);
}

export interface AvatarGroupProps extends Omit<ComponentProps<'div'>, 'children'> {
  items: readonly AvatarGroupItem[];
  /** What the people are, such as `Approvers`. Names the group for assistive technology. */
  label: string;
  /** Avatars shown before the rest fold into a `+N` chip. */
  max?: number | undefined;
  size?: AvatarSize | undefined;
  square?: boolean | undefined;
  /** `stacked` overlaps the avatars; `spaced` sets them side by side with a small gap. */
  spacing?: 'stacked' | 'spaced' | undefined;
  /**
   * `hover` (default) shows the names under the group on hover and keyboard focus, without a
   * tooltip; `always` keeps them visible; `none` leaves them to assistive technology.
   */
  names?: 'hover' | 'always' | 'none' | undefined;
  /** For the list of names and the `+N` wording. */
  locale?: string | undefined;
}

/**
 * A few people at a glance, such as the approvers of an invoice. The stack fans out a little on
 * hover or focus and the names appear beneath it, so the group is legible without a tooltip and
 * from the keyboard.
 */
export function AvatarGroup({
  items,
  label,
  max = 4,
  size = 'md',
  square = false,
  spacing = 'stacked',
  names = 'hover',
  locale,
  className,
  ...props
}: AvatarGroupProps) {
  // Never fold a single avatar into "+1": it takes the same room as the avatar itself.
  const visible = items.length > max + 1 ? items.slice(0, max) : items;
  const hidden = items.slice(visible.length);
  const stacked = spacing === 'stacked';
  const summary = listNames(
    hidden.length === 0
      ? items.map((item) => item.name)
      : [...visible.map((item) => item.name), `${String(hidden.length)} more`],
    locale,
  );
  const reveal = names === 'hover';
  return (
    <div
      role="group"
      aria-label={label}
      data-slot="avatar-group"
      // Focusable only to reveal the names; there is nothing to press.
      tabIndex={reveal ? 0 : undefined}
      className={cn(
        'group/avatars inline-flex w-fit flex-col items-start gap-1.5 rounded-control',
        reveal && 'outline-offset-4 focus-visible:outline-2 focus-visible:outline-focus',
        className,
      )}
      {...props}
    >
      <ul className={cn('flex items-center', !stacked && 'gap-1')}>
        {visible.map((item, i) => (
          <li
            key={`${item.name}-${String(i)}`}
            // Earlier avatars sit on top, so each status dot stays clear of its neighbour.
            style={stacked ? { ...spread(i), zIndex: visible.length - i } : undefined}
            className={cn('relative flex', stacked && i > 0 && OVERLAP[size], stacked && FAN)}
          >
            <Avatar
              name={item.name}
              src={item.src}
              status={item.status}
              size={size}
              square={square}
              className={cn(stacked && 'ring-2 ring-surface')}
            />
          </li>
        ))}
        {hidden.length > 0 && (
          <li
            style={stacked ? spread(visible.length) : undefined}
            className={cn('relative flex', stacked && [OVERLAP[size], FAN])}
          >
            <span
              role="img"
              aria-label={`${String(hidden.length)} more: ${listNames(
                hidden.map((item) => item.name),
                locale,
              )}`}
              className={cn(
                'inline-flex items-center justify-center font-medium text-fg-muted numeric',
                'border border-line-strong bg-surface-sunken',
                square ? 'rounded-control' : 'rounded-full',
                stacked && 'ring-2 ring-surface',
                CHIP[size],
              )}
            >
              +{hidden.length}
            </span>
          </li>
        )}
      </ul>
      {names !== 'none' && (
        <p
          aria-hidden
          className={cn(
            'max-w-64 text-xs text-fg-muted',
            reveal && [
              'opacity-0 transition-opacity duration-fast ease-standard',
              'group-hover/avatars:opacity-100 group-focus-visible/avatars:opacity-100',
            ],
          )}
        >
          {summary}
        </p>
      )}
    </div>
  );
}
