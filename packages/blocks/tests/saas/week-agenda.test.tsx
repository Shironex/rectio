import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { WeekAgenda, type AgendaEvent, type AgendaVariant } from '../../src/index';
import { WeekAgenda as MotionWeekAgenda } from '../../src/motion';

/** 16 March 2026 is a Monday; now is Wednesday 18 March, 10:15. */
const at = (day: number, hour: number, minute = 0) => new Date(2026, 2, day, hour, minute);
const NOW = at(18, 10, 15);
const EVENTS: AgendaEvent[] = [
  { id: 'standup', title: 'Standup', start: at(16, 9), end: at(16, 9, 30) },
  { id: 'review', title: 'Close review', start: at(16, 9), end: at(16, 11), location: 'Room 4' },
  { id: 'payroll', title: 'Payroll run', start: at(18, 14), end: at(18, 15), tone: 'warning' },
  { id: 'offsite', title: 'Offsite', start: at(19, 0), end: at(20, 0), allDay: true },
  { id: 'next', title: 'Next week', start: at(23, 9), end: at(23, 10) },
];

const grid = () => within(screen.getByRole('group', { name: 'Week' }));

function Controlled({
  onEventClick = vi.fn(),
  onSlotClick = vi.fn(),
}: {
  onEventClick?: (event: AgendaEvent) => void;
  onSlotClick?: (slot: { start: Date; end: Date }) => void;
}) {
  const [date, setDate] = useState(at(18, 12));
  const [variant, setVariant] = useState<AgendaVariant>('week');
  return (
    <WeekAgenda
      events={EVENTS}
      date={date}
      onDateChange={setDate}
      variant={variant}
      onVariantChange={setVariant}
      now={NOW}
      locale="en-GB"
      onEventClick={onEventClick}
      onSlotClick={onSlotClick}
    />
  );
}

