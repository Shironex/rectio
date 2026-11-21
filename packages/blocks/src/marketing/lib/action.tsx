import { ArrowRightIcon } from '@phosphor-icons/react/ssr';
import { Anchor as KitAnchor, cn } from '@rectio/ui';
import type { ComponentProps, ReactNode } from 'react';

/**
 * A call to action. Marketing actions are links: they go somewhere. Pass `onClick` too when the app
 * routes on the client or tracks the press.
 */
export interface MarketingAction {
  label: string;
  href: string;
  onClick?: (() => void) | undefined;
  /** Opens off site: adds `rel="noopener noreferrer"` and a visually hidden hint. */
  external?: boolean | undefined;
}

/** A plain link in navigation, footers and lists. */
export interface MarketingLink {
  label: string;
  href: string;
  external?: boolean | undefined;
}

export type ActionVariant = 'primary' | 'secondary' | 'ghost' | 'text';
export type ActionSize = 'md' | 'lg';

const VARIANT: Record<ActionVariant, string> = {
  primary:
    'bg-accent text-accent-contrast shadow-raised pointer-fine:hover:bg-accent-hover active:bg-accent-active',
  secondary:
    'border border-line bg-surface-raised text-fg shadow-raised pointer-fine:hover:bg-surface-hover active:bg-surface-sunken',
  ghost: 'text-fg pointer-fine:hover:bg-surface-hover active:bg-surface-sunken',
  text: 'text-fg underline-offset-4 pointer-fine:hover:underline',
};

const SIZE: Record<ActionSize, string> = {
  md: 'h-(--rx-button-height-md) pointer-coarse:h-(--rx-button-height-touch) px-(--rx-button-padding-x-md) text-base',
  lg: 'h-(--rx-button-height-lg) pointer-coarse:h-(--rx-button-height-touch) px-(--rx-button-padding-x-lg) text-base',
};

/** Focus ring shared by every link in the marketing blocks. */
export const linkFocus =
  'rounded-control outline-offset-2 focus-visible:outline-2 focus-visible:outline-focus';

/**
 * The one place a marketing block renders a link: the kit's `Anchor`, so a `LinkProvider` around
 * the app sends every internal link through your router and its base path.
 */
export function Anchor(
  props: ComponentProps<'a'> & { href: string; external?: boolean | undefined },
) {
  return <KitAnchor {...props} />;
}

/**
 * A link drawn as a button, in the button's own tokens: same height, padding, radius, weight and
 * press, so a hero's links sit level with real buttons beside them.
 */
export function ActionLink({
  action,
  variant = 'primary',
  size = 'lg',
  arrow = false,
  className,
}: {
  action: MarketingAction;
  variant?: ActionVariant;
  size?: ActionSize;
  /** Trails the label with an arrow that nudges on hover. */
  arrow?: boolean;
  className?: string;
}) {
  return (
    <Anchor
      href={action.href}
      external={action.external}
      onClick={action.onClick}
      data-slot="action"
      data-variant={variant}
      className={cn(
        'group/action relative inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap select-none',
        'font-(--rx-button-weight) tracking-(--rx-button-tracking)',
        'transition-[background-color,color,box-shadow,scale] duration-fast ease-standard',
        'outline-offset-2 focus-visible:outline-2 focus-visible:outline-focus',
        'active:scale-(--rx-motion-scale-press)',
        variant === 'text'
          ? 'min-h-(--rx-button-height-md) rounded-control pointer-coarse:min-h-(--rx-button-height-touch)'
          : cn('rounded-(--rx-button-radius)', SIZE[size]),
        VARIANT[variant],
        className,
      )}
    >
      {action.label}
      {arrow && (
        <ArrowRightIcon
          aria-hidden
          weight="bold"
          className="size-4 transition-transform duration-fast ease-standard pointer-fine:group-hover/action:translate-x-0.5"
        />
      )}
    </Anchor>
  );
}

/** A primary action and an optional secondary one, side by side, wrapping on narrow screens. */
export function Actions({
  primary,
  secondary,
  align = 'start',
  className,
}: {
  primary?: MarketingAction | undefined;
  secondary?: MarketingAction | undefined;
  align?: 'start' | 'center';
  className?: string;
}): ReactNode {
  if (primary === undefined && secondary === undefined) return null;
  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-3',
        align === 'center' && 'justify-center',
        className,
      )}
    >
      {primary !== undefined && <ActionLink action={primary} arrow />}
      {secondary !== undefined && <ActionLink action={secondary} variant="secondary" />}
    </div>
  );
}
