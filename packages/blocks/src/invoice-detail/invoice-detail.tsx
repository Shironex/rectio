import { DownloadSimpleIcon, PaperPlaneTiltIcon, ReceiptIcon } from '@phosphor-icons/react';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  cn,
} from '@rectio/ui';
import type { ReactNode } from 'react';

import { useBlockParts } from '../lib/block-parts';
import { BlockPanel } from '../lib/block-panel';
import {
  daysBetween,
  formatLongDate,
  formatPercent,
  formatShortDate,
  resolveLocale,
} from '../lib/finance';
import { StateBadge } from '../lib/state-badge';
import {
  documentTotals,
  paymentState,
  type InvoiceDocument,
  type InvoiceParty,
} from './invoice-detail.logic';

export interface InvoiceDetailProps {
  invoice: InvoiceDocument;
  currency: string;
  locale?: string;
  today?: Date;
  /** Shown while a balance is open. */
  onRecordPayment?: () => void;
  /** Shown for drafts. */
  onSend?: () => void;
  onDownload?: () => void;
  className?: string;
}

function Party({ label, party }: { label: string; party: InvoiceParty }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <dt className="text-sm text-fg-muted">{label}</dt>
      <dd className="flex flex-col text-sm">
        <span className="text-base font-medium">{party.name}</span>
        {party.address.map((line) => (
          <span key={line} className="text-fg-muted">
            {line}
          </span>
        ))}
        {party.taxId !== undefined && (
          <span className="text-fg-muted">
            Tax id <span className="numeric">{party.taxId}</span>
          </span>
        )}
      </dd>
    </div>
  );
}

function Meta({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-sm text-fg-muted">{label}</dt>
      <dd className="text-sm">{children}</dd>
    </div>
  );
}

/**
 * One invoice as the reader checks it: who billed whom, each line with its VAT rate, the totals
 * per rate, what has been paid and what is still owed. Totals are computed here from the lines,
 * in minor units, so the document always adds up.
 */
