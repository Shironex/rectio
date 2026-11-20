'use client';

import { Money, ThemeScope } from '@rectio/ui';
import { useTheme } from 'next-themes';
import { useRef, type KeyboardEvent, type PointerEvent } from 'react';

import { Segmented } from '@/components/segmented';
import type { Mode } from '@/lib/site';
import { setSiteMode, useSiteMode } from '@/lib/use-site-mode';

import { READOUT, type Readout } from './readout';

/** One copy of the statement per mode: the same markup, its own scope and token values. */
function Statement({ mode, values }: { mode: Mode; values: Readout }) {
  const shown = values[mode];
  return (
    <ThemeScope mode={mode} className="flex h-full flex-col">
      <div className="flex flex-col gap-3 border-b border-line px-6 pt-7 pb-6 sm:px-8">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-fg-muted">Quarter close, Q1 2026</p>
          <code className="font-mono text-xs text-fg-muted">{mode}</code>
        </div>
        {/* Title on the left, figure on the right: at the default split each mode shows one. */}
        <div className="flex items-end justify-between gap-4">
          <p className="font-display text-xl font-heading tracking-tight text-fg sm:text-3xl">
            Net position
          </p>
          <Money
            amount={182406.35}
            currency="EUR"
            locale="en-IE"
            className="font-display text-xl font-heading text-fg tabular-nums sm:text-4xl"
          />
        </div>
      </div>
      <dl className="flex flex-1 flex-col px-6 py-2 sm:px-8">
        {READOUT.map((item) => (
          <div
            key={item.token}
            className="flex items-center justify-between gap-4 border-b border-line py-3 last:border-b-0"
          >
            <dt className="truncate text-sm text-fg">{item.label}</dt>
            <dd className="flex max-w-1/2 min-w-0 items-center justify-end gap-2 font-mono text-xs text-fg sm:text-sm">
              <span
                aria-hidden
                className={`size-4 shrink-0 rounded-badge border border-line-strong ${item.swatch}`}
              />
              {/* On a phone a colour shows as its swatch alone; the value would cross the split. */}
              <span className="hidden truncate sm:inline">{shown?.[item.token] ?? ''}</span>
            </dd>
          </div>
        ))}
      </dl>
    </ThemeScope>
  );
}

const STEP = 5;

/**
 * Both modes of the theme stacked: light below, dark on top, clipped from the left at `--site-split`.
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
      `${String(Math.round(100 - next))}% dark, ${String(Math.round(next))}% light`,
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
        <Statement mode="light" values={values} />
      </div>
      <div aria-hidden className="site-split col-start-1 row-start-1 min-w-0">
        <Statement mode="dark" values={values} />
      </div>
      <div
        ref={handle}
        role="slider"
        tabIndex={0}
        aria-label="Split between the light and dark modes"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={50}
        aria-valuetext="50% dark, 50% light"
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
 * The mode curtain: a persistent Light or Dark switch for the whole page, opening the new mode as
 * a circle from the pressed option, and the two modes side by side under a draggable split.
 */
export function ThemeCurtain({ values }: { values: Readout }) {
  const mode = useSiteMode();
  const { setTheme } = useTheme();

  return (
    <div className="grid gap-10 lg:grid-cols-12 lg:items-center lg:gap-16">
      <div className="flex flex-col gap-8 lg:col-span-5">
        <div className="flex flex-col gap-4">
          <h2 className="site-reveal site-headline text-fg">
            <span className="font-regular">Light by day.</span> Dark at close.
          </h2>
          <p className="site-reveal site-step-1 max-w-md text-lg text-pretty text-fg-muted">
            Every colour token has a light and a dark value. Switch this page between them:
            surfaces, text, lines and shadows follow, and no component changes.
          </p>
        </div>
        <div className="site-reveal site-step-2 flex flex-col items-start gap-3">
          <Segmented
            label="Page mode"
            size="md"
            value={mode}
            options={[
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
            ]}
            onChange={(next, origin) => {
              setSiteMode(next, setTheme, origin);
            }}
          />
          <code className="font-mono text-sm text-fg-muted">
            {'<html data-mode="'}
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