describe('WeekAgenda', () => {
  it('titles the week from the locale week start and counts its events', () => {
    render(<Controlled />);
    expect(
      screen.getByRole('heading', { level: 2, name: '16 to 22 March 2026' }),
    ).toBeInTheDocument();
    expect(screen.getByText('4 events this week')).toBeInTheDocument();
    expect(grid().getByRole('heading', { name: 'Wednesday 18 March, today' })).toBeInTheDocument();
    expect(grid().queryByRole('button', { name: /Next week/ })).toBeNull();
  });

  it('sets overlapping events side by side and puts all-day events in their own row', () => {
    render(<Controlled />);
    const standup = grid().getByRole('button', { name: 'Standup, Monday 16 March' });
    const review = grid().getByRole('button', { name: 'Close review, Monday 16 March' });
    const cell = (button: HTMLElement) => button.closest('li') as HTMLElement;
    expect(cell(review).style.width).toBe('50%');
    expect(cell(standup).style.left).toBe('50%');
    expect(
      within(grid().getByRole('list', { name: 'All-day events' })).getByRole('button', {
        name: 'Offsite, Thursday 19 March',
      }),
    ).toBeInTheDocument();
  });

  it('opens an event and moves between events with the arrow keys', async () => {
    const user = userEvent.setup();
    const onEventClick = vi.fn();
    render(<Controlled onEventClick={onEventClick} />);
    const first = grid().getByRole('button', { name: 'Close review, Monday 16 March' });
    expect(first).toHaveAttribute('tabindex', '0');
    await user.click(first);
    expect(onEventClick).toHaveBeenCalledWith(expect.objectContaining({ id: 'review' }));
    await user.keyboard('{ArrowDown}');
    expect(grid().getByRole('button', { name: 'Standup, Monday 16 March' })).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(grid().getByRole('button', { name: 'Payroll run, Wednesday 18 March' })).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(grid().getByRole('button', { name: 'Offsite, Thursday 19 March' })).toHaveFocus();
    await user.keyboard('{Home}');
    expect(first).toHaveFocus();
    expect(first).toHaveAttribute('tabindex', '0');
  });

  it('starts an event from a day button and from a press on an empty slot', async () => {
    const user = userEvent.setup();
    const onSlotClick = vi.fn();
    render(<Controlled onSlotClick={onSlotClick} />);
    // Today the Add button starts at the next half hour; other days at the first hour shown.
    await user.click(grid().getByRole('button', { name: 'Add event, Wednesday 18 March' }));
    expect(onSlotClick).toHaveBeenLastCalledWith({ start: at(18, 10, 30), end: at(18, 11) });
    await user.click(grid().getByRole('button', { name: 'Add event, Tuesday 17 March' }));
    expect(onSlotClick).toHaveBeenLastCalledWith({ start: at(17, 8), end: at(17, 8, 30) });

    const slots = screen
      .getByRole('group', { name: 'Week' })
      .querySelectorAll<HTMLElement>('[data-slot="week-agenda-slots"]')[1];
    if (slots === undefined) throw new Error('no slot layer');
    // jsdom has no layout: give the column a box, 8:00 to 19:00 over 660px, so 1px is 1 minute.
    slots.getBoundingClientRect = () => ({
      top: 0,
      height: 660,
      left: 0,
      width: 100,
      bottom: 660,
      right: 100,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });
    fireEvent.click(slots, { clientY: 100 });
    expect(onSlotClick).toHaveBeenLastCalledWith({ start: at(17, 9, 30), end: at(17, 10) });
  });

  it('marks today and the current time', () => {
    render(<Controlled />);
    const lines = screen
      .getByRole('group', { name: 'Week' })
      .querySelectorAll('[data-slot="week-agenda-now"]');
    expect(lines).toHaveLength(1);
    expect(lines[0]).toHaveTextContent('Now, 10:15');
  });

  it('steps weeks, returns to today and switches to the day view', async () => {
    const user = userEvent.setup();
    render(<Controlled />);
    expect(screen.getByRole('button', { name: 'Today' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Next week' }));
    expect(
      screen.getByRole('heading', { level: 2, name: '23 to 29 March 2026' }),
    ).toBeInTheDocument();
    expect(screen.getByText('1 event this week')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Today' }));
    expect(
      screen.getByRole('heading', { level: 2, name: '16 to 22 March 2026' }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Day' }));
    expect(
      screen.getByRole('heading', { level: 2, name: 'Wednesday, 18 March 2026' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Previous day' })).toBeInTheDocument();
  });

  it('lists each day for narrow screens, with an empty day saying so', () => {
    render(<WeekAgenda events={EVENTS} date={at(18, 12)} now={NOW} locale="en-GB" />);
    const list = screen.getAllByRole('list').find((el) => el.dataset.slot === 'week-agenda-list');
    if (list === undefined) throw new Error('no list');
    expect(within(list).getByRole('heading', { name: /Wednesday 18 March/ })).toHaveTextContent(
      'Today',
    );
    expect(within(list).getAllByText('Nothing scheduled').length).toBeGreaterThan(0);
    expect(within(list).getByText('Payroll run')).toBeInTheDocument();
  });

  it('says so when the week is empty', () => {
    render(<WeekAgenda events={[]} date={at(18, 12)} now={NOW} locale="en-GB" />);
    expect(screen.getAllByText('Nothing scheduled this week')).toHaveLength(2);
    expect(screen.getByRole('status')).toHaveTextContent(
      'Events you add for these days show up here.',
    );
  });

  it('renders the motion variant with the same content', () => {
    render(<MotionWeekAgenda events={EVENTS} date={at(18, 12)} now={NOW} locale="en-GB" />);
    expect(
      screen.getByRole('heading', { level: 2, name: '16 to 22 March 2026' }),
    ).toBeInTheDocument();
  });

  it('gathers a crowded hour behind a more button that lists the rest', async () => {
    const user = userEvent.setup();
    const onEventClick = vi.fn();
    const crowded: AgendaEvent[] = [
      { id: 'a', title: 'Board pack', start: at(18, 10), end: at(18, 12) },
      { id: 'b', title: 'Interview', start: at(18, 11), end: at(18, 12) },
      { id: 'c', title: 'Expenses', start: at(18, 11, 30), end: at(18, 12, 30) },
    ];
    render(
      <WeekAgenda
        events={crowded}
        date={at(18, 12)}
        now={NOW}
        locale="en-GB"
        onEventClick={onEventClick}
      />,
    );
    expect(screen.getByText('3 events this week')).toBeInTheDocument();
    expect(grid().queryByRole('button', { name: /^Interview/ })).toBeNull();
    await user.click(
      grid().getByRole('button', { name: '2 more events from 11:00, Wednesday 18 March' }),
    );
    await user.click(await screen.findByRole('button', { name: /^Expenses/ }));
    expect(onEventClick).toHaveBeenCalledWith(expect.objectContaining({ id: 'c' }));
  });
});
