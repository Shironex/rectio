import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentProps,
  type ComponentType,
  type CSSProperties,
} from 'react';

import { cn } from '../lib/cn';

export type SpinnerVariant = 'ring' | 'dots' | 'bars' | 'pulse' | 'orbit';
export type SpinnerSize = 'sm' | 'md' | 'lg' | 'xl';
export type SpinnerTone = 'accent' | 'current' | 'muted';

const SIZES: Record<SpinnerSize, string> = {
  sm: 'size-4',
  md: 'size-6',
  lg: 'size-10',
  xl: 'size-16',
};
const TONES: Record<SpinnerTone, string> = {
  accent: 'text-accent-strong',
  current: 'text-current',
  muted: 'text-fg-subtle',
};

/**
 * The n-th part of a loader starts this far into the cycle (a negative delay), so the parts are
 * already in motion on the first frame instead of waiting their turn.
 */
const phase = (share: number): CSSProperties => ({
  animationDelay: `calc(var(--rx-motion-duration-loop) * ${String(-share)})`,
});

/** Under reduced motion nothing turns or travels: every loader breathes in place instead. */
const STILL = 'motion-reduce:animate-breathe';

function Ring() {
  // The arc fades from its head back along its tail, so it reads as a sweep, not a stamped dash.
  const gradient = useId();
  return (
    <svg viewBox="0 0 24 24" fill="none" className={cn('size-full animate-spin', STILL)}>
      <defs>
        <linearGradient id={gradient} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="currentColor" stopOpacity="0.35" />
          <stop offset="1" stopColor="currentColor" />
        </linearGradient>
      </defs>
      <circle
        cx="12"
        cy="12"
        r="9.5"
        stroke="currentColor"
        strokeWidth="2.5"
        className="opacity-15"
      />
      <circle
        cx="12"
        cy="12"
        r="9.5"
        stroke={`url(#${gradient})`}
        strokeWidth="2.5"
        strokeLinecap="round"
        pathLength={100}
        strokeDasharray="30 100"
        className="origin-center animate-arc motion-reduce:animate-none"
      />
    </svg>
  );
}

function Dots() {
  return (
    <span className="flex size-full items-center justify-around">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={cn('aspect-square w-1/4 rounded-full bg-current animate-dot', STILL)}
          style={phase(1.4 - i * 0.18)}
        />
      ))}
    </span>
  );
}

function Bars() {
  return (
    <span className="flex size-full items-center justify-around">
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          className={cn('h-3/4 w-1/6 rounded-full bg-current animate-bar', STILL)}
          style={phase(1.2 - i * 0.12)}
        />
      ))}
    </span>
  );
}

function Pulse() {
  return (
    <span className="relative flex size-full items-center justify-center">
      {[0, 1].map((i) => (
        <span
          key={i}
          className="absolute inset-0 rounded-full border-2 border-current bg-current/10 animate-ripple motion-reduce:hidden"
          style={phase(i)}
        />
      ))}
      <span className={cn('size-1/3 rounded-full bg-current', STILL)} />
    </span>
  );
}

/**
 * The comet's tail: arcs of the orbit trailing the head, each fainter and thinner, so the head
 * draws a tapered streak instead of a row of dots.
 */
const TAIL = [
  { length: 10, width: 3, opacity: 0.6 },
  { length: 20, width: 2.25, opacity: 0.3 },
  { length: 30, width: 1.5, opacity: 0.12 },
];

function Orbit() {
  return (
    <span className="relative flex size-full">
      <span className="absolute inset-1/8 rounded-full border border-current bg-current/5 opacity-30" />
      <span className={cn('absolute inset-0 animate-orbit', STILL)}>
        {/* Turned a quarter back so the arcs end at twelve o'clock, under the head. */}
        <svg viewBox="0 0 24 24" fill="none" className="absolute inset-0 size-full -rotate-90">
          {TAIL.map(({ length, width, opacity }) => (
            <circle
              key={length}
              cx="12"
              cy="12"
              r="9"
              stroke="currentColor"
              strokeWidth={width}
              strokeLinecap="round"
              strokeOpacity={opacity}
              pathLength={100}
              strokeDasharray={`${String(length)} ${String(100 - length)}`}
              strokeDashoffset={length}
            />
          ))}
        </svg>
        <span className="absolute top-0 left-1/2 size-1/4 -translate-x-1/2 rounded-full bg-current" />
      </span>
    </span>
  );
}

const SHAPES: Record<SpinnerVariant, ComponentType> = {
  ring: Ring,
  dots: Dots,
  bars: Bars,
  pulse: Pulse,
  orbit: Orbit,
};

