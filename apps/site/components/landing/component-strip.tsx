'use client';

import { ArrowRightIcon, CheckIcon, PlusIcon, WarningIcon } from '@phosphor-icons/react';
import {
  AmountInput,
  Badge,
  Button,
  Checkbox,
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Field,
  FieldError,
  FieldLabel,
  Input,
  Money,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  ToastProvider,
  cn,
  useToast,
} from '@rectio/ui';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useEffect, useRef, useState, type ReactNode } from 'react';

// The date picker carries the calendar library, the heaviest piece here, so its code loads only
// once the sheet nears the screen (see LazyDatePicker), not with the page.
const DatePicker = dynamic(() => import('@rectio/ui').then((m) => m.DatePicker));

const DATE_TEXT = new Intl.DateTimeFormat('en-IE', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

/**
 * The real DatePicker once the cell is within a screen of view; before that, the same field as a
 * read-only input with the date in it, so the sheet has its final shape from the first paint.
 */
function LazyDatePicker({
  value,
  onValueChange,
}: {
  value: Date | null;
  onValueChange: (date: Date | null) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (element === null) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting !== true) return;
        observer.disconnect();
        setNear(true);
      },
      { rootMargin: '100% 0px' },
    );
    observer.observe(element);
    return () => {
      observer.disconnect();
    };
  }, []);
  return (
    <div ref={ref} className="w-full">
      {near ? (
        <DatePicker locale="en-IE" value={value} onValueChange={onValueChange} />
      ) : (
        <Input readOnly value={value === null ? '' : DATE_TEXT.format(value)} />
      )}
    </div>
  );
}

/** Cells in the sheet below; the link says how many more the docs hold. */
const SHOWN = 11;

const CATEGORIES = [
  { value: 'rail', label: 'Rail' },
  { value: 'hotels', label: 'Hotels' },
  { value: 'meals', label: 'Client meals' },
];

const ROWS = [
  { merchant: 'Lufthansa', amount: -412.8 },
  { merchant: 'Hotel Bristol', amount: -538 },
  { merchant: 'Refund, Bahn', amount: 89.9 },
];

/** One specimen: the component's name, linking to its page, over the component itself, live. */
function Cell({
  name,
  slug,
  className,
  children,
}: {
  name: string;
  slug: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <li className={cn('flex min-w-0 flex-col gap-4 bg-surface p-4 sm:p-5', className)}>
      <Link
        href={`/docs/components/${slug}`}
        className="self-start rounded-control font-mono text-sm text-fg-muted underline decoration-transparent underline-offset-4 transition-colors duration-fast ease-standard pointer-fine:hover:text-fg pointer-fine:hover:decoration-line-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
      >
        {name}
      </Link>
      <div className="flex min-h-11 flex-1 flex-wrap items-center gap-2">{children}</div>
    </li>
  );
}

/** Approve shows the loading state, then the result; Undo puts it back. */
function ButtonSpecimen() {
  const [state, setState] = useState<'idle' | 'busy' | 'done'>('idle');
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(
    () => () => {
      clearTimeout(timer.current);
    },
    [],
  );
  return (
    <>
      <Button
        loading={state === 'busy'}
        disabled={state === 'done'}
        onClick={() => {
          setState('busy');
          timer.current = setTimeout(() => {
            setState('done');
          }, 900);
        }}
      >
        <CheckIcon aria-hidden weight="bold" className="size-4" />
        {state === 'done' ? 'Approved' : 'Approve'}
      </Button>
      <Button
        variant="ghost"
        disabled={state === 'idle'}
        onClick={() => {
          setState('idle');
        }}
      >
        Undo
      </Button>
    </>
  );
}

function ToastSpecimen() {
  const toast = useToast();
  return (
    <Button
      variant="secondary"
      onClick={() => {
        toast.add({
          type: 'success',
          title: 'Report sent',
          description: 'Report 2041 is with your manager.',
        });
      }}
    >
      Send report
    </Button>
  );
}

function DialogSpecimen() {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="secondary" />}>
        <PlusIcon aria-hidden weight="bold" className="size-4" />
        Add expense
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add expense</DialogTitle>
          <DialogDescription>Goes into the March report as a draft line.</DialogDescription>
        </DialogHeader>
        <DialogBody>
          <Field>
            <FieldLabel>Merchant</FieldLabel>
            <Input defaultValue="Deutsche Bahn" />
          </Field>
        </DialogBody>
        <DialogFooter>
          <DialogClose render={<Button variant="ghost" />}>Cancel</DialogClose>
          <DialogClose render={<Button />}>Save expense</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * The free components themselves, rendered live from @rectio/ui in a ruled specimen sheet: every
 * cell is the real component, with its name linking to its page. Nothing here is a picture.
 */
