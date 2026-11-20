'use client';

import {
  ArrowLeftIcon,
  BellRingingIcon,
  CheckCircleIcon,
  CopyIcon,
  DotsThreeIcon,
  EnvelopeSimpleIcon,
  EyeIcon,
  FileTextIcon,
  PaperPlaneTiltIcon,
  ProhibitIcon,
  ReceiptIcon,
} from '@phosphor-icons/react';
import {
  BlockPanel,
  balanceDue,
  documentTotals,
  paymentState,
  sumMoney,
  type InvoiceDocument,
} from '@rectio/blocks';
import { InvoiceDetail } from '@rectio/blocks/motion';
import {
  Button,
  Menu,
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
  Money,
  SkeletonLine,
  Timeline,
  TimelineItem,
  useToast,
  type TimelineTone,
} from '@rectio/ui';
import Link from 'next/link';
import { useState, type ReactNode } from 'react';

import { CURRENCY, LOCALE, TODAY, formatLongDate, isoDay } from '@/data/company';
import { INVOICES, invoiceRecord, type InvoiceRecord } from '@/data/invoices';
import { useAppData } from '../shell/app-data';
import { ErrorPanel, LoadingPanel, LoadingRegion } from '../states/state-views';
import { usePageState } from '../use-page-state';
import { RecordPaymentDialog } from './record-payment-dialog';

interface Event {
  id: string;
  title: string;
  date: Date;
  tone: TimelineTone;
  icon: ReactNode;
  detail?: ReactNode;
}

/** What happened to the invoice, oldest first: written, sent, opened, chased, paid. */
function history(
  record: InvoiceRecord,
  document: InvoiceDocument,
  reminders: readonly Date[],
): Event[] {
  const events: Event[] = [
    {
      id: 'created',
      title: document.status === 'draft' ? 'Draft started' : 'Created',
      date: document.issued,
      tone: 'neutral',
      icon: <FileTextIcon aria-hidden weight="bold" />,
    },
  ];
  if (document.status !== 'draft') {
    events.push({
      id: 'sent',
      title: `Sent to ${record.customer.email}`,
      date: document.issued,
      tone: 'accent',
      icon: <PaperPlaneTiltIcon aria-hidden weight="bold" />,
    });
  }
  if (record.viewed !== undefined) {
    events.push({
      id: 'viewed',
      title: `Opened by ${record.customer.contact}`,
      date: record.viewed,
      tone: 'neutral',
      icon: <EyeIcon aria-hidden weight="bold" />,
    });
  }
  reminders.forEach((date, index) => {
    events.push({
      id: `reminder-${String(index)}`,
      title: index === 0 ? 'Reminder sent' : 'Second reminder sent',
      date,
      tone: 'warning',
      icon: <BellRingingIcon aria-hidden weight="bold" />,
    });
  });
  for (const payment of document.payments ?? []) {
    events.push({
      id: payment.id,
      title: 'Payment received',
      date: payment.date,
      tone: 'positive',
      icon: <ReceiptIcon aria-hidden weight="bold" />,
      detail: (
        <>
          <Money amount={payment.amount} currency={CURRENCY} locale={LOCALE} />, {payment.method}
        </>
      ),
    });
  }
  if (document.status === 'void') {
    events.push({
      id: 'void',
      title: 'Voided',
      date: document.due,
      tone: 'negative',
      icon: <ProhibitIcon aria-hidden weight="bold" />,
    });
  }
  return events.sort((a, b) => a.date.getTime() - b.date.getTime());
}

function CustomerPanel({ record }: { record: InvoiceRecord }) {
  const { customer } = record;
  const open = INVOICES.filter((i) => i.customer === customer.name && balanceDue(i, CURRENCY) > 0);
  const owed = sumMoney(
    open.map((i) => balanceDue(i, CURRENCY)),
    CURRENCY,
  );
  return (
    <BlockPanel title="Customer" headingLevel={2}>
      <dl className="flex flex-col gap-3 text-sm">
        <div className="flex flex-col gap-0.5">
          <dt className="sr-only">Name</dt>
          <dd className="font-medium text-fg">{customer.name}</dd>
          <dd className="text-fg-muted">{customer.contact}</dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="text-fg-muted">Email</dt>
          <dd>
            <a
              href={`mailto:${customer.email}`}
              className="inline-flex items-center gap-1.5 text-accent-strong hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            >
              <EnvelopeSimpleIcon aria-hidden weight="bold" className="size-3.5" />
              {customer.email}
            </a>
          </dd>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-0.5">
            <dt className="text-fg-muted">Terms</dt>
            <dd className="numeric">{customer.terms} days</dd>
          </div>
          <div className="flex flex-col gap-0.5">
            <dt className="text-fg-muted">VAT</dt>
            <dd>
              {customer.vatRate > 0 ? `${String(customer.vatRate * 100)}%` : 'Reverse charge'}
            </dd>
          </div>
        </div>
        <div className="flex items-baseline justify-between gap-3 border-t border-line pt-3">
          <dt className="text-fg-muted">
            Owed on {open.length} {open.length === 1 ? 'invoice' : 'invoices'}
          </dt>
          <dd className="font-medium">
            <Money amount={owed} currency={CURRENCY} locale={LOCALE} />
          </dd>
        </div>
      </dl>
    </BlockPanel>
  );
}

function DetailLoading() {
  return (
    <LoadingRegion label="Loading the invoice">
      <div className="flex flex-col gap-2">
        <SkeletonLine size="2xl" width="2xl" />
        <SkeletonLine size="sm" width="w-40" />
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-3">
        <LoadingPanel kind="table" rows={5} className="lg:col-span-2" />
        <LoadingPanel kind="list" rows={4} />
      </div>
    </LoadingRegion>
  );
}

