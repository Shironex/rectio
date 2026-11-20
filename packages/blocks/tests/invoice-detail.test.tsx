import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { InvoiceDetail, type InvoiceDocument } from '../src/index';
import { InvoiceDetail as MotionInvoiceDetail } from '../src/motion';

const d = (m: number, day: number) => new Date(2026, m - 1, day);
const TODAY = d(3, 19);

const invoice = (overrides: Partial<InvoiceDocument> = {}): InvoiceDocument => ({
  number: 'INV-2026-0142',
  status: 'sent',
  issued: d(2, 1),
  due: d(3, 3),
  seller: { name: 'Fernhill Systems', address: ['1 Quay Street'] },
  buyer: { name: 'Kestrel Analytics', address: ['8 Mill Lane'] },
  lines: [
    { id: 'l1', description: 'Support', quantity: 2, unit: 'h', unitPrice: 90, taxRate: 0.23 },
  ],
  ...overrides,
});

const base = { currency: 'EUR', locale: 'en-GB', today: TODAY };

describe('InvoiceDetail send reminder', () => {
  it('chases an overdue invoice', async () => {
    const user = userEvent.setup();
    const onSendReminder = vi.fn();
    render(<InvoiceDetail {...base} invoice={invoice()} onSendReminder={onSendReminder} />);
    await user.click(screen.getByRole('button', { name: 'Send reminder' }));
    expect(onSendReminder).toHaveBeenCalledOnce();
  });

  it('chases an unpaid invoice that is not due yet', () => {
    render(
      <InvoiceDetail
        {...base}
        invoice={invoice({ due: d(4, 1) })}
        onSendReminder={() => undefined}
      />,
    );
    expect(screen.getByRole('button', { name: 'Send reminder' })).toBeInTheDocument();
  });

  it('is not offered on drafts, void or paid invoices', () => {
    for (const status of ['draft', 'void', 'paid'] as const) {
      const { unmount } = render(
        <InvoiceDetail {...base} invoice={invoice({ status })} onSendReminder={() => undefined} />,
      );
      expect(screen.queryByRole('button', { name: 'Send reminder' })).toBeNull();
      unmount();
    }
  });

  it('is not offered once the balance is paid in full', () => {
    render(
      <InvoiceDetail
        {...base}
        invoice={invoice({
          payments: [{ id: 'p1', date: d(3, 1), amount: 221.4, method: 'Bank transfer' }],
        })}
        onSendReminder={() => undefined}
      />,
    );
    expect(screen.queryByRole('button', { name: 'Send reminder' })).toBeNull();
  });

  it('takes its words from the messages and works in the motion twin', () => {
    render(
      <MotionInvoiceDetail
        {...base}
        invoice={invoice()}
        onSendReminder={() => undefined}
        messages={{ sendReminder: 'Wyślij przypomnienie' }}
      />,
    );
    expect(screen.getByRole('button', { name: 'Wyślij przypomnienie' })).toBeInTheDocument();
  });
});
