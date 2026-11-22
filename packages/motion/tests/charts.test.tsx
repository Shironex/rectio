import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  AreaChart,
  BarChart,
  DonutChart,
  FunnelChart,
  Heatmap,
  LineChart,
  MotionPreferenceProvider,
  RadialGauge,
  WaterfallChart,
} from '../src/charts';
import { bezier } from '../src/chart/chart';
import { Sparkline } from '../src/index';

const day = (d: number) => new Date(2026, 2, d);
const series = [
  {
    id: 'a',
    label: 'Signups',
    points: [
      { date: day(1), value: 1 },
      { date: day(2), value: 3 },
    ],
  },
];

function browser({ reduce = false } = {}) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches: reduce && query.includes('prefers-reduced-motion: reduce'),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
  const animate = vi.fn(() => ({
    cancel: vi.fn(),
    finished: new Promise(() => undefined),
  }));
  Element.prototype.animate = animate as unknown as typeof Element.prototype.animate;
  return animate;
}

afterEach(() => {
  vi.unstubAllGlobals();
  delete (Element.prototype as { animate?: unknown }).animate;
});

describe('motion charts', () => {
  it('render the same figures, summary and table as the plain ones', () => {
    browser();
    render(
      <>
        <LineChart series={series} locale="en-GB" />
        <AreaChart series={series} locale="en-GB" />
        <BarChart
          data={[{ team: 'Billing', open: 3 }]}
          category="team"
          series={[{ key: 'open', label: 'Open' }]}
        />
        <DonutChart data={[{ id: 'a', label: 'Rent', value: 3 }]} />
      </>,
    );
    expect(screen.getAllByRole('table')).toHaveLength(4);
    expect(screen.getAllByText(/Signups went from 1 on 1 Mar 2026/)).toHaveLength(2);
  });

  it('hold the marks back for their entrance, and never under reduced motion or when off', () => {
    browser();
    const { container, unmount } = render(<LineChart series={series} />);
    expect(container.querySelector('[data-enter="waiting"]')).not.toBeNull();
    unmount();
    browser({ reduce: true });
    const calm = render(<LineChart series={series} />);
    expect(calm.container.querySelector('[data-enter]')).toBeNull();
    calm.unmount();
    browser();
    const off = render(
      <MotionPreferenceProvider value="off">
        <BarChart data={[{ t: 'a', v: 1 }]} category="t" series={[{ key: 'v', label: 'V' }]} />
      </MotionPreferenceProvider>,
    );
    expect(off.container.querySelector('[data-enter]')).toBeNull();
  });

  it('eases updates along the token curve', () => {
    const ease = bezier([0.2, 0, 0, 1]);
    expect(ease(0)).toBe(0);
    expect(ease(1)).toBe(1);
    expect(ease(0.5)).toBeGreaterThan(0.5);
  });

  it('draws the sparkline only when motion is allowed', () => {
    const animate = browser({ reduce: true });
    render(<Sparkline data={[1, 2, 3]} label="Trend" />);
    expect(screen.getByRole('img', { name: 'Trend' })).toBeInTheDocument();
    expect(animate).not.toHaveBeenCalled();
  });

  it('render the funnel, heatmap, waterfall and gauge with their figures and entrances', () => {
    browser();
    const { container } = render(
      <>
        <FunnelChart
          data={[
            { id: 'a', label: 'Visits', value: 100 },
            { id: 'b', label: 'Paid', value: 20 },
          ]}
        />
        <Heatmap
          rows={[{ id: 'r', label: 'Mon' }]}
          columns={[{ id: 'c', label: '9:00' }]}
          data={[{ row: 'r', column: 'c', value: 4 }]}
        />
        <WaterfallChart
          data={[
            { id: 'o', label: 'Open', value: 10, kind: 'start' },
            { id: 'e', label: 'Close', kind: 'end' },
          ]}
        />
        <RadialGauge label="Quota" value={40} max={100} />
      </>,
    );
    expect(screen.getAllByRole('table')).toHaveLength(3);
    expect(screen.getByRole('meter', { name: 'Quota' })).toBeInTheDocument();
    // Funnel bars and drop-off band, the heatmap grid and the gauge arc name their entrance.
    const marks = [...container.querySelectorAll<HTMLElement>('.rx-mark')].map(
      (mark) => mark.dataset.chartMark,
    );
    expect(marks).toEqual(expect.arrayContaining(['grow-x', 'fade', 'reveal', 'sweep']));
    // The waterfall's bars wait for their entrance until Recharts has drawn them.
    expect(container.querySelector('[data-enter="waiting"]')).not.toBeNull();
  });

  it('render the new charts plain under reduced motion', () => {
    browser({ reduce: true });
    const { container } = render(<RadialGauge label="Quota" value={40} max={100} />);
    expect(container.querySelector('[data-enter]')).toBeNull();
  });
});
