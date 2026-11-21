import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { Field, FieldLabel } from '../field/field';
import {
  clampTime,
  formatIsoTime,
  isTimeInRange,
  minutesToTime,
  parseIsoTime,
  resolveHourCycle,
  stepTime,
  typeDigit,
  type TimeValue,
} from './time';
import { TimeField, type TimeFieldProps } from './time-field';

function Controlled({
  initial = null,
  onChange = vi.fn(),
  ...props
}: Partial<TimeFieldProps> & {
  initial?: TimeValue | null;
  onChange?: (value: TimeValue | null) => void;
}) {
  const [value, setValue] = useState<TimeValue | null>(initial);
  return (
    <form aria-label="Booking">
      <Field>
        <FieldLabel>Start</FieldLabel>
        <TimeField
          locale="en-GB"
          {...props}
          value={value}
          onValueChange={(next) => {
            setValue(next);
            onChange(next);
          }}
        />
      </Field>
    </form>
  );
}

describe('time helpers', () => {
  it('reads the clock of each locale', () => {
    expect(resolveHourCycle('en-US')).toBe(12);
    expect(resolveHourCycle('en-GB')).toBe(24);
    expect(resolveHourCycle('pl-PL')).toBe(24);
  });

  it('steps each segment on its own and lands minutes on the step', () => {
    const t = { hour: 9, minute: 7 };
    expect(stepTime(t, 'minute', 1, { step: 15 })).toEqual({ hour: 9, minute: 15 });
    expect(stepTime(t, 'minute', -1, { step: 15 })).toEqual({ hour: 9, minute: 0 });
    expect(stepTime({ hour: 9, minute: 45 }, 'minute', 1, { step: 15 })).toEqual({
      hour: 9,
      minute: 0,
    });
    expect(stepTime({ hour: 23, minute: 0 }, 'hour', 1)).toEqual({ hour: 0, minute: 0 });
    // On a 12 hour face the hour wraps within its period: 11 PM up is 12 PM.
    expect(stepTime({ hour: 23, minute: 0 }, 'hour', 1, { hourCycle: 12 })).toEqual({
      hour: 12,
      minute: 0,
    });
    expect(stepTime({ hour: 9, minute: 0 }, 'period', 1)).toEqual({ hour: 21, minute: 0 });
  });

  it('types digits and knows when a segment is complete', () => {
    expect(typeDigit('', '7', 'hour')).toEqual({ value: 7, buffer: '', advance: true });
    expect(typeDigit('', '1', 'hour')).toEqual({ value: 1, buffer: '1', advance: false });
    expect(typeDigit('1', '9', 'hour')).toEqual({ value: 19, buffer: '', advance: true });
    expect(typeDigit('2', '7', 'hour')).toEqual({ value: 7, buffer: '', advance: true });
    expect(typeDigit('', '2', 'hour', 12)).toEqual({ value: 2, buffer: '', advance: true });
    expect(typeDigit('1', '2', 'hour', 12)).toEqual({ value: 12, buffer: '', advance: true });
    expect(typeDigit('', '6', 'minute')).toEqual({ value: 6, buffer: '', advance: true });
    expect(typeDigit('4', '5', 'minute')).toEqual({ value: 45, buffer: '', advance: true });
  });

  it('checks, clamps and converts times', () => {
    const min = { hour: 8, minute: 0 };
    const max = { hour: 18, minute: 0 };
    expect(isTimeInRange({ hour: 7, minute: 59 }, min, max)).toBe(false);
    expect(isTimeInRange({ hour: 18, minute: 0 }, min, max)).toBe(true);
    expect(clampTime({ hour: 19, minute: 0 }, min, max)).toEqual(max);
    expect(formatIsoTime({ hour: 9, minute: 5 })).toBe('09:05');
    expect(parseIsoTime('9:05')).toEqual({ hour: 9, minute: 5 });
    expect(parseIsoTime('24:00')).toBeNull();
    expect(minutesToTime(-30)).toEqual({ hour: 23, minute: 30 });
  });
});

