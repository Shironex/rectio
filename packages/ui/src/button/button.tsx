import { Button as BaseButton } from '@base-ui/react/button';
import { CircleNotchIcon } from '@phosphor-icons/react';
import type { ComponentProps, ReactNode } from 'react';

import { cn } from '../lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-accent text-accent-contrast shadow-raised hover:bg-accent-hover active:bg-accent-active',
  secondary:
    'border border-line bg-surface-raised text-fg shadow-raised hover:bg-surface-hover active:bg-surface-sunken',
  ghost: 'text-fg hover:bg-surface-hover active:bg-surface-sunken',
  // Outlined, so a destructive action never outweighs the primary one beside it. It fills on
  // hover and press, the moment the user commits.
  danger:
    'border border-negative bg-surface-raised text-negative-strong shadow-raised hover:bg-negative hover:text-negative-contrast active:bg-negative-hover active:text-negative-contrast',
};

/** Disabled recedes to the neutral surface in every variant, never a faded brand colour. */
const DISABLED: Record<ButtonVariant, string> = {
  primary: 'border border-line bg-surface-sunken text-fg-disabled shadow-none',
  secondary: 'border border-line bg-surface-sunken text-fg-disabled shadow-none',
  ghost: 'pointer-events-none text-fg-disabled',
  danger: 'border border-line bg-surface-sunken text-fg-disabled shadow-none',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-(--rx-button-height-sm) px-(--rx-button-padding-x-sm) text-sm gap-1.5',
  md: 'h-(--rx-button-height-md) px-(--rx-button-padding-x-md) text-base gap-2',
  lg: 'h-(--rx-button-height-lg) px-(--rx-button-padding-x-lg) text-base gap-2',
};

const ICON_ONLY: Record<ButtonSize, string> = {
  sm: 'w-(--rx-button-height-sm) px-0',
  md: 'w-(--rx-button-height-md) px-0',
  lg: 'w-(--rx-button-height-lg) px-0',
};

export interface ButtonProps extends Omit<ComponentProps<typeof BaseButton>, 'className'> {
  className?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  /**
   * Shows a spinner and blocks presses while keeping the label's width and the focus, so the
   * layout does not jump and keyboard users stay in place. Sets `aria-busy`.
   */
  loading?: boolean;
  /** A square button holding only an icon. Give it an `aria-label`. */
  iconOnly?: boolean;
  children?: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  iconOnly = false,
  disabled = false,
  type = 'button',
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <BaseButton
      type={type}
      disabled={disabled || loading}
      focusableWhenDisabled={loading}
      aria-busy={loading || undefined}
      data-slot="button"
      data-variant={variant}
      data-size={size}
      data-loading={loading || undefined}
      className={cn(
        'relative inline-flex shrink-0 cursor-pointer items-center justify-center whitespace-nowrap select-none',
        'rounded-(--rx-button-radius) font-(--rx-button-weight) tracking-(--rx-button-tracking)',
        'transition-[background-color,color,box-shadow,scale] duration-fast ease-standard',
        'outline-offset-2 focus-visible:outline-2 focus-visible:outline-focus',
        'active:scale-(--rx-motion-scale-press)',
        'data-disabled:cursor-not-allowed data-disabled:shadow-none',
        '[&_svg]:pointer-events-none [&_svg]:shrink-0',
        VARIANTS[variant],
        SIZES[size],
        iconOnly && ICON_ONLY[size],
        disabled && !loading && DISABLED[variant],
        className,
      )}
      {...props}
    >
      {loading ? (
        <>
          {/* Transparent, not hidden: the label keeps its width and stays the accessible name. */}
          <span className="contents text-transparent">{children}</span>
          <span className="absolute inset-0 inline-flex items-center justify-center">
            <CircleNotchIcon aria-hidden className="size-4 animate-spin" weight="bold" />
          </span>
        </>
      ) : (
        children
      )}
    </BaseButton>
  );
}
