import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';

import {
  ArAging,
  BudgetVsActual,
  CashFlowChart,
  ExpenseApproval,
  InvoiceDetail,
  InvoiceList,
  KpiRow,
  Ledger,
  dueInfo,
  dueText,
  englishDue,
  plural,
  type ExpenseRequest,
  type InvoiceDocument,
  type InvoiceSummary,
  type JournalLine,
  type LedgerAccount,
} from '../src/index';

const d = (m: number, day: number, y = 2026) => new Date(y, m - 1, day);
const TODAY = d(3, 19);
const base = { currency: 'EUR', locale: 'en-GB' };
const action = <button type="button">Do it</button>;

const invoice: InvoiceSummary = {
  id: 'i1',
  number: 'INV-1',
  customer: 'Kestrel',
  issued: d(3, 2),
  due: d(3, 12),
  total: 1_000,
  status: 'sent',
};

const document: InvoiceDocument = {
  number: 'INV-7',
  status: 'sent',
  issued: d(3, 1),
  due: d(3, 31),
  seller: { name: 'Seller', address: ['A street'], taxId: '123' },
  buyer: { name: 'Buyer', address: ['B street'] },
  lines: [{ id: 'l1', description: 'Work', quantity: 2, unitPrice: 50, taxRate: 0.23 }],
};

const accounts: LedgerAccount[] = [
  { code: '1000', name: 'Bank', normal: 'debit' },
  { code: '4000', name: 'Revenue', normal: 'credit' },
];
const lines: JournalLine[] = [
  {
    id: 'a',
    entryId: 'e1',
    date: d(3, 2),
    reference: 'R1',
    description: 'Sale',
    accountCode: '1000',
    debit: 100,
    credit: 0,
  },
  {
    id: 'b',
    entryId: 'e1',
    date: d(3, 2),
    reference: 'R1',
    description: 'Sale',
    accountCode: '4000',
    debit: 0,
    credit: 100,
  },
];

const requests: ExpenseRequest[] = ['Aaa', 'Bbb', 'Ccc'].map((merchant, index) => ({
  id: `x${String(index)}`,
  employee: 'Ewa',
  merchant,
  category: 'Travel',
  date: d(3, 10 + index),
  amount: 10 + index,
  status: 'pending',
}));

function approvals(extra: Partial<Parameters<typeof ExpenseApproval>[0]> = {}): ReactNode {
  return (
    <ExpenseApproval
      {...base}
      requests={requests}
      events={[]}
      onApprove={() => undefined}
      onReject={() => undefined}
      {...extra}
    />
  );
}

