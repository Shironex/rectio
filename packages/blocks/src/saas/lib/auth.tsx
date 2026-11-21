import { EyeIcon, EyeSlashIcon, WarningCircleIcon, CheckCircleIcon } from '@phosphor-icons/react';
import { Anchor, Input, cn, type InputProps } from '@rectio/ui';
import { useEffect, useId, useRef, useState, type ComponentProps, type ReactNode } from 'react';

import { useBlockParts } from '../../lib/block-parts';
import { focusRing, inlineLink, touchTarget } from './styles';

export interface AuthFrameProps extends Omit<ComponentProps<'section'>, 'title'> {
  /** Your mark or product name, above the heading. */
  brand?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  /** Under the form, on a hairline: "No account? Sign up". */
  footer?: ReactNode;
  headingLevel?: 1 | 2;
  /** Drop the frame (border, surface, padding) to place the form in a layout of your own. */
  bare?: boolean;
  /**
   * A brand panel beside the form on wide containers: a product line, a customer quote, what the
   * account unlocks. It folds away on narrow ones, where the form alone fills the frame.
   */
  aside?: ReactNode;
  /**
   * Moves focus to the heading on mount. Set it on a step that replaces another (a link sent, the
   * next step of a reset), so keyboard and screen reader users hear where they are now.
   */
  focusHeading?: boolean;
}

/**
 * The frame of every account form: a narrow panel with the brand, a heading that names the step,
 * the form, and a footer that offers the other way in. It is a labelled section, so a page holding
 * only the form still reads with a landmark and a heading.
 */
export function AuthFrame({
  brand,
  title,
  description,
  footer,
  headingLevel = 1,
  bare = false,
  aside,
  focusHeading = false,
  className,
  children,
  ...props
}: AuthFrameProps) {
  const { Reveal } = useBlockParts();
  const headingId = useId();
  const heading = useRef<HTMLHeadingElement | null>(null);
  useEffect(() => {
    if (focusHeading) heading.current?.focus();
  }, [focusHeading]);
  const Heading = headingLevel === 1 ? 'h1' : 'h2';
  const form = (
    <>
      <Reveal
        className={cn(
          'flex flex-col gap-6',
          !bare && 'px-6 pt-7 pb-6 @sm:px-8 @sm:pt-9',
          // Beside a brand panel the form keeps its own measure, centred in its half.
          aside !== undefined && 'mx-auto w-full max-w-md flex-1 justify-center',
        )}
      >
        <header className="flex flex-col gap-1.5">
          {brand !== undefined && <div className="mb-5 flex items-center text-fg">{brand}</div>}
          <Heading
            ref={heading}
            id={headingId}
            tabIndex={-1}
            className="font-display text-2xl font-heading tracking-tight text-balance outline-none"
          >
            {title}
          </Heading>
          {description !== undefined && (
            <p className="text-base text-pretty text-fg-muted">{description}</p>
          )}
        </header>
        {children}
      </Reveal>
      {footer !== undefined && (
        <footer
          className={cn(
            'text-center text-sm text-fg-muted',
            !bare && 'mt-auto border-t border-line bg-surface-sunken px-6 py-4',
            !bare && aside === undefined && 'rounded-b-panel',
          )}
        >
          {footer}
        </footer>
      )}
    </>
  );
  return (
    <section
      aria-labelledby={headingId}
      data-slot="block"
      className={cn(
        '@container mx-auto flex w-full min-w-0 flex-col text-fg',
        aside === undefined ? 'max-w-md' : 'max-w-5xl',
        !bare && 'rounded-panel border border-line bg-surface shadow-raised',
        // The panel and the footer meet the rounded corners: clip them to the frame.
        !bare && aside !== undefined && 'overflow-clip',
        className,
      )}
      {...props}
    >
      {aside === undefined ? (
        form
      ) : (
        <div className="grid flex-1 @3xl:grid-cols-2">
          <div className="hidden flex-col border-e border-line bg-surface-sunken p-10 @3xl:flex">
            {aside}
          </div>
          <div className="flex w-full flex-col">{form}</div>
        </div>
      )}
    </section>
  );
}

/**
 * A password input with a show and hide button inside its right edge: a toggle with one name,
 * "Show password", pressed while the password shows. It keeps its place after the input.
 */
