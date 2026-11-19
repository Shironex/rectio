import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { CashRunway, type RunwayMonth } from '../src/index';
import { CashRunway as MotionCashRunway } from '../src/motion';

const m = (year: number, month: number, inflow: number, outflow: number): RunwayMonth => ({
  month: new Date(year, month - 1, 1),
  inflow,
  outflow,
});
// Six months: the older three burn 10k each, the last three 30k each.
const history = [
  m(2025, 10, 90_000, 100_000),
  m(2025, 11, 90_000, 100_000),
  m(2025, 12, 90_000, 100_000),
  m(2026, 1, 70_000, 100_000),
  m(2026, 2, 70_000, 100_000),
  m(2026, 3, 70_000, 100_000),
];
/** The sentence under the title, whose months are set in bold. */
const sentence = (pattern: RegExp) =>
  screen.getByText((_, element) => element?.tagName === 'P' && pattern.test(element.textContent));

const base = { history, balance: 150_000, currency: 'EUR', locale: 'en-GB' };

describe('CashRunway', () => {
  it('shows cash now, the average burn and the runway, and says when cash runs out', () => {
    render(<CashRunway {...base} />);
    expect(screen.getByText('Cash now').closest('div')).toHaveTextContent('€150,000.00');
    expect(screen.getByText('Average burn').closest('div')).toHaveTextContent('€30,000.00');
    expect(screen.getByText('5 months')).toBeInTheDocument();
    expect(sentence(/cash runs out in August 2026/)).toBeInTheDocument();
  });

  it('flags a short runway as a warning', () => {
    render(<CashRunway {...base} />);
    expect(screen.getByText('5 months')).toHaveClass('text-warning-strong');
  });

  it('switches the window, with only the windows the history fills', async () => {
    const user = userEvent.setup();
    render(<CashRunway {...base} />);
    expect(screen.queryByRole('button', { name: '12 mo' })).toBeNull();
    await user.click(screen.getByRole('button', { name: '6 mo' }));
    expect(screen.getByText('Average burn').closest('div')).toHaveTextContent('€20,000.00');
    expect(screen.getByText('7.5 months')).toBeInTheDocument();
    await user.keyboard('{ArrowLeft}{Enter}');
    expect(screen.getByText('Average burn').closest('div')).toHaveTextContent('€30,000.00');
  });

  it('says cash is not burning when more comes in than goes out', () => {
    render(<CashRunway {...base} history={[m(2026, 3, 120_000, 100_000)]} />);
    expect(screen.getByText('Not burning')).toBeInTheDocument();
    expect(screen.getByText('Average net inflow')).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: 'Average over' })).toBeNull();
  });

  it('names the minimum cash month and shows the table on request', async () => {
    const user = userEvent.setup();
    render(<CashRunway {...base} threshold={100_000} />);
    expect(sentence(/minimum in May 2026/)).toBeInTheDocument();
    const toggle = screen.getByRole('button', { name: 'Show table' });
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getAllByText('August 2026').length).toBeGreaterThan(0);
  });

  it('takes its words from messages', () => {
    render(<CashRunway {...base} messages={{ title: 'Runway', cashNow: 'Bank' }} />);
    expect(screen.getByRole('heading', { name: 'Runway' })).toBeInTheDocument();
    expect(screen.getByText('Bank')).toBeInTheDocument();
  });

  it('shows the empty state with its action', () => {
    render(
      <CashRunway
        {...base}
        history={[]}
        emptyAction={<button type="button">Connect a bank</button>}
      />,
    );
    expect(screen.getByRole('status')).toHaveTextContent('No cash history yet');
    expect(screen.getByRole('button', { name: 'Connect a bank' })).toBeInTheDocument();
  });

  it('renders the motion twin', () => {
    render(<MotionCashRunway {...base} />);
    expect(screen.getByRole('heading', { name: 'Cash runway' })).toBeInTheDocument();
  });
});
