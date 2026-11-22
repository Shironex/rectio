'use client';

import type { ReactNode } from 'react';

import {
  CHART_MESSAGES,
  ChartFrame,
  Swatch,
  mergeMessages,
  useMarkGlide,
  type ChartColor,
  type ChartMessages,
} from '../chart/chart';
import { formatValue, type ValueFormat } from '../chart/chart-format';
import { cn } from '../lib/cn';
import { devWarn } from '../lib/dev-warn';

/**
 * A stretch of the scale with a name: `Behind` up to 60, `On track` up to 90, `Ahead` past it.
 * Bands are placed in order of `to` (an unsorted list is sorted), each from where the one before
 * ends; a `to` outside the scale is clamped to it, and two bands that end at the same point (an
 * overlap) leave the second one empty, with a warning in development.
 */
export interface GaugeBand {
  /** Where the band ends on the scale; the last band runs to `max` whatever it says. */
  to: number;
  label: string;
  /** Its colour token. By default the sequence, calmest for the band where higher is better. */
  color?: ChartColor | undefined;
}

export interface RadialGaugeMessages extends ChartMessages {
  target: string;
  /** A band's stretch of the scale in the list under the gauge. */
  range: (from: string, to: string) => string;
  /** The words under the figure: how far the value is toward the target. */
  ofTarget: (share: string) => string;
  /** The summary, read before the gauge and as the meter's value text. */
  summary: (info: {
    label: string;
    value: string;
    max: string;
    target?: string | undefined;
    band?: string | undefined;
  }) => string;
}

export const RADIAL_GAUGE_MESSAGES: RadialGaugeMessages = {
  ...CHART_MESSAGES,
  target: 'Target',
  range: (from, to) => `${from} to ${to}`,
  ofTarget: (share) => `${share} of target`,
  keyboardHint: '',
  summary: ({ label, value, max, target, band }) =>
    `${label}: ${value} of ${max}` +
    (target === undefined ? '' : `, target ${target}`) +
    (band === undefined ? '.' : `, ${band}.`),
};

export interface RadialGaugeProps {
  value: number;
  min?: number | undefined;
  max: number;
  /** A mark on the scale, such as the goal. */
  target?: number | undefined;
  /** A second, quieter mark, such as where the value should be by now. */
  marker?: { value: number; label: string } | undefined;
  /** Named stretches of the scale, drawn as a thin outer ring and listed under the gauge. */
  bands?: readonly GaugeBand[] | undefined;
  /** Which end of the scale is good news, for the default band colours. */
  better?: 'higher' | 'lower' | undefined;
  /** What it measures, for the summary and the meter's name. */
  label: string;
  format?: ValueFormat | undefined;
  currency?: string | undefined;
  locale?: string | undefined;
  /** The figure in the middle; the value by default. */
  centerValue?: ReactNode;
  /** The words under it; the share of the target by default, when there is one. */
  centerLabel?: ReactNode;
  /** The arc's colour token. The first series by default. */
  color?: ChartColor | undefined;
  summary?: string | undefined;
  loading?: boolean | undefined;
  /** Width of the gauge, a token utility. `w-56` by default; it never grows past its column. */
  sizeClassName?: string | undefined;
  messages?: Partial<RadialGaugeMessages> | undefined;
  className?: string | undefined;
}

/** The gauge sweeps 240 degrees, open at the bottom, so a figure fits in the gap. */
const SWEEP = 240;
const START = -120;
const CX = 50;
const CY = 50;
const R = 40;
const BAND_R = 47;

const clamp = (share: number) => Math.min(1, Math.max(0, share));

function point(angle: number, radius: number) {
  const rad = ((angle - 90) * Math.PI) / 180;
  return { x: CX + radius * Math.cos(rad), y: CY + radius * Math.sin(rad) };
}

/** An arc from one share of the sweep to another, on the given radius. */
function arc(from: number, to: number, radius: number) {
  const a = START + clamp(from) * SWEEP;
  const b = START + clamp(to) * SWEEP;
  const p = point(a, radius);
  const q = point(b, radius);
  const large = b - a > 180 ? 1 : 0;
  return `M ${String(p.x)} ${String(p.y)} A ${String(radius)} ${String(radius)} 0 ${String(large)} 1 ${String(q.x)} ${String(q.y)}`;
}