export function PasswordInput({
  autoComplete,
  className,
  ...props
}: Omit<InputProps, 'type' | 'autoComplete'> & {
  /** Tells password managers whether to fill a saved password or offer a new one. */
  autoComplete: 'current-password' | 'new-password';
}) {
  const [visible, setVisible] = useState(false);
  const Icon = visible ? EyeSlashIcon : EyeIcon;
  return (
    <div className="relative">
      <Input
        type={visible ? 'text' : 'password'}
        autoComplete={autoComplete}
        className={cn('pe-11', className)}
        {...props}
      />
      <button
        type="button"
        aria-label="Show password"
        aria-pressed={visible}
        onClick={() => {
          setVisible((current) => !current);
        }}
        className={cn(
          'absolute inset-y-0 end-0 my-auto me-1 inline-flex size-(--rx-button-height-sm) cursor-pointer items-center justify-center rounded-control',
          'text-fg-subtle transition-colors duration-fast ease-standard hover:bg-surface-hover hover:text-fg',
          focusRing,
          touchTarget,
        )}
      >
        <Icon aria-hidden weight="bold" className="size-4" />
      </button>
    </div>
  );
}

/** "or", centred on a hairline between the social buttons and the email form. */
export function OrDivider({ children = 'or' }: { children?: ReactNode }) {
  return (
    <div className="flex items-center gap-3 text-sm text-fg-muted">
      <span aria-hidden className="h-px flex-1 bg-line" />
      <span>{children}</span>
      <span aria-hidden className="h-px flex-1 bg-line" />
    </div>
  );
}

/**
 * A message about the whole form, above its fields: a failed sign in, a link sent. Errors are
 * announced at once; confirmations politely. Icon and words, never colour alone.
 */
export function FormMessage({
  id,
  tone,
  title,
  children,
}: {
  /** Lets a field point at the message with `aria-describedby`. */
  id?: string;
  tone: 'error' | 'success';
  title: ReactNode;
  children?: ReactNode;
}) {
  const Icon = tone === 'error' ? WarningCircleIcon : CheckCircleIcon;
  return (
    <div
      id={id}
      role={tone === 'error' ? 'alert' : 'status'}
      // Half the status tint under a toned hairline: warm enough to read as a status in light,
      // without the full fill that shouts in the dark themes.
      className={cn(
        'flex items-start gap-2.5 rounded-control border px-3 py-2.5 text-sm',
        tone === 'error'
          ? 'border-negative-strong/30 bg-negative-subtle/50 text-negative-strong'
          : 'border-positive-strong/30 bg-positive-subtle/50 text-positive-strong',
      )}
    >
      <Icon aria-hidden weight="bold" className="mt-0.5 size-4 shrink-0" />
      <div className="flex flex-col gap-0.5">
        <p className="font-medium">{title}</p>
        {children !== undefined && <p className="text-fg-muted">{children}</p>}
      </div>
    </div>
  );
}

/**
 * Where a link in a form goes: a URL renders the kit's `Anchor`, which follows a `LinkProvider`; a
 * function renders a button that calls it.
 */
export type LinkTarget = string | (() => void);

/** An inline link to another step, such as "Forgot password?" or "Sign up". */
export function AuthLink({
  to,
  className,
  children,
}: {
  to: LinkTarget;
  className?: string;
  children: ReactNode;
}) {
  // A 44px hit area on touch screens, without moving the text around it.
  const classes = cn(inlineLink, 'relative', touchTarget, className);
  if (typeof to === 'string') {
    return (
      <Anchor href={to} className={classes}>
        {children}
      </Anchor>
    );
  }
  return (
    <button type="button" onClick={to} className={classes}>
      {children}
    </button>
  );
}

/**
 * A full-width button for one sign-in provider. Pass your provider's own mark as `icon`: the kit
 * draws no brand logos, so their colours and shapes stay yours to license.
 */
export function SocialButton({
  icon,
  children,
  ...props
}: Omit<ComponentProps<'button'>, 'className'> & { icon?: ReactNode }) {
  return (
    <button
      type="button"
      className={cn(
        'relative inline-flex h-(--rx-button-height-md) w-full cursor-pointer items-center justify-center gap-2.5 rounded-(--rx-button-radius) px-(--rx-button-padding-x-md)',
        'pointer-coarse:h-(--rx-button-height-touch)',
        'border border-line bg-surface-raised text-base font-medium text-fg shadow-raised',
        'transition-[background-color,scale] duration-fast ease-standard hover:bg-surface-hover',
        'active:scale-(--rx-motion-scale-press) disabled:cursor-not-allowed disabled:text-fg-disabled',
        '[&_svg]:size-4 [&_svg]:shrink-0',
        focusRing,
      )}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}
