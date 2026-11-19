'use client';

import { Money, ThemeScope } from '@rectio/ui';
import { useTheme } from 'next-themes';
import { useRef, type KeyboardEvent, type PointerEvent } from 'react';

import { Segmented } from '@/components/segmented';
import { setSiteLook, useSiteTheme } from '@/lib/use-site-theme';

import { READOUT, type Readout } from './readout';
import { Eyebrow } from './section';

const LOOKS = {
  calm: { theme: 'default', mode: 'light' },
  ledger: { theme: 'ledger', mode: 'dark' },
} as const;
type Look = keyof typeof LOOKS;

/** One themed copy of the statement: the same markup, its own theme scope and token values. */
function Statement({ look, values }: { look: Look; values: Readout }) {
  const { theme, mode } = LOOKS[look];
  const shown = values[theme]?.[mode];
  return (
    <ThemeScope theme={theme} mode={mode} className="flex h-full flex-col">
      <div className="flex flex-col gap-3 border-b border-line px-6 pt-7 pb-6 sm:px-8">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-fg-muted">Quarter close, Q1 2026</p>
          <code className="font-mono text-xs text-fg-subtle">
            {theme}, {mode}
          </code>
        </div>
        <p className="font-display text-xl font-heading tracking-tight text-fg sm:text-3xl">
          Net position
        </p>
        <Money
          amount={182406.35}
          currency="EUR"
          locale="en-IE"
          className="text-xl font-strong text-fg tabular-nums sm:text-4xl"
        />
      </div>
      <dl className="flex flex-1 flex-col px-6 py-2 sm:px-8">
        {READOUT.map((item) => (
          <div
            key={item.token}
            className="flex items-center justify-between gap-4 border-b border-line py-3 last:border-b-0"
          >
            <dt className="truncate text-sm text-fg">{item.label}</dt>
            <dd className="flex min-w-0 items-center gap-2 font-mono text-sm text-fg">
              {'swatch' in item && (
                <span
                  aria-hidden
                  className={`size-4 shrink-0 rounded-badge border border-line-strong ${item.swatch}`}
                />
              )}
              <span className="truncate">{shown?.[item.token] ?? ''}</span>
            </dd>
          </div>
        ))}
      </dl>
    </ThemeScope>
  );
}

const STEP = 5;

/**
 * Both shipped themes stacked: calm below, ledger on top, clipped from the left at `--site-split`.
 * Drag anywhere on it (pointer capture keeps the drag when the pointer leaves), or focus the handle
 * and use the arrow keys, Home and End. The split moves through a CSS variable, not React state.
 */
function CompareSlider({ values }: { values: Readout }) {
  const frame = useRef<HTMLDivElement>(null);
  const handle = useRef<HTMLDivElement>(null);
  const split = useRef(50);

  const set = (percent: number) => {
    const next = Math.min(100, Math.max(0, percent));
    split.current = next;
    frame.current?.style.setProperty('--site-split', `${String(next)}%`);
    handle.current?.setAttribute('aria-valuenow', String(Math.round(next)));
    handle.current?.setAttribute(
      'aria-valuetext',
      `${String(Math.round(100 - next))}% ledger, ${String(Math.round(next))}% calm`,
    );
  };
  const fromPointer = (event: PointerEvent<HTMLDivElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    set(((event.clientX - box.left) / box.width) * 100);
  };
  const onKey = (event: KeyboardEvent<HTMLDivElement>) => {
    const moves: Record<string, number> = {
      ArrowLeft: split.current - STEP,
      ArrowDown: split.current - STEP,
      ArrowRight: split.current + STEP,
      ArrowUp: split.current + STEP,
      PageDown: split.current - STEP * 4,
      PageUp: split.current + STEP * 4,
      Home: 0,
      End: 100,
    };
    const next = moves[event.key];
    if (next === undefined) return;
    event.preventDefault();
    set(next);
  };

  return (
    <div
      ref={frame}
      className="relative grid touch-pan-y overflow-hidden rounded-panel border border-line-strong shadow-overlay select-none"
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        handle.current?.focus({ preventScroll: true });
        fromPointer(event);
      }}
      onPointerMove={(event) => {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) fromPointer(event);
      }}
    >
      <div className="col-start-1 row-start-1 min-w-0">
        <Statement look="calm" values={values} />
      </div>
      <div aria-hidden className="site-split col-start-1 row-start-1 min-w-0">
        <Statement look="ledger" values={values} />
      </div>
      <div
        ref={handle}
        role="slider"
        tabIndex={0}
        aria-label="Split between the calm and ledger themes"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={50}
        aria-valuetext="50% ledger, 50% calm"
        onKeyDown={onKey}
        // Physical left, like the clip it follows.
        style={{ left: 'var(--site-split, 50%)' }}
        className="group absolute inset-y-0 z-10 flex w-11 -translate-x-1/2 cursor-ew-resize items-center justify-center focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus"
      >
        <span aria-hidden className="absolute inset-y-0 w-px bg-accent" />
        <span
          aria-hidden
          className="relative flex h-10 w-6 items-center justify-center gap-0.5 rounded-control border border-accent-strong bg-accent shadow-raised group-focus-visible:outline-2 group-focus-visible:outline-offset-2 group-focus-visible:outline-focus"
        >
          <span className="h-4 w-px bg-accent-contrast" />
          <span className="h-4 w-px bg-accent-contrast" />
        </span>
      </div>
    </div>
  );
}

/**
 * The theme curtain: a persistent Calm or Ledger switch for the whole page, opening the new look
 * as a circle from the pressed option, and the two themes side by side under a draggable split.
 */
export function ThemeCurtain({ values }: { values: Readout }) {
  const { theme, mode } = useSiteTheme();
  const { setTheme } = useTheme();
  const look: Look = theme === 'ledger' ? 'ledger' : 'calm';

  return (
    <div className="grid gap-10 lg:grid-cols-12 lg:items-center lg:gap-16">
      <div className="flex flex-col gap-8 lg:col-span-5">
        <div className="flex flex-col gap-4">
          <Eyebrow>Themes</Eyebrow>
          <h2 className="site-reveal site-headline text-fg">
            <span className="font-regular">Calm by day.</span> Ledger at close.
          </h2>
          <p className="site-reveal site-step-1 max-w-md text-lg text-pretty text-fg-muted">
            A theme is a token file. Switch this page between the two that ship: type, corners,
            colour and the pace of motion follow, and no component changes.
          </p>
        </div>
        <div className="site-reveal site-step-2 flex flex-col items-start gap-3">
          <Segmented
            label="Page look"
            size="md"
            value={look}
            options={[
              { value: 'calm', label: 'Calm' },
              { value: 'ledger', label: 'Ledger' },
            ]}
            onChange={(next, origin) => {
              setSiteLook(LOOKS[next], setTheme, origin);
            }}
          />
          <code className="font-mono text-sm text-fg-muted">
            {'<html data-theme="'}
            <span className="text-fg">{theme}</span>
            {'" data-mode="'}
            <span className="text-fg">{mode}</span>
            {'">'}
          </code>
        </div>
      </div>
      <div className="site-reveal site-step-1 flex min-w-0 flex-col gap-3 lg:col-span-7">
        <CompareSlider values={values} />
        <p className="text-sm text-fg-muted">
          Drag the split, or focus the handle and use the arrow keys.
        </p>
      </div>
    </div>
  );
}
