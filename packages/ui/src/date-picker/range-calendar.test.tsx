import type { DateRange } from '@daypicker/react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { resolveDateLocale } from '../calendar/locales';
import { RangeCalendar, type DateRangePreset } from './range-calendar';
import { formatDateRange, rangeLength } from './range-format';

const MARCH = new Date(2026, 2, 1);

function Controlled({
  initial,
  onComplete = vi.fn(),
  presets,
}: {
  initial?: DateRange;
  onComplete?: (range: { from: Date; to: Date }) => void;
  presets?: DateRangePreset[];
}) {
  const [value, setValue] = useState<DateRange | undefined>(initial);
  return (
    <RangeCalendar
      aria-label="Stay"
      locale="en-GB"
      value={value}
      onValueChange={setValue}
      onComplete={onComplete}
      defaultMonth={MARCH}
      {...(presets === undefined ? {} : { presets })}
    />
  );
}

const summary = () => {
  const line = document.querySelector('[data-slot="range-calendar-summary"]');
  if (line === null) throw new Error('no summary');
  return line;
};
const day = (name: RegExp) => screen.getAllByRole('button', { name })[0];

describe('range helpers', () => {
  it('writes a range and counts its days', () => {
    const en = resolveDateLocale('en-GB');
    const range = { from: new Date(2026, 2, 12), to: new Date(2026, 2, 18) };
    expect(formatDateRange(range, en)).toBe('12 Mar to 18 Mar 2026');
    expect(formatDateRange({ from: new Date(2025, 11, 30), to: new Date(2026, 0, 2) }, en)).toBe(
      '30 Dec 2025 to 2 Jan 2026',
    );
    expect(rangeLength(range)).toBe(7);
    expect(rangeLength({ from: range.from, to: range.from })).toBe(1);
  });
});

describe('RangeCalendar', () => {
  it('shows two months and picks a start, then an end, saying so', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(<Controlled onComplete={onComplete} />);
    expect(screen.getAllByRole('grid')).toHaveLength(2);
    expect(summary()).toHaveTextContent('Pick the first day');
    const start = day(/12 March 2026/);
    if (start === undefined) throw new Error('no 12 March');
    await user.click(start);
    expect(summary()).toHaveTextContent('From 12 Mar 2026. Pick the last day');
    const end = day(/18 March 2026/);
    if (end === undefined) throw new Error('no 18 March');
    await user.click(end);
    expect(onComplete).toHaveBeenCalledWith({
      from: new Date(2026, 2, 12),
      to: new Date(2026, 2, 18),
    });
    expect(summary()).toHaveTextContent('12 Mar to 18 Mar 2026, 7 days');
  });

  it('starts a fresh range on the next press after a whole one', async () => {
    const user = userEvent.setup();
    render(<Controlled initial={{ from: new Date(2026, 2, 2), to: new Date(2026, 2, 6) }} />);
    const press = day(/20 March 2026/);
    if (press === undefined) throw new Error('no 20 March');
    await user.click(press);
    expect(summary()).toHaveTextContent('From 20 Mar 2026. Pick the last day');
  });

  it('picks a whole range from a preset and marks it pressed', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    const week = { from: new Date(2026, 2, 9), to: new Date(2026, 2, 15) };
    render(
      <Controlled onComplete={onComplete} presets={[{ label: 'Second week', range: week }]} />,
    );
    const preset = screen.getByRole('button', { name: /Second week/ });
    expect(preset).toHaveAttribute('aria-pressed', 'false');
    await user.click(preset);
    expect(onComplete).toHaveBeenCalledWith(week);
    expect(preset).toHaveAttribute('aria-pressed', 'true');
  });

  it('previews the range from the keyboard as well as the pointer', async () => {
    const user = userEvent.setup();
    render(<Controlled />);
    const start = day(/12 March 2026/);
    if (start === undefined) throw new Error('no 12 March');
    await user.click(start);
    await user.keyboard('{ArrowRight}{ArrowRight}');
    const cell = (name: RegExp) => day(name)?.closest('td')?.className ?? '';
    expect(cell(/13 March 2026/)).toContain('bg-accent-subtle/60');
    expect(cell(/14 March 2026/)).toContain('bg-accent-subtle/60');
    expect(cell(/15 March 2026/)).not.toContain('bg-accent-subtle/60');
  });
});
