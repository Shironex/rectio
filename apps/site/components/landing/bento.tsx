'use client';

import { PaperPlaneTiltIcon } from '@phosphor-icons/react';
import {
  AmountInput,
  Button,
  Dialog,
  DialogContent,
  DialogTrigger,
  SelectContent,
  SelectItem,
  ToastProvider,
} from '@rectio/motion';
import {
  Badge,
  Calendar,
  Checkbox,
  DatePicker,
  DialogBody,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Field,
  FieldDescription,
  FieldLabel,
  Money,
  Select,
  SelectTrigger,
  cn,
  useToast,
  type DateRange,
} from '@rectio/ui';
import { useState, type ReactNode } from 'react';

const CATEGORIES = [
  { value: 'rail', label: 'Rail' },
  { value: 'flights', label: 'Flights' },
  { value: 'hotels', label: 'Hotels' },
  { value: 'meals', label: 'Client meals' },
  { value: 'software', label: 'Software' },
];

/** One cell: a short title that says what it proves, then the live components. */
function Cell({
  title,
  note,
  className,
  step,
  children,
}: {
  title: string;
  note: string;
  className?: string;
  step?: string;
  children: ReactNode;
}) {
  return (
    <article
      className={cn(
        'site-reveal flex flex-col gap-6 rounded-panel border border-line p-6 sm:p-7',
        step,
        className,
      )}
    >
      <div className="flex flex-col gap-1.5">
        <h3 className="text-lg font-strong text-fg">{title}</h3>
        <p className="max-w-md text-base text-fg-muted">{note}</p>
      </div>
      {children}
    </article>
  );
}

function ExpenseForm() {
  const [amount, setAmount] = useState<number | null>(214.5);
  const [category, setCategory] = useState<string | null>('meals');
  const [date, setDate] = useState<Date | null>(new Date(2026, 2, 11));
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <Field>
        <FieldLabel>Amount, EUR</FieldLabel>
        <AmountInput currency="EUR" locale="en-IE" value={amount} onValueChange={setAmount} />
        <FieldDescription>Typed as you would say it; grouped on blur.</FieldDescription>
      </Field>
      <Field>
        <FieldLabel>Date</FieldLabel>
        <DatePicker value={date} onValueChange={setDate} locale="en-IE" />
        <FieldDescription>Type dd/mm/yyyy or pick a day.</FieldDescription>
      </Field>
      <Field className="sm:col-span-2">
        <FieldLabel>Category</FieldLabel>
        <Select items={CATEGORIES} value={category} onValueChange={setCategory}>
          <SelectTrigger placeholder="Choose a category" />
          <SelectContent>
            {CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <label className="flex min-h-11 items-center gap-2.5 text-base text-fg sm:col-span-2">
        <Checkbox defaultChecked />
        Billable to the client
      </label>
    </div>
  );
}

const FORMATS = [
  { label: 'Ireland, euro', amount: 1204.5, currency: 'EUR', locale: 'en-IE' },
  { label: 'Germany, euro', amount: 1204.5, currency: 'EUR', locale: 'de-DE' },
  { label: 'Japan, yen', amount: 120450, currency: 'JPY', locale: 'ja-JP' },
  { label: 'Poland, zloty, a debit', amount: -312, currency: 'PLN', locale: 'pl-PL' },
  {
    label: 'Ledger style, a debit',
    amount: -312,
    currency: 'USD',
    locale: 'en-US',
    accounting: true,
  },
] as const;

function MoneyFormats() {
  return (
    <div className="flex flex-1 flex-col justify-between gap-5">
      <dl className="flex flex-col divide-y divide-line">
        {FORMATS.map((f) => (
          <div key={f.label} className="flex items-baseline justify-between gap-4 py-2.5">
            <dt className="text-sm text-fg-muted">{f.label}</dt>
            <dd>
              <Money
                amount={f.amount}
                currency={f.currency}
                locale={f.locale}
                tone={f.amount < 0 ? 'auto' : 'neutral'}
                accounting={'accounting' in f}
                className="text-lg"
              />
            </dd>
          </div>
        ))}
      </dl>
      <p className="text-sm text-fg-subtle">
        Formats come from the locale; no separator or symbol is placed by hand.
      </p>
    </div>
  );
}