/** One invoice: the document with its actions, the customer, and what has happened to it. */
export function InvoiceDetailPage({ id }: { id: string }) {
  const record = invoiceRecord(id);
  const state = usePageState();
  const toast = useToast();
  const { openNewInvoice } = useAppData();
  const [document, setDocument] = useState<InvoiceDocument | undefined>(record?.document);
  const [reminders, setReminders] = useState<readonly Date[]>(record?.reminders ?? []);
  const [paying, setPaying] = useState(false);

  if (record === undefined || document === undefined) {
    return (
      <ErrorPanel
        title="There is no invoice with that number"
        description="It may have been deleted. Go back to the list to find it."
      />
    );
  }

  const totals = documentTotals(document.lines, document.payments ?? [], CURRENCY);
  const payState = paymentState(document.status, totals, document.due, TODAY);
  const open = payState === 'due' || payState === 'overdue' || payState === 'partial';

  const remind = () => {
    setReminders((list) => [...list, TODAY]);
    toast.add({
      type: 'success',
      title: 'Reminder sent',
      description: `${record.customer.contact} gets a copy of ${document.number} with the balance due.`,
    });
  };

  return (
    <>
      <div className="flex flex-col gap-3">
        <Link
          href="/invoices"
          className="inline-flex w-fit items-center gap-1.5 rounded-control text-sm text-fg-muted hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus pointer-coarse:min-h-(--rx-control-height-touch)"
        >
          <ArrowLeftIcon aria-hidden weight="bold" className="size-3.5 rtl:-scale-x-100" />
          All invoices
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
          <div className="flex min-w-0 flex-col gap-1">
            <h1 className="font-display text-2xl font-heading tracking-tight numeric sm:text-3xl">
              {document.number}
            </h1>
            <p className="text-sm text-fg-muted">
              {record.customer.name}, issued {formatLongDate(document.issued)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Menu>
              <MenuTrigger
                render={
                  <Button variant="secondary" iconOnly aria-label="More actions">
                    <DotsThreeIcon aria-hidden weight="bold" className="size-4" />
                  </Button>
                }
              />
              <MenuContent align="end" className="min-w-48">
                <MenuItem
                  icon={<CopyIcon aria-hidden weight="bold" className="size-4" />}
                  onClick={openNewInvoice}
                >
                  Duplicate
                </MenuItem>
                <MenuItem
                  icon={<CheckCircleIcon aria-hidden weight="bold" className="size-4" />}
                  disabled={!open}
                  onClick={() => {
                    setPaying(true);
                  }}
                >
                  Mark as paid
                </MenuItem>
                <MenuSeparator />
                <MenuItem
                  tone="danger"
                  icon={<ProhibitIcon aria-hidden weight="bold" className="size-4" />}
                  disabled={document.status === 'void' || totals.paid > 0}
                  onClick={() => {
                    setDocument({ ...document, status: 'void' });
                    toast.add({ type: 'info', title: `${document.number} voided` });
                  }}
                >
                  Void invoice
                </MenuItem>
              </MenuContent>
            </Menu>
          </div>
        </div>
      </div>

      {state === 'loading' ? (
        <DetailLoading />
      ) : state === 'error' || state === 'empty' ? (
        <ErrorPanel title="This invoice did not load" />
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-3">
          <InvoiceDetail
            invoice={document}
            currency={CURRENCY}
            locale={LOCALE}
            today={TODAY}
            // The page heading already carries the number, so the card names what it holds.
            messages={{ heading: () => 'Lines and payments' }}
            className="lg:col-span-2"
            onRecordPayment={() => {
              setPaying(true);
            }}
            onSendReminder={remind}
            onSend={() => {
              setDocument({ ...document, status: 'sent' });
              toast.add({
                type: 'success',
                title: `${document.number} sent`,
                description: `Emailed to ${record.customer.email}.`,
              });
            }}
            onDownload={() => {
              toast.add({
                type: 'success',
                title: 'PDF ready',
                description: `${document.number}.pdf will download in a moment.`,
              });
            }}
          />
          <div className="flex flex-col gap-6">
            <CustomerPanel record={record} />
            <BlockPanel title="History">
              <Timeline density="compact">
                {history(record, document, reminders).map((event) => (
                  <TimelineItem
                    key={event.id}
                    tone={event.tone}
                    icon={event.icon}
                    title={event.title}
                    time={{ dateTime: isoDay(event.date), label: formatLongDate(event.date) }}
                  >
                    {event.detail !== undefined && (
                      <p className="text-sm text-fg-muted">{event.detail}</p>
                    )}
                  </TimelineItem>
                ))}
              </Timeline>
            </BlockPanel>
          </div>
        </div>
      )}

      <RecordPaymentDialog
        open={paying}
        onOpenChange={setPaying}
        number={document.number}
        balance={totals.balance}
        onRecord={(payment) => {
          const payments = [
            ...(document.payments ?? []),
            { ...payment, id: `p-new-${String((document.payments ?? []).length)}` },
          ];
          setDocument({
            ...document,
            payments,
            ...(payment.amount >= totals.balance ? { status: 'paid' as const } : {}),
          });
          toast.add({
            type: 'success',
            title: 'Payment recorded',
            description: `${document.number} is ${payment.amount >= totals.balance ? 'paid in full' : 'part paid'}.`,
          });
        }}
      />
    </>
  );
}
