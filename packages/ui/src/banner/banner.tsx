'use client';

import {
  InfoIcon,
  MegaphoneIcon,
  WarningCircleIcon,
  WarningIcon,
  type Icon,
} from '@phosphor-icons/react';
import { useState, type ComponentProps, type ReactNode } from 'react';

import { DismissButton } from '../alert/alert';
import { cn } from '../lib/cn';

export type BannerTone = 'accent' | 'neutral' | 'info' | 'warning' | 'danger';

const TONES: Record<BannerTone, string> = {
  // The one loud banner: an announcement in the brand's own fill.
  accent: 'bg-accent text-accent-contrast',
  neutral: 'border-b border-line bg-surface-sunken text-fg',
  info: 'border-b border-info-strong/25 bg-info-subtle text-fg',
  warning: 'border-b border-warning-strong/25 bg-warning-subtle text-fg',
  danger: 'bg-negative text-negative-contrast',
};

const ICONS: Record<BannerTone, Icon> = {
  accent: MegaphoneIcon,
  neutral: InfoIcon,
  info: InfoIcon,
  warning: WarningIcon,
  danger: WarningCircleIcon,
};

const ICON_TONE: Record<BannerTone, string> = {
  accent: 'text-current',
  neutral: 'text-fg-subtle',
  info: 'text-info-strong',
  warning: 'text-warning-strong',
  danger: 'text-current',
};

export interface BannerProps extends ComponentProps<'section'> {
  tone?: BannerTone | undefined;
  /** Replaces the tone's icon; `null` drops it. */
  icon?: ReactNode | undefined;
  /** A link or button at the end of the message, such as `See what changed`. */
  action?: ReactNode | undefined;
  dismissible?: boolean | undefined;
  open?: boolean | undefined;
  onDismiss?: (() => void) | undefined;
  dismissLabel?: string | undefined;
  /** Names the banner landmark. */
  label?: string | undefined;
}

/**
 * A page-level announcement across the top of the app: scheduled maintenance, a new feature, an
 * account that needs attention. One at a time; for a message about one part of the page, use an
 * Alert there.
 */
export function Banner({
  tone = 'accent',
  icon,
  action,
  dismissible = false,
  open,
  onDismiss,
  dismissLabel = 'Dismiss announcement',
  label = 'Announcement',
  className,
  children,
  ...props
}: BannerProps) {
  const [dismissed, setDismissed] = useState(false);
  if (open === false || (open === undefined && dismissed)) return null;
  const Glyph = ICONS[tone];
  return (
    <section
      aria-label={label}
      data-slot="banner"
      data-tone={tone}
      className={cn('w-full text-sm', TONES[tone], className)}
      {...props}
    >
      <div className="mx-auto flex min-h-11 w-full max-w-screen-xl items-center gap-3 px-4 py-2 sm:px-6">
        {icon !== null && (
          <span className={cn('flex shrink-0 [&_svg]:size-4.5', ICON_TONE[tone])}>
            {icon ?? <Glyph aria-hidden weight="fill" />}
          </span>
        )}
        <div className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-4 gap-y-1 sm:justify-center">
          <p className="min-w-0 text-pretty">{children}</p>
          {action !== undefined && (
            <span
              data-slot="banner-action"
              className="font-medium underline decoration-current/40 underline-offset-4 hover:decoration-current"
            >
              {action}
            </span>
          )}
        </div>
        {dismissible && (
          <DismissButton
            label={dismissLabel}
            className="-me-1.5"
            onClick={() => {
              setDismissed(true);
              onDismiss?.();
            }}
          />
        )}
      </div>
    </section>
  );
}
