import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { TaxSummary, type TaxRateEntry } from '../src/index';
import { TaxSummary as MotionTaxSummary } from '../src/motion';

const d = (m: number, day: number) => new Date(2026, m - 1, day);
const entries: TaxRateEntry[] = [
  { id: 'std', rate: 0.23, outputBase: 1_000, inputBase: 400 },
  { id: 'ex', rate: 'exempt', outputBase: 100, inputBase: 0 },
];
const base = { entries, currency: 'EUR', locale: 'en-GB', due: d(4, 25), today: d(3, 19) };

describe('TaxSummary', () => {
  it('shows output, input and the net payable in words with the days left', () => {
    render(<TaxSummary {...base} status="open" />);
    expect(screen.getByText('Output tax collected').closest('div')).toHaveTextContent('€230.00');
    expect(screen.getByText('Input tax paid').closest('div')).toHaveTextContent('€92.00');
    expect(screen.getByText('Net payable').closest('div')).toHaveTextContent('€138.00');
    expect(screen.getByText('Due 25 April 2026')).toBeInTheDocument();
    expect(screen.getByText('37 days left')).toBeInTheDocument();
    expect(screen.getByText('Exempt')).toBeInTheDocument();
  });

  it('turns overdue once the date passes with the return open', () => {
    render(<TaxSummary {...base} status="ready" today={d(4, 28)} />);
    expect(screen.getAllByText('Overdue')[0]).toBeInTheDocument();
    expect(screen.getByText('3 days overdue')).toBeInTheDocument();
  });

  it('reads a refund when more tax was paid than collected', () => {
    render(
      <TaxSummary
        {...base}
        status="filed"
        entries={[{ id: 'a', rate: 0.23, outputBase: 0, inputBase: 100 }]}
      />,
    );
    expect(screen.getByText('Net refund').closest('div')).toHaveTextContent('€23.00');
    expect(screen.getByText('To reclaim from the tax office')).toBeInTheDocument();
  });

  it('prepares while open, files when ready, and offers nothing once filed', async () => {
    const user = userEvent.setup();
    const onFile = vi.fn();
    const onExport = vi.fn();
    const { rerender } = render(
      <TaxSummary {...base} status="open" onFile={onFile} onExport={onExport} />,
    );
    await user.click(screen.getByRole('button', { name: 'Prepare return' }));
    expect(onFile).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole('button', { name: 'Export' }));
    expect(onExport).toHaveBeenCalledTimes(1);
    rerender(<TaxSummary {...base} status="ready" onFile={onFile} />);
    screen.getByRole('button', { name: 'File return' }).focus();
    await user.keyboard('{Enter}');
    expect(onFile).toHaveBeenCalledTimes(2);
    rerender(<TaxSummary {...base} status="filed" onFile={onFile} />);
    expect(screen.queryByRole('button', { name: /return/ })).toBeNull();
  });

  it('takes its words from messages', () => {
    render(
      <TaxSummary
        {...base}
        status="open"
        messages={{ title: 'Sales tax', payableFigure: 'To pay' }}
      />,
    );
    expect(screen.getByRole('heading', { name: /Sales tax/ })).toBeInTheDocument();
    expect(screen.getByText('To pay')).toBeInTheDocument();
  });

  it('shows the empty state with its action and keeps the due date', () => {
    render(
      <TaxSummary
        {...base}
        entries={[]}
        status="open"
        emptyAction={<button type="button">View invoices</button>}
      />,
    );
    expect(screen.getByRole('status')).toHaveTextContent('No taxable activity this period');
    expect(screen.getByRole('button', { name: 'View invoices' })).toBeInTheDocument();
    expect(screen.getByText('Due 25 April 2026')).toBeInTheDocument();
  });

  it('renders the motion twin', () => {
    render(<MotionTaxSummary {...base} status="paid" />);
    expect(screen.getAllByText('Paid')[0]).toBeInTheDocument();
  });
});