export interface SpinnerProps extends Omit<ComponentProps<'span'>, 'children'> {
  /**
   * `ring` for most waits; `dots` inline in text and chat-like feeds; `bars` for streams and
   * uploads; `pulse` for something live, such as a sync; `orbit` for longer background work.
   */
  variant?: SpinnerVariant | undefined;
  size?: SpinnerSize | undefined;
  tone?: SpinnerTone | undefined;
  /** What is happening, announced once: `Loading invoices`. */
  label?: string | undefined;
  /** Show the label beside the indicator, not only to assistive technology. */
  showLabel?: boolean | undefined;
  /**
   * Hidden from assistive technology, for a spinner inside something that already says it is busy,
   * such as a button with `aria-busy`.
   */
  decorative?: boolean | undefined;
}

/**
 * An indicator that work is under way and its length is unknown. Prefer a skeleton when the shape
 * of the result is known, and a progress bar when the amount done is.
 */
export function Spinner({
  variant = 'ring',
  size = 'md',
  tone = 'accent',
  label = 'Loading',
  showLabel = false,
  decorative = false,
  className,
  ...props
}: SpinnerProps) {
  const Shape = SHAPES[variant];
  return (
    <span
      role={decorative ? undefined : 'status'}
      aria-hidden={decorative || undefined}
      data-slot="spinner"
      data-variant={variant}
      className={cn('inline-flex items-center gap-2', TONES[tone], className)}
      {...props}
    >
      <span aria-hidden className={cn('inline-flex shrink-0', SIZES[size])}>
        <Shape />
      </span>
      {!decorative && (
        <span className={showLabel ? 'text-sm text-fg-muted' : 'sr-only'}>{label}</span>
      )}
    </span>
  );
}

export interface LoadingOverlayProps extends ComponentProps<'div'> {
  /** While true, the overlay covers its section (or the page) and blocks pointer input. */
  visible: boolean;
  label?: string | undefined;
  /** Cover the viewport instead of the nearest positioned ancestor. */
  fullPage?: boolean | undefined;
  variant?: SpinnerVariant | undefined;
}

/**
 * Covers a section, or the page, while it reloads in place. It fades in only after a short delay,
 * so a fast reload never flashes it. Put it inside a `relative` container, and mark that container
 * `aria-busy` while loading; the overlay's label is announced once.
 */
export function LoadingOverlay({
  visible,
  label = 'Loading',
  fullPage = false,
  variant = 'ring',
  className,
  children,
  ...props
}: LoadingOverlayProps) {
  if (!visible) return null;
  return (
    <div
      data-slot="loading-overlay"
      className={cn(
        'inset-0 z-40 flex items-center justify-center bg-surface/85',
        fullPage ? 'fixed bg-surface-canvas/80' : 'absolute',
        'transition-opacity duration-slow ease-enter delay-(--rx-motion-duration-slow) starting:opacity-0',
        className,
      )}
      {...props}
    >
      {/*
        A section gets a small pill over a dimmed copy of itself, so the content keeps its shape;
        the page gets a panel to hold the eye.
      */}
      <div
        className={cn(
          'flex items-center border border-line bg-surface-overlay shadow-overlay',
          fullPage
            ? 'flex-col gap-3 rounded-panel px-6 py-5'
            : 'gap-2.5 rounded-full py-2 ps-3 pe-4',
        )}
      >
        <Spinner variant={variant} size={fullPage ? 'lg' : 'md'} label={label} />
        <span aria-hidden className="text-sm font-medium text-fg">
          {label}
        </span>
        {children}
      </div>
    </div>
  );
}

export interface LoadingActionOptions {
  /** Milliseconds before the loading state shows, so instant results never flash a spinner. */
  delay?: number | undefined;
  /** Once shown, the loading state stays at least this long (ms), so it never blinks. */
  minimum?: number | undefined;
}

/**
 * Wraps an async action for a Button's `loading` prop. Fast actions finish without any spinner;
 * slow ones show it for long enough to read. Calls while one is running are ignored, so a double
 * press never submits twice.
 *
 *   const save = useLoadingAction(() => api.save(draft));
 *   <Button loading={save.loading} onClick={save.run}>Save</Button>
 */
export function useLoadingAction<Args extends unknown[], Result>(
  action: (...args: Args) => Promise<Result>,
  { delay = 150, minimum = 500 }: LoadingActionOptions = {},
) {
  const [loading, setLoading] = useState(false);
  const running = useRef(false);
  const mounted = useRef(true);
  const latest = useRef(action);
  useEffect(() => {
    latest.current = action;
  }, [action]);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const run = useCallback(
    async (...args: Args): Promise<Result | undefined> => {
      if (running.current) return undefined;
      running.current = true;
      const shown: { at: number | null } = { at: null };
      const timer = setTimeout(() => {
        shown.at = Date.now();
        if (mounted.current) setLoading(true);
      }, delay);
      try {
        return await latest.current(...args);
      } finally {
        clearTimeout(timer);
        if (shown.at !== null) {
          const left = minimum - (Date.now() - shown.at);
          if (left > 0) await new Promise((resolve) => setTimeout(resolve, left));
        }
        running.current = false;
        if (mounted.current) setLoading(false);
      }
    },
    [delay, minimum],
  );
  return { loading, run };
}
