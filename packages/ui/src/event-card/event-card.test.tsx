import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { EventCard } from './event-card';
import { formatEventLength, formatEventTime } from './event-time';

const at = (day: number, hour: number, minute = 0) => new Date(2026, 2, day, hour, minute);

describe('event time words', () => {
  it('writes the time, the days past midnight and all-day events', () => {
    expect(formatEventTime(at(16, 9), at(16, 10, 30), 'en-GB')).toBe('09:00 to 10:30');
    expect(formatEventTime(at(16, 9), at(16, 10, 30), 'en-US')).toBe('9:00 AM to 10:30 AM');
    expect(formatEventTime(at(16, 22), at(17, 1), 'en-GB')).toBe(
      'Mon 16 Mar, 22:00 to Tue 17 Mar, 01:00',
    );
    expect(formatEventTime(at(16, 0), at(17, 0), 'en-GB', true)).toBe('All day');
    expect(formatEventTime(at(16, 0), at(19, 0), 'en-GB', true)).toBe('Mon 16 Mar to Wed 18 Mar');
  });

  it('writes how long it lasts', () => {
    expect(formatEventLength(at(16, 9), at(16, 9, 45), 'en-GB')).toBe('45 mins');
    expect(formatEventLength(at(16, 9), at(16, 10, 30), 'en-GB')).toBe('1 hr 30 mins');
    expect(formatEventLength(at(16, 9), at(16, 11), 'en-GB')).toBe('2 hrs');
  });
});

describe('EventCard', () => {
  it('shows what, when, where and who', () => {
    render(
      <EventCard
        title="Quarter close review"
        start={at(16, 9)}
        end={at(16, 10, 30)}
        location="Room 4"
        locale="en-GB"
        attendees={[{ name: 'Ines Duarte' }, { name: 'Callum Ross' }]}
      />,
    );
    expect(screen.getByText('Quarter close review')).toBeInTheDocument();
    expect(screen.getByText('09:00 to 10:30')).toBeInTheDocument();
    expect(screen.getByText('Room 4')).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Attendees' })).toBeInTheDocument();
    expect(screen.getByText('Ines Duarte and Callum Ross')).toBeInTheDocument();
  });

  it('opens from one button described by its details', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <EventCard
        title="Payroll run"
        start={at(17, 14)}
        end={at(17, 15)}
        location="Finance desk"
        status="tentative"
        locale="en-GB"
        variant="compact"
        onSelect={onSelect}
      />,
    );
    const button = screen.getByRole('button', { name: 'Payroll run' });
    expect(button).toHaveAccessibleDescription('Tentative, 14:00 to 15:00, Finance desk');
    await user.click(button);
    expect(onSelect).toHaveBeenCalledOnce();
  });

  it('says a cancelled event is cancelled, in words', () => {
    render(
      <EventCard
        title="Vendor call"
        start={at(18, 11)}
        end={at(18, 11, 30)}
        status="cancelled"
        tone="info"
        locale="en-GB"
      />,
    );
    expect(screen.getByText('Cancelled')).toBeInTheDocument();
    expect(screen.getByRole('article')).toHaveAttribute('data-status', 'cancelled');
  });
});
