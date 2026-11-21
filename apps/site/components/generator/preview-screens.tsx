'use client';

import { CheckIcon, PlusIcon, WarningIcon } from '@phosphor-icons/react';
import { CashFlowChart, InvoiceList, KpiRow } from '@rectio/blocks';
import {
  Alert,
  AmountInput,
  Badge,
  Button,
  Checkbox,
  DataTable,
  DataTableBody,
  DataTableFooter,
  DataTableHeader,
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  Input,
  Money,
  Radio,
  RadioGroup,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  Switch,
  Textarea,
  useDataTable,
} from '@rectio/ui';
import { memo, useState } from 'react';

import { EXPENSES, columns } from '@/demos/data-table';
import { CASH_FLOW, INVOICES, KPIS, TODAY } from '@/demos/finance-data';

/** A screen's title row: what an app built on the theme would put at the top of the page. */
function ScreenHeader({
  title,
  meta,
  actions,
}: {
  title: string;
  meta: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="flex flex-col gap-0.5">
        <p className="text-sm text-fg-muted">{meta}</p>
        <h3 className="font-display text-2xl font-heading tracking-tight text-fg">{title}</h3>
      </div>
      {actions !== undefined && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}

function ExpenseTable() {
  const table = useDataTable({
    data: EXPENSES,
    columns,
    getRowId: (expense) => expense.id,
    initialState: { sorting: [{ id: 'date', desc: false }], rowSelection: { e3: true } },
  });
  return (
    <DataTable caption="Expenses in report 2041" hideCaption>
      <DataTableHeader table={table} />
      <DataTableBody table={table} />
      <DataTableFooter table={table} />
    </DataTable>
  );
}

export const DashboardScreen = memo(function DashboardScreen() {
  return (
    <div className="flex flex-col gap-5 p-4 sm:p-6">
      <ScreenHeader
        meta="Acme Books, March 2026"
        title="Overview"
        actions={
          <>
            <Button variant="secondary" size="sm">
              Export
            </Button>
            <Button size="sm">
              <PlusIcon aria-hidden weight="bold" className="size-3.5" />
              New invoice
            </Button>
          </>
        }
      />
      <KpiRow kpis={KPIS} currency="EUR" locale="en-GB" comparison="vs February" />
      <CashFlowChart points={CASH_FLOW} currency="EUR" locale="en-GB" />
      <ExpenseTable />
    </div>
  );
});

const CATEGORIES = [
  { value: 'rail', label: 'Rail' },
  { value: 'hotels', label: 'Hotels' },
  { value: 'meals', label: 'Client meals' },
  { value: 'software', label: 'Software' },
];

export const FormsScreen = memo(function FormsScreen() {
  const [amount, setAmount] = useState<number | null>(89.9);
  const [category, setCategory] = useState<string | null>('rail');
  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <ScreenHeader meta="Report 2041" title="Add an expense" />
      <form
        className="grid gap-5 sm:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
        }}
      >
        <Field>
          <FieldLabel>Merchant</FieldLabel>
          <Input defaultValue="Deutsche Bahn" />
        </Field>
        <Field>
          <FieldLabel>Amount, EUR</FieldLabel>
          <AmountInput currency="EUR" locale="en-IE" value={amount} onValueChange={setAmount} />
        </Field>
        <Field>
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
          <FieldDescription>Posts to ledger account 6120.</FieldDescription>
        </Field>
        <Field invalid>
          <FieldLabel>Supplier IBAN</FieldLabel>
          <Input defaultValue="DE89 3704 0044 0532 0130" />
          <FieldError>The IBAN is two digits short.</FieldError>
        </Field>
        <Field className="sm:col-span-2">
          <FieldLabel>Note for the approver</FieldLabel>
          <Textarea defaultValue="Return trip to the Hamburg client workshop." minRows={2} />
        </Field>
        <Field>
          <RadioGroup legend="Paid with" defaultValue="card" className="flex-row flex-wrap gap-x-6">
            <Radio value="card">Company card</Radio>
            <Radio value="own">Own money</Radio>
          </RadioGroup>
        </Field>
        <div className="flex flex-col gap-3">
          <label className="flex items-center gap-2.5 text-base text-fg">
            <Checkbox defaultChecked />
            Billable to the client
          </label>
          <label className="flex items-center gap-2.5 text-base text-fg">
            <Switch />
            Split across two cost centres
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:col-span-2">
          <Badge>Draft</Badge>
          <Badge tone="info">Sent</Badge>
          <Badge tone="warning">Due in 3 days</Badge>
          <Badge tone="positive">
            <CheckIcon aria-hidden weight="bold" />
            Paid
          </Badge>
          <Badge tone="negative">
            <WarningIcon aria-hidden weight="bold" />
            Overdue
          </Badge>
        </div>
        <Alert tone="warning" title="Over the rail policy" className="sm:col-span-2">
          First class needs a second approval above{' '}
          <Money amount={80} currency="EUR" locale="en-IE" />.
        </Alert>
        <div className="flex flex-wrap justify-end gap-2 border-t border-line pt-4 sm:col-span-2">
          <Button variant="ghost">Cancel</Button>
          <Button variant="danger">Discard</Button>
          <Button variant="secondary">Save draft</Button>
          <Button type="submit">Submit for approval</Button>
        </div>
      </form>
    </div>
  );
});

export const FinanceScreen = memo(function FinanceScreen() {
  return (
    <div className="flex flex-col gap-5 p-4 sm:p-6">
      <ScreenHeader
        meta="Receivables"
        title="Invoices"
        actions={
          <Button size="sm">
            <PlusIcon aria-hidden weight="bold" className="size-3.5" />
            New invoice
          </Button>
        }
      />
      <dl className="grid grid-cols-2 gap-4 border-b border-line pb-5 sm:grid-cols-3">
        <div className="flex flex-col gap-1">
          <dt className="text-sm text-fg-muted">Outstanding</dt>
          <dd className="font-display text-2xl font-heading text-fg">
            <Money amount={41860} currency="EUR" locale="en-GB" />
          </dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="text-sm text-fg-muted">Overdue</dt>
          <dd className="font-display text-2xl font-heading text-negative-strong">
            <Money amount={6420.5} currency="EUR" locale="en-GB" />
          </dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="text-sm text-fg-muted">Credit notes</dt>
          <dd className="font-display text-2xl font-heading text-fg">
            <Money amount={-1250} currency="EUR" locale="en-GB" tone="auto" />
          </dd>
        </div>
      </dl>
      <InvoiceList
        invoices={INVOICES}
        currency="EUR"
        locale="en-GB"
        today={TODAY}
        defaultPeriod="all"
        onOpenInvoice={() => undefined}
      />
    </div>
  );
});