describe('TimeField', () => {
  it('is named by its label and types a time digit by digit', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Controlled onChange={onChange} name="start" />);
    const hour = screen.getByRole('spinbutton', { name: 'Start' });
    await user.click(hour);
    await user.keyboard('0930');
    expect(onChange).toHaveBeenLastCalledWith({ hour: 9, minute: 30 });
    expect(screen.getByRole('spinbutton', { name: 'Minutes' })).toHaveFocus();
    expect(screen.queryByRole('spinbutton', { name: 'AM or PM' })).toBeNull();
    expect(screen.getByRole('form', { name: 'Booking' })).toHaveFormValues({ start: '09:30' });
  });

  it('shows the day period on a 12 hour face and sets it with A and P', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Controlled locale="en-US" onChange={onChange} initial={{ hour: 9, minute: 0 }} />);
    expect(screen.getByRole('spinbutton', { name: 'Start' })).toHaveValue('09');
    const period = screen.getByRole('spinbutton', { name: 'AM or PM' });
    expect(period).toHaveValue('AM');
    await user.click(period);
    await user.keyboard('p');
    expect(onChange).toHaveBeenLastCalledWith({ hour: 21, minute: 0 });
    expect(period).toHaveValue('PM');
  });

  it('steps minutes by the step with the arrow keys and stops at the bounds', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Controlled
        step={15}
        min={{ hour: 8, minute: 0 }}
        max={{ hour: 17, minute: 30 }}
        initial={{ hour: 17, minute: 0 }}
        onChange={onChange}
      />,
    );
    const minute = screen.getByRole('spinbutton', { name: 'Minutes' });
    await user.click(minute);
    await user.keyboard('{ArrowUp}');
    expect(onChange).toHaveBeenLastCalledWith({ hour: 17, minute: 15 });
    await user.keyboard('{ArrowUp}{ArrowUp}');
    expect(onChange).toHaveBeenLastCalledWith({ hour: 17, minute: 30 });
    await user.keyboard('{ArrowLeft}{ArrowUp}');
    expect(screen.getByRole('spinbutton', { name: 'Start' })).toHaveFocus();
    expect(onChange).toHaveBeenLastCalledWith({ hour: 17, minute: 30 });
  });

  it('marks a typed time outside the bounds invalid', async () => {
    const user = userEvent.setup();
    render(<Controlled min={{ hour: 8, minute: 0 }} />);
    await user.click(screen.getByRole('spinbutton', { name: 'Start' }));
    await user.keyboard('0700');
    expect(screen.getByRole('spinbutton', { name: 'Start' })).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    expect(screen.getByRole('group')).toHaveAttribute('data-invalid');
  });

  it('clears a segment with Backspace and reports null', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Controlled initial={{ hour: 14, minute: 5 }} onChange={onChange} />);
    const minute = screen.getByRole('spinbutton', { name: 'Minutes' });
    await user.click(minute);
    await user.keyboard('{Backspace}');
    expect(onChange).toHaveBeenLastCalledWith(null);
    expect(minute).toHaveValue('');
    await user.keyboard('{Backspace}');
    expect(screen.getByRole('spinbutton', { name: 'Start' })).toHaveFocus();
    await user.keyboard('{End}');
    expect(screen.getByRole('spinbutton', { name: 'Start' })).toHaveValue('23');
  });

  it('follows a new value from outside', () => {
    const { rerender } = render(
      <TimeField locale="en-GB" aria-label="End" value={null} onValueChange={vi.fn()} />,
    );
    rerender(
      <TimeField
        locale="en-GB"
        aria-label="End"
        value={{ hour: 16, minute: 45 }}
        onValueChange={vi.fn()}
      />,
    );
    expect(screen.getByRole('spinbutton', { name: 'End' })).toHaveValue('16');
    expect(screen.getByRole('spinbutton', { name: 'Minutes' })).toHaveValue('45');
  });
});