export function ComponentStrip({ total }: { total: number }) {
  const [billable, setBillable] = useState(true);
  const [amount, setAmount] = useState<number | null>(412.8);
  const [category, setCategory] = useState<string | null>('hotels');
  const [date, setDate] = useState<Date | null>(new Date(2026, 2, 19));
  const [vat, setVat] = useState('PL52');
  const vatInvalid = !/^PL\d{10}$/.test(vat.replaceAll(' ', ''));

  return (
    <ToastProvider>
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
          <h2 className="font-display text-2xl font-heading text-fg">
            <span className="font-regular">The free components,</span> running.
          </h2>
          <Link
            href="/docs"
            className="inline-flex min-h-11 items-center gap-1.5 text-base font-medium text-accent-strong underline decoration-line-strong underline-offset-4 pointer-fine:hover:decoration-current focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            {SHOWN} here, all {total} in the docs
            <ArrowRightIcon aria-hidden weight="bold" className="size-4" />
          </Link>
        </div>
        {/* Hairlines between cells come from the gap showing the line colour behind them. */}
        <ul
          aria-label="Free components"
          className="site-reveal grid grid-cols-2 gap-px overflow-hidden rounded-panel border border-line bg-line lg:grid-cols-4"
        >
          <Cell name="Button" slug="button">
            <ButtonSpecimen />
          </Cell>
          <Cell name="Badge" slug="badge">
            <Badge tone="positive">
              <CheckIcon aria-hidden weight="bold" />
              Paid
            </Badge>
            <Badge tone="negative">
              <WarningIcon aria-hidden weight="bold" />
              Overdue
            </Badge>
            <Badge>Draft</Badge>
          </Cell>
          <Cell name="Checkbox" slug="checkbox">
            <label className="flex min-h-11 items-center gap-2.5 text-base text-fg">
              <Checkbox
                checked={billable}
                onCheckedChange={(checked) => {
                  setBillable(checked);
                }}
              />
              Billable to client
            </label>
          </Cell>
          <Cell name="Money" slug="money">
            <Money
              amount={-1104.3}
              currency="EUR"
              locale="en-IE"
              tone="auto"
              className="font-display text-2xl font-heading"
            />
            <Money amount={176_400} currency="JPY" locale="ja-JP" className="text-base text-fg" />
          </Cell>
          <Cell name="Amount input" slug="amount-input" className="max-lg:col-span-2">
            <Field className="w-full">
              <FieldLabel>Amount, EUR</FieldLabel>
              <AmountInput currency="EUR" locale="en-IE" value={amount} onValueChange={setAmount} />
            </Field>
          </Cell>
          <Cell name="Select" slug="select" className="max-lg:col-span-2">
            <Field className="w-full">
              <FieldLabel>Category</FieldLabel>
              <Select items={CATEGORIES} value={category} onValueChange={setCategory}>
                <SelectTrigger />
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </Cell>
          <Cell name="Date picker" slug="date-picker" className="max-lg:col-span-2">
            <Field className="w-full">
              <FieldLabel>Invoice date</FieldLabel>
              <LazyDatePicker value={date} onValueChange={setDate} />
            </Field>
          </Cell>
          <Cell name="Field" slug="field" className="max-lg:col-span-2">
            <Field className="w-full" invalid={vatInvalid}>
              <FieldLabel>VAT number</FieldLabel>
              <Input value={vat} onValueChange={setVat} spellCheck={false} autoComplete="off" />
              <FieldError>PL and ten digits.</FieldError>
            </Field>
          </Cell>
          <Cell name="Dialog" slug="dialog">
            <DialogSpecimen />
            <p className="w-full text-sm text-fg-muted">Opens a real dialog, focus held inside.</p>
          </Cell>
          <Cell name="Toast" slug="toast">
            <ToastSpecimen />
            <p className="w-full text-sm text-fg-muted">Raises a toast, announced politely.</p>
          </Cell>
          <Cell name="Data table" slug="data-table" className="col-span-2">
            <Table className="w-full">
              <TableHeader>
                <TableRow>
                  <TableHead>Merchant</TableHead>
                  <TableHead align="end">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ROWS.map((row) => (
                  <TableRow key={row.merchant}>
                    <TableCell>{row.merchant}</TableCell>
                    <TableCell align="end">
                      <Money amount={row.amount} currency="EUR" locale="en-IE" tone="auto" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Cell>
        </ul>
      </div>
    </ToastProvider>
  );
}