const STROKE: Record<string, string> = {
  'series-1': 'stroke-chart-series-1',
  'series-2': 'stroke-chart-series-2',
  'series-3': 'stroke-chart-series-3',
  'sequence-1': 'stroke-chart-sequence-1',
  'sequence-2': 'stroke-chart-sequence-2',
  'sequence-3': 'stroke-chart-sequence-3',
  'sequence-4': 'stroke-chart-sequence-4',
  'sequence-5': 'stroke-chart-sequence-5',
  reference: 'stroke-chart-reference',
};

/**
 * Band colours by default: the warm sequence from its most severe step, ending in the quiet
 * reference grey for the good band, so no band shares the value arc's colour.
 */
/** Bands in order along the scale, each from the end of the one before, clamped to the scale. */
function placeBands(
  bands: readonly GaugeBand[],
  min: number,
  max: number,
  better: 'higher' | 'lower',
) {
  const sorted = bands
    .map((band, index) => ({ band, index, to: Number.isFinite(band.to) ? band.to : max }))
    .sort((a, b) => a.to - b.to || a.index - b.index);
  if (sorted.some((entry, i) => i > 0 && entry.to === sorted[i - 1]?.to))
    devWarn('RadialGauge bands overlap: two bands end at the same point, so one draws nothing.');
  else if (sorted.some((entry, i) => entry.index !== i))
    devWarn('RadialGauge bands are not in order of `to`; they are sorted before drawing.');
  const colors = bandColors(sorted.length, better);
  let from = min;
  return sorted.map(({ band, to }, index) => {
    const end = index === sorted.length - 1 ? max : Math.min(max, Math.max(from, to));
    const placed = { ...band, from, to: end, tone: band.color ?? colors[index] ?? 'reference' };
    from = end;
    return placed;
  });
}

function bandColors(count: number, better: 'higher' | 'lower'): ChartColor[] {
  const ladder: ChartColor[] =
    count <= 2
      ? ['sequence-4', 'reference']
      : count === 3
        ? ['sequence-4', 'sequence-2', 'reference']
        : (['sequence-5', 'sequence-4', 'sequence-3', 'sequence-2', 'reference'].slice(
            -count,
          ) as ChartColor[]);
  const colors = ladder.slice(0, count);
  return better === 'higher' ? colors : colors.reverse();
}

/**
 * One figure against its scale, a target and named bands: quota attainment, uptime, budget used.
 * The figure and its share of the target are written in the middle and the band it falls in is
 * named in words, so the arc is a picture of the numbers. A meter for assistive technology.
 */