const STATES = [
  { tone: 'neutral', label: 'Draft', next: 'Only you can see it' },
  { tone: 'info', label: 'In review', next: 'Waiting on Marta Nowak' },
  { tone: 'warning', label: 'Receipt missing', next: 'Attach one to submit' },
  { tone: 'positive', label: 'Approved', next: 'Paid with the next run' },
  { tone: 'negative', label: 'Rejected', next: 'Reason sent to you' },
] as const;

function Statuses() {
  return (
    <ul className="flex flex-col divide-y divide-line">
      {STATES.map((s) => (
        <li key={s.label} className="flex flex-col items-start gap-1 py-2.5">
          <Badge tone={s.tone}>{s.label}</Badge>
          <span className="text-sm text-fg-muted">{s.next}</span>
        </li>
      ))}
    </ul>
  );
}

function Period() {
  const [range, setRange] = useState<DateRange | undefined>({
    from: new Date(2026, 2, 3),
    to: new Date(2026, 2, 18),
  });
  return (
    <Calendar
      mode="range"
      locale="en-IE"
      selected={range}
      onSelect={setRange}
      defaultMonth={new Date(2026, 2, 1)}
      className="self-start"
    />
  );
}

/** What submitting sets in motion, so the cell says where the report goes after the toast. */
const APPROVAL_PATH = [
  'You submit the report',
  'Marta Nowak approves it',
  'Paid with the next run',
];

function SubmitFlow() {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  return (
    <div className="flex flex-1 flex-col items-start gap-4">
      <div className="flex w-full items-baseline justify-between gap-4 rounded-control border border-line bg-surface px-4 py-3">
        <span className="text-sm text-fg-muted">Report 2041, 6 lines</span>
        <Money amount={1269.2} currency="EUR" locale="en-IE" className="text-lg font-strong" />
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger render={<Button />}>
          <PaperPlaneTiltIcon aria-hidden weight="bold" className="size-4" />
          Submit for approval
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit report 2041?</DialogTitle>
            <DialogDescription>
              Marta Nowak approves it next. You can still withdraw it until she starts.
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <div className="flex items-baseline justify-between gap-4">
              <span className="text-base text-fg-muted">Total claimed</span>
              <Money
                amount={1269.2}
                currency="EUR"
                locale="en-IE"
                className="text-xl font-strong"
              />
            </div>
          </DialogBody>
          <DialogFooter>
            <DialogClose render={<Button variant="ghost" disabled={sending} />}>Cancel</DialogClose>
            <Button
              loading={sending}
              onClick={() => {
                setSending(true);
                setTimeout(() => {
                  setSending(false);
                  setOpen(false);
                  toast.add({
                    type: 'success',
                    title: 'Report submitted',
                    description: 'Marta Nowak has it now. You will hear when she decides.',
                  });
                }, 900);
              }}
            >
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ol className="mt-auto flex w-full flex-col divide-y divide-line border-t border-line text-sm">
        {APPROVAL_PATH.map((step, i) => (
          <li key={step} className="flex items-baseline gap-3 py-2">
            <span className="numeric text-fg-subtle">{i + 1}</span>
            <span className="text-fg-muted">{step}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function Bento() {
  return (
    <ToastProvider>
      <div className="grid gap-4 lg:grid-cols-12">
        <Cell
          title="Amounts, dates and categories"
          note="Inputs that parse what people type, in their locale, with labels and errors wired for screen readers."
          className="bg-surface lg:col-span-7"
        >
          <ExpenseForm />
        </Cell>
        <Cell
          title="Currency is never implied"
          note="Every figure carries its currency, a true minus sign and tabular digits."
          className="bg-surface-sunken lg:col-span-5"
          step="site-step-1"
        >
          <MoneyFormats />
        </Cell>
        <Cell
          title="Periods"
          note="Range selection with the keyboard, weeks starting where the locale says."
          className="bg-surface lg:col-span-4"
        >
          <Period />
        </Cell>
        <Cell
          title="States in words"
          note="Colour reinforces, never carries: every status reads without it."
          className="bg-surface lg:col-span-3"
          step="site-step-1"
        >
          <Statuses />
        </Cell>
        <Cell
          title="Confirm, then confirm it happened"
          note="A dialog that names what will happen, and a toast that says it did."
          className="bg-surface lg:col-span-5"
          step="site-step-2"
        >
          <SubmitFlow />
        </Cell>
      </div>
    </ToastProvider>
  );
}
