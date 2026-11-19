import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { ProfitAndLoss, type PlLine } from '../src/index';
import { ProfitAndLoss as MotionProfitAndLoss } from '../src/motion';

const lines: PlLine[] = [
  {
    id: 'a',
    section: 'revenue',
    account: 'Subscriptions',
    code: '7000',
    current: 1_000,
    comparison: 800,
  },
  { id: 'b', section: 'revenue', account: 'Services', current: 200, comparison: 250 },
  { id: 'c', section: 'costOfSales', account: 'Hosting', current: 300, comparison: 200 },
  { id: 'd', section: 'operatingExpenses', account: 'Salaries', current: 1_100, comparison: 600 },
];

const base = {
  lines,
  currency: 'EUR',
  locale: 'en-GB',
  period: 'Q1 2026',
  comparisonPeriod: 'Q1 2025',
};

describe('ProfitAndLoss', () => {
  it('reads the figures and the statement down to a net loss with a true minus sign', () => {
    render(<ProfitAndLoss {...base} />);
    expect(screen.getByRole('heading', { name: 'Profit and loss' })).toBeInTheDocument();
    expect(screen.getByText('Q1 2026 against Q1 2025')).toBeInTheDocument();
    const gross = screen.getByText('Gross profit').closest('tr');
    expect(gross).toHaveTextContent('€900.00');
    expect(gross).toHaveTextContent('75% margin');
    const net = screen.getAllByText('Net loss').at(-1)?.closest('tr');
    expect(net).toHaveTextContent('−€200.00');
  });

  it('says a rise in cost is up, signed and unfavourable', () => {
    render(<ProfitAndLoss {...base} />);
    const hosting = screen.getByText('Hosting').closest('tr');
    expect(hosting).not.toBeNull();
    expect(within(hosting as HTMLElement).getAllByText('50% up')[0]).toBeInTheDocument();
    expect(hosting).toHaveTextContent('+€100.00');
    expect(
      within(hosting as HTMLElement)
        .getAllByText('50% up')[0]
        ?.closest('.text-negative-strong'),
    ).not.toBeNull();
  });

  it('folds a section to its subtotal and opens it again', async () => {
    const user = userEvent.setup();
    render(<ProfitAndLoss {...base} />);
    const toggle = screen.getByRole('button', { name: 'Revenue' });
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Subscriptions').closest('tr')).toBeVisible();
    await user.click(toggle);
    const folded = screen.getByRole('button', { name: 'Total revenue' });
    expect(folded).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByText('Subscriptions').closest('tr')).not.toBeVisible();
    expect(folded.closest('tr')).toHaveTextContent('€1,200.00');
    folded.focus();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('button', { name: 'Revenue' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  });

  it('collapses and expands every section at once', async () => {
    const user = userEvent.setup();
    render(<ProfitAndLoss {...base} defaultCollapsed={['costOfSales']} />);
    expect(screen.getByRole('button', { name: 'Total cost of sales' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    await user.click(screen.getByRole('button', { name: 'Collapse all' }));
    expect(screen.getByText('Salaries').closest('tr')).not.toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Expand all' }));
    expect(screen.getByText('Salaries').closest('tr')).toBeVisible();
  });

  it('drops the comparison columns when no line has one', () => {
    render(
      <ProfitAndLoss
        lines={[{ id: 'r', section: 'revenue', account: 'Sales', current: 10 }]}
        currency="EUR"
        locale="en-GB"
      />,
    );
    expect(screen.queryByRole('columnheader', { name: 'Change' })).toBeNull();
    expect(screen.getByRole('columnheader', { name: 'This period' })).toBeInTheDocument();
  });

  it('takes its words from messages', () => {
    render(
      <ProfitAndLoss
        {...base}
        messages={{
          title: 'Income statement',
          results: {
            grossProfit: 'GP',
            operatingProfit: 'OP',
            profitBeforeTax: 'PBT',
            netProfit: 'NP',
          },
          netLoss: 'NL',
        }}
      />,
    );
    expect(screen.getByRole('heading', { name: 'Income statement' })).toBeInTheDocument();
    expect(screen.getByText('GP')).toBeInTheDocument();
    expect(screen.getAllByText('NL').length).toBeGreaterThan(0);
  });

  it('shows the empty state with its action', () => {
    render(
      <ProfitAndLoss
        lines={[]}
        currency="EUR"
        emptyAction={<button type="button">Connect</button>}
      />,
    );
    expect(screen.getByRole('status')).toHaveTextContent('Nothing booked for this period');
    expect(screen.getByRole('button', { name: 'Connect' })).toBeInTheDocument();
  });

  it('renders the motion twin with the same content', () => {
    render(<MotionProfitAndLoss {...base} />);
    expect(screen.getByRole('heading', { name: 'Profit and loss' })).toBeInTheDocument();
  });
});