export function RadialGauge({
  value,
  min: requestedMin = 0,
  max: requestedMax,
  target,
  marker,
  bands,
  better = 'higher',
  label,
  format = 'number',
  currency,
  locale,
  centerValue,
  centerLabel,
  color = 'series-1',
  summary,
  loading,
  sizeClassName = 'w-56',
  messages,
  className,
}: RadialGaugeProps) {
  const m = mergeMessages(RADIAL_GAUGE_MESSAGES, messages);
  const glide = useMarkGlide();
  // A missing or reversed scale falls back to 0 to 1 past the minimum, so nothing draws as NaN.
  const min = Number.isFinite(requestedMin) ? requestedMin : 0;
  const max = Number.isFinite(requestedMax) && requestedMax > min ? requestedMax : min + 1;
  const span = max - min;
  const share = (figure: number) => clamp((figure - min) / span);
  const write = (figure: number) => formatValue(figure, format, { locale, currency });
  const percent = (fraction: number) => formatValue(fraction, 'percent', { locale });
  const safe = Number.isFinite(value) ? value : min;
  const placed = placeBands(bands ?? [], min, max, better);
  // The band the value falls in: below the scale is the first, past it the last.
  // An empty band (one that overlaps the band before) is neither drawn nor listed.
  const drawn = placed.filter((band) => band.to > band.from);
  const current = drawn.find((band) => safe <= band.to) ?? drawn.at(-1);
  const valueText =
    summary ??
    m.summary({
      label,
      value: write(safe),
      max: write(max),
      target: target === undefined ? undefined : write(target),
      band: current?.label,
    });
  const tick = (figure: number, inner: number, outer: number) => {
    const angle = START + share(figure) * SWEEP;
    const a = point(angle, inner);
    const b = point(angle, outer);
    return { x1: a.x, y1: a.y, x2: b.x, y2: b.y };
  };
  const filled = share(safe);
  // The share of the target, unless it would repeat the figure (a percentage against a target of 100%).
  const ofTarget = target === undefined || target === 0 ? undefined : percent(safe / target);
  const below =
    centerLabel ??
    (ofTarget === undefined || ofTarget === write(safe) ? undefined : m.ofTarget(ofTarget));

  return (
    <ChartFrame
      kind="gauge"
      loading={loading}
      summary={valueText}
      tableToggle={false}
      plotClassName={loading === true ? cn('mx-auto aspect-square', sizeClassName) : 'h-auto'}
      messages={m}
      className={className}
    >
      <div className="flex flex-col items-center gap-4">
        <div
          role="meter"
          aria-label={label}
          aria-valuemin={min}
          aria-valuemax={max}
          // The meter's value stays on its scale; the value text carries the real figure.
          aria-valuenow={Math.min(max, Math.max(min, safe))}
          aria-valuetext={valueText}
          className={cn('relative aspect-square max-w-full', sizeClassName)}
        >
          <svg aria-hidden viewBox="0 0 100 100" fill="none" className="size-full overflow-visible">
            {drawn.map((band) => (
              <path
                key={`${band.label}-${String(band.from)}`}
                d={arc(share(band.from), share(band.to), BAND_R)}
                strokeWidth={2}
                className={cn('rx-mark', STROKE[band.tone])}
                data-chart-mark="fade"
              />
            ))}
            <path
              d={arc(0, 1, R)}
              strokeWidth={8}
              strokeLinecap="round"
              className="stroke-chart-grid"
            />
            <path
              d={arc(0, 1, R)}
              pathLength={100}
              strokeWidth={8}
              strokeLinecap="round"
              strokeDasharray={`${String(filled * 100)} 100`}
              // A zero value draws nothing rather than a round dot of the line cap.
              strokeOpacity={filled === 0 ? 0 : 1}
              data-chart-mark="sweep"
              className={cn('rx-mark', STROKE[color], glide)}
            />
            {marker !== undefined && (
              <>
                <line
                  {...tick(marker.value, R - 8, BAND_R + 3)}
                  strokeWidth={4}
                  className="stroke-chart-halo"
                />
                <line
                  {...tick(marker.value, R - 8, BAND_R + 3)}
                  strokeWidth={2}
                  strokeDasharray="2.5 1.5"
                  className="stroke-fg-muted"
                />
              </>
            )}
            {target !== undefined && (
              <>
                <line
                  {...tick(target, R - 8, BAND_R + 3)}
                  strokeWidth={4}
                  className="stroke-chart-halo"
                />
                <line
                  {...tick(target, R - 8, BAND_R + 3)}
                  strokeWidth={2}
                  strokeLinecap="round"
                  className="stroke-fg"
                />
              </>
            )}
          </svg>
          {/* Read from the meter's value text; the middle is the picture's label. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pt-2 text-center"
          >
            <span
              className={cn(
                'text-3xl font-strong tracking-tight text-fg numeric',
                format === 'currency' && 'font-(family-name:--rx-money-family)',
              )}
            >
              {centerValue ?? write(safe)}
            </span>
            {below !== undefined && <span className="text-xs text-fg-muted">{below}</span>}
            {current !== undefined && (
              <span className="mt-1 text-xs font-medium text-fg">{current.label}</span>
            )}
          </div>
        </div>
        {(drawn.length > 0 || target !== undefined || marker !== undefined) && (
          <ul
            aria-hidden
            data-slot="gauge-legend"
            className="m-0 flex list-none flex-wrap justify-center gap-x-4 gap-y-1 p-0 text-xs text-fg-muted"
          >
            {drawn.map((band) => (
              <li
                key={`${band.label}-${String(band.from)}`}
                className={cn(
                  'inline-flex items-center gap-1.5 numeric',
                  band === current && 'font-medium text-fg',
                )}
              >
                <Swatch color={band.tone} />
                {band.label}
                <span className="text-fg-subtle">{m.range(write(band.from), write(band.to))}</span>
              </li>
            ))}
            {target !== undefined && (
              <li className="inline-flex items-center gap-1.5 numeric">
                <span className="h-3 w-0.5 rounded-full bg-fg" />
                {m.target} {write(target)}
              </li>
            )}
            {marker !== undefined && (
              <li className="inline-flex items-center gap-1.5 numeric">
                <span className="h-3 w-0 border-s-2 border-dashed border-fg-muted" />
                {marker.label} {write(marker.value)}
              </li>
            )}
          </ul>
        )}
      </div>
    </ChartFrame>
  );
}