export function InvoiceDetail({
  invoice,
  currency,
  locale: requestedLocale,
  today = new Date(),
  onRecordPayment,
  onSend,
  onDownload,
  className,
}: InvoiceDetailProps) {
  const locale = resolveLocale(requestedLocale);
  const { Button, Money } = useBlockParts();
  const payments = invoice.payments ?? [];
  const totals = documentTotals(invoice.lines, payments, currency);
  const state = paymentState(invoice.status, totals, invoice.due, today);
  const overdueDays = daysBetween(invoice.due, today);
  const open = state === 'due' || state === 'overdue' || state === 'partial';
  const money = (amount: number, className?: string) => (
    <Money amount={amount} currency={currency} locale={locale} className={className} />
  );

  return (
    <BlockPanel
      title={
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span>
            Invoice <span className="numeric">{invoice.number}</span>
          </span>
          <StateBadge state={state} />
        </span>
      }
      description={
        state === 'overdue'
          ? `${String(overdueDays)} ${overdueDays === 1 ? 'day' : 'days'} overdue, due ${formatLongDate(invoice.due, locale)}`
          : state === 'paid'
            ? `Paid in full`
            : `Due ${formatLongDate(invoice.due, locale)}`
      }
      actions={
        <>
          {onDownload !== undefined && (
            <Button variant="secondary" onClick={onDownload}>
              <DownloadSimpleIcon aria-hidden weight="bold" className="size-4" />
              PDF
            </Button>
          )}
          {state === 'draft' && onSend !== undefined && (
            <Button onClick={onSend}>
              <PaperPlaneTiltIcon aria-hidden weight="bold" className="size-4" />
              Send invoice
            </Button>
          )}
          {open && onRecordPayment !== undefined && (
            <Button onClick={onRecordPayment}>
              <ReceiptIcon aria-hidden weight="bold" className="size-4" />
              Record payment
            </Button>
          )}
        </>
      }
      className={className}
      bodyClassName="gap-6"
    >
      <dl className="grid grid-cols-1 gap-x-8 gap-y-4 @xl:grid-cols-2 @4xl:grid-cols-3">
        <Party label="Billed to" party={invoice.buyer} />
        <Party label="From" party={invoice.seller} />
        <div className="grid grid-cols-2 gap-x-8 gap-y-3 @xl:col-span-2 @4xl:col-span-1 @4xl:grid-cols-1">
          <Meta label="Issued">
            <span className="numeric">{formatLongDate(invoice.issued, locale)}</span>
          </Meta>
          <Meta label="Due">
            <span className={cn('numeric', state === 'overdue' && 'text-negative-strong')}>
              {formatLongDate(invoice.due, locale)}
            </span>
          </Meta>
          {invoice.reference !== undefined && (
            <Meta label="Reference">
              <span className="numeric">{invoice.reference}</span>
            </Meta>
          )}
        </div>
      </dl>

      <Table>
        <TableCaption className="sr-only">Line items, amounts in {currency}</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Description</TableHead>
            <TableHead align="end" className="hidden @xl:table-cell">
              Qty
            </TableHead>
            <TableHead align="end" className="hidden @xl:table-cell">
              Unit price
            </TableHead>
            <TableHead align="end" className="hidden @2xl:table-cell">
              VAT
            </TableHead>
            <TableHead align="end">Net, {currency}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoice.lines.map((line, index) => (
            <TableRow key={line.id}>
              <TableCell>
                <span className="block">{line.description}</span>
                {line.detail !== undefined && (
                  <span className="block text-sm text-fg-muted">{line.detail}</span>
                )}
                {/* Phones fold quantity, price and rate under the description. */}
                <span className="block text-sm text-fg-muted @xl:hidden">
                  <span className="numeric">
                    {line.quantity}
                    {line.unit !== undefined && ` ${line.unit}`}
                  </span>{' '}
                  × {money(line.unitPrice)}, VAT{' '}
                  {formatPercent(line.taxRate, locale, { digits: 0 })}
                </span>
              </TableCell>
              <TableCell align="end" className="hidden whitespace-nowrap @xl:table-cell">
                <span className="numeric">
                  {line.quantity}
                  {line.unit !== undefined && <span className="text-fg-muted"> {line.unit}</span>}
                </span>
              </TableCell>
              <TableCell align="end" className="hidden @xl:table-cell">
                {money(line.unitPrice)}
              </TableCell>
              <TableCell align="end" className="hidden text-fg-muted @2xl:table-cell">
                <span className="numeric">
                  {formatPercent(line.taxRate, locale, { digits: 0 })}
                </span>
              </TableCell>
              <TableCell align="end">{money(totals.lineNets[index] ?? 0)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex flex-col-reverse gap-6 @2xl:flex-row @2xl:items-start @2xl:justify-between">
        <div className="flex max-w-prose flex-col gap-4">
          {payments.length > 0 && (
            <div className="flex flex-col gap-2">
              <h3 className="text-sm font-medium">Payments received</h3>
              <ul className="flex flex-col divide-y divide-line rounded-control border border-line">
                {payments.map((payment) => (
                  <li
                    key={payment.id}
                    className="flex items-center justify-between gap-4 px-3 py-2 text-sm"
                  >
                    <span className="flex flex-col">
                      <span className="numeric">{formatShortDate(payment.date, locale)}</span>
                      <span className="text-fg-muted">{payment.method}</span>
                    </span>
                    {money(payment.amount)}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {invoice.notes !== undefined && <p className="text-sm text-fg-muted">{invoice.notes}</p>}
        </div>

        <dl className="grid min-w-0 grid-cols-2 gap-x-6 gap-y-1.5 px-(--rx-table-cell-padding-x) text-sm @2xl:min-w-72 @2xl:max-w-sm @2xl:px-0">
          <dt className="text-fg-muted">Subtotal</dt>
          <dd className="text-end">{money(totals.subtotal)}</dd>
          {totals.vat.map((group) => (
            <div key={group.rate} className="contents">
              <dt className="text-fg-muted">
                VAT {formatPercent(group.rate, locale, { digits: 0 })}
                <span className="block text-fg-subtle @2xl:inline">
                  <span className="hidden @2xl:inline"> </span>on {money(group.net)}
                </span>
              </dt>
              <dd className="text-end">{money(group.vat)}</dd>
            </div>
          ))}
          {/* One rule across the row, not one per cell with the column gap between them. */}
          <div className="col-span-2 grid grid-cols-subgrid border-t border-line-strong pt-2">
            <dt className="font-medium">Total</dt>
            <dd className="text-end">{money(totals.total, 'text-base font-strong')}</dd>
          </div>
          {totals.paid > 0 && (
            <>
              <dt className="text-fg-muted">Paid</dt>
              <dd className="text-end">{money(-totals.paid)}</dd>
            </>
          )}
          {state !== 'draft' && state !== 'void' && (
            // One tinted row for the figure the page exists to answer.
            <div className="col-span-2 mt-1 grid grid-cols-subgrid items-baseline rounded-control bg-surface-sunken px-3 py-2">
              <dt className="font-medium">Balance due</dt>
              <dd className={cn('text-end', state === 'overdue' && 'text-negative-strong')}>
                {money(totals.balance, 'text-lg font-strong')}
              </dd>
            </div>
          )}
        </dl>
      </div>
    </BlockPanel>
  );
}