describe('messages: a custom override renders in each block', () => {
  it('KpiRow', () => {
    render(
      <KpiRow
        {...base}
        comparison="vs last month"
        kpis={[
          {
            id: 'r',
            label: 'Sales',
            format: 'money',
            better: 'up',
            value: 120,
            previous: 100,
            series: [100, 120],
          },
        ]}
        messages={{ label: 'Headline figures', better: 'ahead' }}
      />,
    );
    expect(screen.getByRole('region', { name: 'Headline figures' })).toBeInTheDocument();
    expect(screen.getByText('ahead')).toBeInTheDocument();
  });

  it('CashFlowChart', () => {
    render(
      <CashFlowChart
        {...base}
        points={[{ month: d(1, 1), inflow: 10, outflow: 4 }]}
        messages={{
          title: 'Cash movement',
          monthly: 'By month',
          showTable: 'Show the grid',
          positiveNote: (positive, total) => `Positive in ${String(positive)} of ${String(total)}`,
        }}
      />,
    );
    expect(screen.getByRole('heading', { name: 'Cash movement' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Show the grid' })).toBeInTheDocument();
    expect(screen.getByText('Positive in 1 of 1')).toBeInTheDocument();
  });

  it('InvoiceList, including its due words from a code', () => {
    render(
      <InvoiceList
        {...base}
        invoices={[invoice]}
        today={TODAY}
        defaultPeriod="all"
        messages={{
          title: 'Sales invoices',
          newInvoice: 'Create invoice',
          dueText: (info) =>
            info.kind === 'overdue'
              ? `${String(info.days)} ${plural(info.days, { one: 'day', other: 'days' }, 'en-GB')} overdue`
              : '',
        }}
        onCreateInvoice={() => undefined}
      />,
    );
    expect(screen.getByRole('heading', { name: 'Sales invoices' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create invoice' })).toBeInTheDocument();
    expect(screen.getAllByText('7 days overdue').length).toBeGreaterThan(0);
  });

  it('InvoiceDetail', () => {
    render(
      <InvoiceDetail
        {...base}
        invoice={document}
        today={TODAY}
        messages={{
          balanceDue: 'Amount due',
          billedTo: 'Bill to',
          heading: (n) => <>Invoice no. {n}</>,
        }}
      />,
    );
    expect(screen.getByText('Amount due')).toBeInTheDocument();
    expect(screen.getByText('Bill to')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Invoice no. INV-7/ })).toBeInTheDocument();
  });

  it('Ledger', () => {
    render(
      <Ledger
        {...base}
        accounts={accounts}
        lines={lines}
        messages={{ title: 'Journal', balanced: 'In balance', debit: 'Dr' }}
      />,
    );
    expect(screen.getByRole('heading', { name: 'Journal' })).toBeInTheDocument();
    expect(screen.getByText('In balance')).toBeInTheDocument();
    expect(screen.getAllByText('Dr').length).toBeGreaterThan(0);
  });

  it('ExpenseApproval, with a plural function', () => {
    render(
      approvals({
        messages: {
          title: 'Expense claims',
          approve: 'Accept',
          approveMany: (count) =>
            `Accept ${String(count)} ${plural(count, { one: 'claim', other: 'claims' }, 'en-GB')}`,
        },
      }),
    );
    expect(screen.getByRole('heading', { name: 'Expense claims' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /^Approve Aaa/ }).length).toBeGreaterThan(0);
    expect(screen.getAllByText('Accept').length).toBeGreaterThan(0);
  });

  it('ArAging', () => {
    render(
      <ArAging
        {...base}
        today={TODAY}
        receivables={[
          { id: 'r', customer: 'Kestrel', invoice: 'INV-1', due: d(3, 1), outstanding: 50 },
        ]}
        messages={{ title: 'Debtor ageing', customer: 'Debtor', total: 'Sum' }}
      />,
    );
    expect(screen.getByRole('heading', { name: 'Debtor ageing' })).toBeInTheDocument();
    expect(screen.getByText('Debtor')).toBeInTheDocument();
  });

  it('BudgetVsActual', () => {
    render(
      <BudgetVsActual
        {...base}
        lines={[{ id: 'b', category: 'Travel', budget: 100, actual: 140 }]}
        messages={{
          title: 'Budget and actuals',
          varianceWords: (position, percent) =>
            `${percent ?? ''} ${position === 'over' ? 'above plan' : 'below plan'}`,
        }}
      />,
    );
    expect(screen.getByRole('heading', { name: 'Budget and actuals' })).toBeInTheDocument();
    expect(screen.getAllByText(/above plan/).length).toBeGreaterThan(0);
  });
});

describe('messages: the empty state action', () => {
  const none = { ...base, emptyAction: action };

  it.each([
    ['InvoiceList', <InvoiceList key="a" {...none} invoices={[]} today={TODAY} />],
    ['Ledger', <Ledger key="b" {...none} accounts={accounts} lines={[]} />],
    ['CashFlowChart', <CashFlowChart key="c" {...none} points={[]} />],
    ['ExpenseApproval', approvals({ requests: [], emptyAction: action })],
    ['ArAging', <ArAging key="e" {...none} receivables={[]} today={TODAY} />],
    ['BudgetVsActual', <BudgetVsActual key="f" {...none} lines={[]} />],
  ])('%s shows it under the note', (_name, element) => {
    render(element);
    expect(screen.getByRole('button', { name: 'Do it' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('shows none when no action is given', () => {
    render(<Ledger {...base} accounts={accounts} lines={[]} />);
    expect(screen.queryByRole('button', { name: 'Do it' })).not.toBeInTheDocument();
  });
});

describe('due words', () => {
  it('turns into a code and back into the English words', () => {
    expect(dueInfo(invoice, TODAY)).toEqual({ kind: 'overdue', days: 7 });
    expect(englishDue({ kind: 'overdue', days: 7 })).toBe('7 days overdue');
    expect(dueText(invoice, TODAY)).toBe('7 days overdue');
    expect(dueInfo({ ...invoice, status: 'paid' }, TODAY)).toBeNull();
  });
});

describe('ExpenseApproval lead Approve', () => {
  const leads = () =>
    screen
      .getAllByRole('button', { name: /^Approve (Aaa|Bbb|Ccc)/ })
      .filter((button) => button.hasAttribute('data-lead'))
      .map((button) => /^Approve (\w+)/.exec(button.getAttribute('aria-label') ?? '')?.[1]);

  it('fills only the first row at rest', () => {
    render(approvals());
    // Each row draws its decision twice (narrow and wide layouts), so a lead shows up in both.
    expect(new Set(leads())).toEqual(new Set(['Aaa']));
    for (const button of screen.getAllByRole('button', { name: /^Approve (Bbb|Ccc)/ })) {
      expect(button).not.toHaveAttribute('data-lead');
    }
  });

  it('moves to the row that is hovered', async () => {
    const user = userEvent.setup();
    render(approvals());
    const row = screen.getAllByText('Ccc')[0]?.closest('tr');
    expect(row).not.toBeNull();
    await user.hover(row as HTMLElement);
    expect(new Set(leads())).toEqual(new Set(['Ccc']));
    await user.unhover(row as HTMLElement);
    expect(new Set(leads())).toEqual(new Set(['Aaa']));
  });

  it('moves to the row that holds focus', () => {
    render(approvals());
    const target = screen.getAllByRole('button', { name: /^Approve Bbb/ })[0];
    if (target === undefined) throw new Error('no Approve button for Bbb');
    act(() => {
      target.focus();
    });
    expect(new Set(leads())).toEqual(new Set(['Bbb']));
  });
});
