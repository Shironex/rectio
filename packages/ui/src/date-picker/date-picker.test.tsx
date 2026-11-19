import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { Calendar } from '../calendar/calendar';
import { resolveDateLocale } from '../calendar/locales';
import { Field, FieldLabel } from '../field/field';
import { DatePicker, DateRangePicker, datePattern, parseDate } from './date-picker';
import type { DateRange } from '@daypicker/react';

function Controlled({
  locale,
  initial = null,
  onChange = vi.fn(),
}: {
  locale: string;
  initial?: Date | null;
  onChange?: (value: Date | null) => void;
}) {
  const [value, setValue] = useState<Date | null>(initial);
  return (
    <Field>
      <FieldLabel>Date</FieldLabel>
      <DatePicker
        value={value}
        locale={locale}
        onValueChange={(next) => {
          setValue(next);
          onChange(next);
        }}
      />
    </Field>
  );
}

const ymd = (date: Date | null | undefined) =>
  date == null
    ? null
    : `${String(date.getFullYear())}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

describe('parseDate and datePattern', () => {
  it('reads the short pattern of each locale', () => {
    expect(ymd(parseDate('19/03/2026', resolveDateLocale('en-GB')))).toBe('2026-03-19');
    expect(ymd(parseDate('19.03.2026', resolveDateLocale('pl-PL')))).toBe('2026-03-19');
    expect(ymd(parseDate('03/19/2026', resolveDateLocale('en-US')))).toBe('2026-03-19');
    expect(parseDate('31/02/2026', resolveDateLocale('en-GB'))).toBeNull();
    expect(parseDate('19/03/26', resolveDateLocale('en-GB'))).toBeNull();
    expect(parseDate('', resolveDateLocale('en-GB'))).toBeNull();
  });

  it('writes the pattern people type', () => {
    expect(datePattern(resolveDateLocale('en-GB'))).toBe('dd/mm/yyyy');
    expect(datePattern(resolveDateLocale('pl-PL'))).toBe('dd.mm.yyyy');
  });

  it('falls back to the language, then to en-US', () => {
    expect(resolveDateLocale('pl').code).toBe('pl');
    expect(resolveDateLocale('xx-YY').code).toBe('en-US');
  });
});

describe('Calendar', () => {
  const weekdays = () =>
    // DayPicker hides the weekday row from the accessibility tree; each day's name carries it.
    screen
      .getAllByRole('columnheader', { hidden: true })
      .map((cell) => cell.getAttribute('aria-label'));

  it('starts the week on Monday for en-GB and pl-PL, Sunday for en-US', () => {
    const month = new Date(2026, 2, 1);
    const { unmount } = render(<Calendar mode="single" locale="en-GB" month={month} />);
    expect(weekdays()[0]).toBe('Monday');
    unmount();
    const polish = render(<Calendar mode="single" locale="pl-PL" month={month} />);
    expect(weekdays()[0]).toBe('poniedziałek');
    expect(screen.getByRole('grid')).toHaveAccessibleName(/marzec 2026/i);
    polish.unmount();
    render(<Calendar mode="single" locale="en-US" month={month} />);
    expect(weekdays()[0]).toBe('Sunday');
  });
});

describe('DatePicker', () => {
  it('is named by its field label and shows the locale pattern', () => {
    render(<Controlled locale="pl-PL" />);
    const input = screen.getByRole('textbox', { name: 'Date' });
    expect(input).toHaveAttribute('placeholder', 'dd.mm.yyyy');
  });

  it('commits a typed date on blur and rewrites it in the locale format', async () => {
    const onChange = vi.fn();
    render(<Controlled locale="en-GB" onChange={onChange} />);
    const input = screen.getByRole('textbox', { name: 'Date' });
    await userEvent.type(input, '5/3/2026');
    await userEvent.tab();
    expect(ymd(onChange.mock.lastCall?.[0] as Date)).toBe('2026-03-05');
    expect(input).toHaveValue('05/03/2026');
  });

  it('reports null for text it cannot read, and keeps the text to fix', async () => {
    const onChange = vi.fn();
    render(<Controlled locale="en-GB" initial={new Date(2026, 2, 5)} onChange={onChange} />);
    const input = screen.getByRole('textbox', { name: 'Date' });
    await userEvent.clear(input);
    await userEvent.type(input, '35/03/2026{Enter}');
    expect(onChange).toHaveBeenLastCalledWith(null);
    expect(input).toHaveValue('35/03/2026');
  });

  it('opens the calendar on the chosen day and picks from the keyboard', async () => {
    const onChange = vi.fn();
    render(<Controlled locale="en-GB" initial={new Date(2026, 2, 19)} onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Choose date, 19/03/2026' }));
    const grid = await screen.findByRole('grid');
    await waitFor(() => {
      expect(within(grid).getByRole('button', { name: /19 March 2026/ })).toHaveFocus();
    });
    await userEvent.keyboard('{ArrowRight}{Enter}');
    expect(ymd(onChange.mock.lastCall?.[0] as Date)).toBe('2026-03-20');
    await waitFor(() => {
      expect(screen.queryByRole('grid')).not.toBeInTheDocument();
    });
    expect(screen.getByRole('textbox', { name: 'Date' })).toHaveValue('20/03/2026');
  });

  it('keeps the date when the chosen day is pressed again', async () => {
    const onChange = vi.fn();
    render(<Controlled locale="en-GB" initial={new Date(2026, 2, 19)} onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Choose date, 19/03/2026' }));
    const grid = await screen.findByRole('grid');
    await userEvent.click(within(grid).getByRole('button', { name: /19 March 2026/ }));
    expect(ymd(onChange.mock.lastCall?.[0] as Date)).toBe('2026-03-19');
    expect(screen.getByRole('textbox', { name: 'Date' })).toHaveValue('19/03/2026');
  });

  it('opens with Alt + Down from the input', async () => {
    render(<Controlled locale="en-GB" />);
    screen.getByRole('textbox', { name: 'Date' }).focus();
    await userEvent.keyboard('{Alt>}{ArrowDown}{/Alt}');
    expect(await screen.findByRole('grid')).toBeInTheDocument();
  });
});

describe('DateRangePicker', () => {
  function Range({ onChange }: { onChange: (range: DateRange | undefined) => void }) {
    const [value, setValue] = useState<DateRange | undefined>({
      from: new Date(2026, 2, 2),
      to: new Date(2026, 2, 6),
    });
    return (
      <DateRangePicker
        aria-label="Statement period"
        locale="en-GB"
        numberOfMonths={1}
        value={value}
        onValueChange={(next) => {
          setValue(next);
          onChange(next);
        }}
      />
    );
  }

  it('takes a fresh start and end on each opening, then closes', async () => {
    const onChange = vi.fn();
    render(<Range onChange={onChange} />);
    const trigger = screen.getByRole('button', { name: /Statement period/ });
    expect(trigger).toHaveTextContent('2 Mar 2026 to 6 Mar 2026');
    await userEvent.click(trigger);
    const grid = await screen.findByRole('grid');
    await userEvent.click(within(grid).getByRole('button', { name: /10 March 2026/ }));
    expect(screen.getByRole('grid')).toBeInTheDocument();
    await userEvent.click(within(grid).getByRole('button', { name: /14 March 2026/ }));
    const last = onChange.mock.lastCall?.[0] as DateRange;
    expect([ymd(last.from), ymd(last.to)]).toEqual(['2026-03-10', '2026-03-14']);
    await waitFor(() => {
      expect(screen.queryByRole('grid')).not.toBeInTheDocument();
    });
    expect(trigger).toHaveTextContent('10 Mar 2026 to 14 Mar 2026');
  });

  it('picks a whole period from a preset and marks the one in use', async () => {
    const onChange = vi.fn();
    render(
      <DateRangePicker
        aria-label="Period"
        locale="en-GB"
        value={{ from: new Date(2026, 2, 1), to: new Date(2026, 2, 31) }}
        onValueChange={onChange}
        presets={[
          { label: 'March', range: { from: new Date(2026, 2, 1), to: new Date(2026, 2, 31) } },
          { label: 'February', range: { from: new Date(2026, 1, 1), to: new Date(2026, 1, 28) } },
        ]}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: /^Period/ }));
    expect(await screen.findByRole('button', { name: /^March/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await userEvent.click(
      screen.getByRole('button', { name: /^February, ?1 Feb to 28 Feb 2026$/ }),
    );
    const last = onChange.mock.lastCall?.[0] as DateRange;
    expect([ymd(last.from), ymd(last.to)]).toEqual(['2026-02-01', '2026-02-28']);
    await waitFor(() => {
      expect(screen.queryByRole('grid')).not.toBeInTheDocument();
    });
  });
});
