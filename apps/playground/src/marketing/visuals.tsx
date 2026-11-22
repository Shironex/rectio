import {
  ArrowDownRightIcon,
  ArrowUpRightIcon,
  CheckCircleIcon,
  ClockIcon,
} from '@phosphor-icons/react';
import {
  AmountInput,
  Badge,
  Button,
  Calendar,
  Checkbox,
  Field,
  FieldLabel,
  Money,
} from '@rectio/ui';
import { useState } from 'react';

/**
 * Small pieces of real rectio UI for the landing template: the cards that float over the hero and
 * the visuals inside the bento tiles. Every one is live: the switches switch, the figures format.
 */

const LOCALE = 'en-GB';
const CURRENCY = 'EUR';

export function ApprovalCard() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-fg-muted">Expense</span>
        <Badge tone="positive">Approved</Badge>
      </div>
      <div className="flex items-end justify-between gap-3">
        <div className="flex min-w-0 flex-col">
          <span className="truncate font-medium text-fg">Lisbon offsite</span>
          <span className="text-sm text-fg-muted">Niamh Walsh</span>
        </div>
        <Money amount={2480} currency={CURRENCY} locale={LOCALE} className="text-lg font-strong" />
      </div>
    </div>
  );
}

export function CashCard() {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm text-fg-muted">Cash on hand</span>
      <Money
        amount={412890.4}
        currency={CURRENCY}
        locale={LOCALE}
        quietCurrency
        className="text-2xl font-strong tracking-tight"
      />
      <span className="inline-flex items-center gap-1 text-sm font-medium text-positive-strong">
        <ArrowUpRightIcon aria-hidden weight="bold" className="size-3.5" />
        6.4% <span className="font-regular text-fg-muted">vs February</span>
      </span>
    </div>
  );
}

export function PaidCard() {
  return (
    <div className="flex items-center gap-3">
      <CheckCircleIcon aria-hidden weight="fill" className="size-8 shrink-0 text-positive" />
      <div className="flex min-w-0 flex-col">
        <span className="font-medium text-fg">INV-2026-0118 paid</span>
        <span className="text-sm text-fg-muted">
          Nordwind Logistik,{' '}
          <Money amount={18450} currency={CURRENCY} locale={LOCALE} className="text-sm" />
        </span>
      </div>
    </div>
  );
}

const QUEUE = [
  { id: 'q1', who: 'Tomás Rivera', what: 'Client dinner, Porto', amount: 186.4, state: 'pending' },
  { id: 'q2', who: 'Amara Okafor', what: 'Laptop stand and dock', amount: 214, state: 'approved' },
  { id: 'q3', who: 'Jonas Becker', what: 'Train to Hamburg', amount: 98.7, state: 'pending' },
] as const;

