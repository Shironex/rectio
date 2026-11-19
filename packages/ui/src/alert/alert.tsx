import {
  CheckCircleIcon,
  InfoIcon,
  WarningCircleIcon,
  WarningIcon,
  XIcon,
  type Icon,
} from '@phosphor-icons/react';
import { useState, type ComponentProps, type ReactNode } from 'react';

import { cn, touchHitArea } from '../lib/cn';

export type AlertTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';
export type AlertVariant = 'subtle' | 'outline';

const ICONS: Record<AlertTone, Icon> = {
  neutral: InfoIcon,
  info: InfoIcon,
  success: CheckCircleIcon,
  warning: WarningIcon,
  danger: WarningCircleIcon,
};

/** Tinted fill with a faint edge of the same hue. */
const SUBTLE: Record<AlertTone, string> = {
  neutral: 'border-line bg-surface-sunken',
  info: 'border-info-strong/25 bg-info-subtle',
  success: 'border-positive-strong/25 bg-positive-subtle',
  warning: 'border-warning-strong/25 bg-warning-subtle',
  danger: 'border-negative-strong/25 bg-negative-subtle',
};

/** On the surface, for a callout inside a panel; only the icon carries the hue. */
const OUTLINE = 'border-line bg-surface';

export const ALERT_ICON_TONE: Record<AlertTone, string> = {
  neutral: 'text-fg-subtle',
  info: 'text-info-strong',
  success: 'text-positive-strong',
  warning: 'text-warning-strong',
  danger: 'text-negative-strong',
};

export interface DismissButtonProps extends ComponentProps<'button'> {
  /** The button's name. Say what goes away when it is not obvious: `Dismiss notice`. */
  label?: string | undefined;
}

/** The small close button that alerts, banners and callouts share. */
export function DismissButton({ label = 'Dismiss', className, ...props }: DismissButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      className={cn(
        'relative inline-flex size-(--rx-button-height-sm) shrink-0 cursor-pointer items-center justify-center',
        'rounded-(--rx-button-radius) text-current opacity-70 hover:bg-current/10 hover:opacity-100',
        'transition-[background-color,opacity] duration-fast ease-standard',
        'outline-offset-2 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-focus',
        touchHitArea,
        className,
      )}
      {...props}
    >
      <XIcon aria-hidden weight="bold" className="size-3.5" />
    </button>
  );
}

export interface AlertProps extends Omit<ComponentProps<'div'>, 'title'> {
  /** The meaning: `danger` for a failure that blocks, `warning` for a risk, `success` when done. */
  tone?: AlertTone | undefined;
  variant?: AlertVariant | undefined;
  /** One short line that says what happened. The children explain or say what to do. */
  title?: ReactNode | undefined;
  /** Replaces the tone's icon; `null` drops the icon. */
  icon?: ReactNode | undefined;
  /** Buttons or links under the text, such as `Retry` or `Review`. */
  actions?: ReactNode | undefined;
  /** Adds a dismiss button. Uncontrolled unless `open` is passed. */
  dismissible?: boolean | undefined;
  open?: boolean | undefined;
  onDismiss?: (() => void) | undefined;
  dismissLabel?: string | undefined;
  /**
   * Announce the alert when it appears: `assertive` for an error that just happened, `polite` for
   * news. Leave it off for an alert that is part of the page from the start.
   */
  live?: 'polite' | 'assertive' | undefined;
}

/**
 * A message about the page or the task in hand: a failed sync, a policy note, a done import. The
 * icon and the title say the tone, so it reads without colour. Never a side stripe: the whole box
 * carries the tint.
 */
export function Alert({
  tone = 'info',
  variant = 'subtle',
  title,
  icon,
  actions,
  dismissible = false,
  open,
  onDismiss,
  dismissLabel,
  live,
  className,
  children,
  ...props
}: AlertProps) {
  const [dismissed, setDismissed] = useState(false);
  if (open === false || (open === undefined && dismissed)) return null;
  const Glyph = ICONS[tone];
  return (
    <div
      role={live === 'assertive' ? 'alert' : live === 'polite' ? 'status' : undefined}
      data-slot="alert"
      data-tone={tone}
      data-variant={variant}
      className={cn(
        'flex w-full items-start gap-3 rounded-panel border px-4 py-3 text-sm text-fg',
        variant === 'subtle' ? SUBTLE[tone] : OUTLINE,
        className,
      )}
      {...props}
    >
      {icon !== null && (
        <span
          className={cn('flex h-5 shrink-0 items-center [&_svg]:size-4.5', ALERT_ICON_TONE[tone])}
        >
          {icon ?? <Glyph aria-hidden weight="fill" />}
        </span>
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {title !== undefined && <p className="font-medium text-fg">{title}</p>}
        {children !== undefined && <div className="text-fg-muted">{children}</div>}
        {actions !== undefined && <div className="mt-1.5 flex flex-wrap gap-2">{actions}</div>}
      </div>
      {dismissible && (
        <DismissButton
          label={dismissLabel}
          className="-me-1.5 -mt-0.5 text-fg-muted"
          onClick={() => {
            setDismissed(true);
            onDismiss?.();
          }}
        />
      )}
    </div>
  );
}
