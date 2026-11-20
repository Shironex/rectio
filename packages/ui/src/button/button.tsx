import { Button as BaseButton } from '@base-ui/react/button';
import { CircleNotchIcon } from '@phosphor-icons/react';
import {
  Children,
  Fragment,
  isValidElement,
  type ComponentProps,
  type ReactElement,
  type ReactNode,
} from 'react';

import { cn, touchHitArea } from '../lib/cn';

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

/**
 * On touch screens medium and large buttons grow to the touch height, level with the fields beside
 * them; small buttons keep their drawn size and reach it through the hit area instead.
 */
const SIZES: Record<ButtonSize, string> = {
  sm: 'h-(--rx-button-height-sm) px-(--rx-button-padding-x-sm) text-sm gap-1.5',
  md: 'h-(--rx-button-height-md) pointer-coarse:h-(--rx-button-height-touch) px-(--rx-button-padding-x-md) text-base gap-2',
  lg: 'h-(--rx-button-height-lg) pointer-coarse:h-(--rx-button-height-touch) px-(--rx-button-padding-x-lg) text-base gap-2',
};

const ICON_ONLY: Record<ButtonSize, string> = {
  sm: 'w-(--rx-button-height-sm) px-0',
  md: 'w-(--rx-button-height-md) pointer-coarse:w-(--rx-button-height-touch) px-0',
  lg: 'w-(--rx-button-height-lg) pointer-coarse:w-(--rx-button-height-touch) px-0',
};

/**
 * Splits a leading icon off a button's children, so the loading spinner can take its slot and the
 * button keeps its width. An element counts as the icon only when a label follows it, or when it
 * is all an icon-only button holds; a lone component child is treated as the label.
 */
export function splitLeadingIcon(
  children: ReactNode,
  iconOnly = false,
): { icon: ReactNode; label: ReactNode } {
  let items = Children.toArray(children);
  const [only] = items;
  if (
    items.length === 1 &&
    isValidElement<{ children?: ReactNode }>(only) &&
    only.type === Fragment
  ) {
    items = Children.toArray(only.props.children);
  }
  const [first, ...rest] = items;
  const isIcon =
    isValidElement(first) &&
    (typeof first.type !== 'string' || first.type === 'svg') &&
    (rest.length > 0 || iconOnly);
  return isIcon ? { icon: first, label: rest } : { icon: null, label: items };
}

/**
 * The loading mark: it turns, and under reduced motion it breathes in place instead. Sized like a
 * button icon, so it can stand in for one.
 */
export function ButtonSpinner({ className }: { className?: string }): ReactElement {
  return (
    <CircleNotchIcon
      aria-hidden
      data-part="spinner"
      weight="bold"
      className={cn('size-4 animate-spin motion-reduce:animate-breathe', className)}
    />
  );
}

export interface ButtonProps extends Omit<ComponentProps<typeof BaseButton>, 'className'> {
  className?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  /**
   * Shows a spinner beside the label and blocks presses while keeping the focus, so keyboard users
   * stay in place and everyone still reads what is happening. A leading icon gives its slot to the
   * spinner, so an icon button keeps its exact width; a text-only button grows by the spinner.
   * Sets `aria-busy`.
   */
  loading?: boolean;
  /** A square button holding only an icon. Give it an `aria-label`. */
  iconOnly?: boolean;
  /**
   * Draws the label and the loading indicator in place of the default spinner swap, for example
   * the motion add-on's morph. Busy semantics stay here: `aria-busy`, blocked presses, kept focus.
   */
  renderContent?: (content: {
    children: ReactNode;
    loading: boolean;
    iconOnly: boolean;
  }) => ReactNode;
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
  renderContent,
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
        'data-disabled:cursor-not-allowed data-disabled:shadow-none data-loading:cursor-progress',
        '[&_svg]:pointer-events-none [&_svg]:shrink-0',
        touchHitArea,
        VARIANTS[variant],
        SIZES[size],
        iconOnly && ICON_ONLY[size],
        disabled && !loading && DISABLED[variant],
        className,
      )}
      {...props}
    >
      {renderContent ? (
        renderContent({ children, loading, iconOnly })
      ) : loading ? (
        <LoadingContent iconOnly={iconOnly}>{children}</LoadingContent>
      ) : (
        children
      )}
    </BaseButton>
  );
}

/**
 * The label stays visible and stays the accessible name. A leading icon keeps its box, hidden,
 * with the spinner drawn over it, so the button keeps its exact width; without one the spinner
 * goes before the label.
 */
function LoadingContent({ children, iconOnly }: { children: ReactNode; iconOnly: boolean }) {
  const { icon, label } = splitLeadingIcon(children, iconOnly);
  if (icon === null) {
    return (
      <>
        <ButtonSpinner />
        {children}
      </>
    );
  }
  return (
    <>
      <span data-part="icon-slot" className="relative inline-flex items-center justify-center">
        <span className="invisible inline-flex">{icon}</span>
        <span className="absolute inset-0 inline-flex items-center justify-center">
          <ButtonSpinner />
        </span>
      </span>
      {label}
    </>
  );
}