/** A short approvals queue with working approve buttons. */
export function ApprovalQueue() {
  const [approved, setApproved] = useState<Set<string>>(new Set(['q2']));
  return (
    <ul className="flex flex-col divide-y divide-line overflow-hidden rounded-panel border border-line bg-surface">
      {QUEUE.map((item) => {
        const done = approved.has(item.id);
        return (
          <li key={item.id} className="flex items-center gap-3 px-4 py-3">
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-base font-medium text-fg">{item.what}</span>
              <span className="text-sm text-fg-muted">{item.who}</span>
            </div>
            <Money amount={item.amount} currency={CURRENCY} locale={LOCALE} className="text-base" />
            {done ? (
              <Badge tone="positive" className="w-20 justify-center">
                Approved
              </Badge>
            ) : (
              <Button
                size="sm"
                variant="secondary"
                className="w-20"
                onClick={() => {
                  setApproved((current) => new Set(current).add(item.id));
                }}
              >
                Approve
              </Button>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/** The month-end calendar, live. */
export function CloseCalendar() {
  const [day, setDay] = useState<Date | undefined>(new Date(2026, 2, 31));
  return (
    <div className="flex items-center justify-center rounded-panel border border-line bg-surface p-3">
      <Calendar
        mode="single"
        selected={day}
        onSelect={setDay}
        defaultMonth={new Date(2026, 2, 1)}
        locale={LOCALE}
      />
    </div>
  );
}

/** A money field that formats as you type. */
export function ExactAmount() {
  const [amount, setAmount] = useState<number | null>(12480.5);
  return (
    <div className="flex flex-col gap-4 rounded-panel border border-line bg-surface p-4">
      <Field>
        <FieldLabel>Invoice total</FieldLabel>
        <AmountInput currency={CURRENCY} locale={LOCALE} value={amount} onValueChange={setAmount} />
      </Field>
      <div className="flex items-center justify-between text-sm">
        <span className="text-fg-muted">VAT 23%</span>
        <Money amount={(amount ?? 0) * 0.23} currency={CURRENCY} locale={LOCALE} />
      </div>
    </div>
  );
}

const AGING = [
  { label: 'Current', share: 0.58, amount: 96420, tone: 'bg-chart-sequence-1' },
  { label: '1 to 30 days', share: 0.24, amount: 39880, tone: 'bg-chart-sequence-2' },
  { label: '31 to 60 days', share: 0.12, amount: 19940, tone: 'bg-chart-sequence-3' },
  { label: 'Over 60 days', share: 0.06, amount: 9970, tone: 'bg-chart-sequence-4' },
] as const;

/** Receivables by age as one stacked bar and its legend. */
export function AgingSummary() {
  return (
    <div className="flex flex-col gap-4 rounded-panel border border-line bg-surface p-4">
      <div className="flex h-3 overflow-hidden rounded-full" aria-hidden>
        {AGING.map((bucket) => (
          <span
            key={bucket.label}
            className={bucket.tone}
            style={{ width: `${String(bucket.share * 100)}%` }}
          />
        ))}
      </div>
      <dl className="grid grid-cols-2 gap-3">
        {AGING.map((bucket) => (
          <div key={bucket.label} className="flex flex-col gap-0.5">
            <dt className="flex items-center gap-2 text-sm text-fg-muted">
              <span aria-hidden className={`size-2 rounded-full ${bucket.tone}`} />
              {bucket.label}
            </dt>
            <dd>
              <Money
                amount={bucket.amount}
                currency={CURRENCY}
                locale={LOCALE}
                quietCurrency
                className="text-base font-medium"
              />
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

const TASKS = [
  { id: 't1', label: 'Bank reconciliation', done: true },
  { id: 't2', label: 'Accruals posted', done: true },
  { id: 't3', label: 'Intercompany matched', done: false },
  { id: 't4', label: 'VAT return drafted', done: false },
];

/** A close checklist with working checkboxes and a progress count. */
export function CloseChecklist() {
  const [done, setDone] = useState(() => new Set(TASKS.filter((t) => t.done).map((t) => t.id)));
  return (
    <div className="flex flex-col gap-3 rounded-panel border border-line bg-surface p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-fg">March close</span>
        <span className="inline-flex items-center gap-1.5 text-sm text-fg-muted tabular-nums">
          <ClockIcon aria-hidden className="size-3.5" />
          {done.size} of {TASKS.length}
        </span>
      </div>
      <ul className="flex flex-col gap-2.5">
        {TASKS.map((task) => (
          <li key={task.id}>
            <label className="flex items-center gap-3 text-base text-fg pointer-coarse:min-h-(--rx-control-height-touch)">
              <Checkbox
                checked={done.has(task.id)}
                onCheckedChange={(checked) => {
                  setDone((current) => {
                    const next = new Set(current);
                    if (checked) next.add(task.id);
                    else next.delete(task.id);
                    return next;
                  });
                }}
              />
              <span className={done.has(task.id) ? 'text-fg-muted line-through' : undefined}>
                {task.label}
              </span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Spend falling against plan: good news in words, arrow and colour. */
export function SpendCard() {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm text-fg-muted">Software spend</span>
      <Money
        amount={8240}
        currency={CURRENCY}
        locale={LOCALE}
        quietCurrency
        className="text-2xl font-strong tracking-tight"
      />
      <span className="inline-flex items-center gap-1 text-sm font-medium text-positive-strong">
        <ArrowDownRightIcon aria-hidden weight="bold" className="size-3.5" />
        11% under plan
      </span>
    </div>
  );
}

const CHASE = [
  {
    id: 'c1',
    customer: 'Kestrel Analytics',
    number: 'INV-0121',
    amount: 6240,
    status: 'Second reminder sent',
    tone: 'warning',
  },
  {
    id: 'c2',
    customer: 'Atelier Lune',
    number: 'INV-0127',
    amount: 3915,
    status: 'Reminder in 2 days',
    tone: 'neutral',
  },
  {
    id: 'c3',
    customer: 'Nordwind Logistik',
    number: 'INV-0118',
    amount: 18450,
    status: 'Paid and matched',
    tone: 'positive',
  },
] as const;

/** Overdue invoices and where each one is in its reminder schedule. */
export function InvoiceChase() {
  return (
    <div className="flex flex-col rounded-panel border border-line bg-surface">
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
        <span className="text-sm font-medium text-fg">Reminders this week</span>
        <span className="text-sm text-fg-muted">3 invoices</span>
      </div>
      <ul className="flex flex-col divide-y divide-line">
        {CHASE.map((row) => (
          <li key={row.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3.5">
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-base font-medium text-fg">{row.customer}</span>
              <span className="text-sm text-fg-muted tabular-nums">{row.number}</span>
            </div>
            <Money amount={row.amount} currency={CURRENCY} locale={LOCALE} className="text-base" />
            <Badge tone={row.tone} className="max-sm:order-last">
              {row.status}
            </Badge>
          </li>
        ))}
      </ul>
    </div>
  );
}
