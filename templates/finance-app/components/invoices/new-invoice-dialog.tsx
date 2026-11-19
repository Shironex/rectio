'use client';

import {
  AmountInput,
  Button,
  DatePicker,
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  Input,
  Money,
  NumberField,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  useToast,
} from '@rectio/ui';
import { useState, type SubmitEvent } from 'react';

import { CURRENCY, LOCALE, TODAY, addDays, formatLongDate } from '@/data/company';
import { CUSTOMERS } from '@/data/customers';
import { INVOICE_RECORDS } from '@/data/invoice-records';

export interface InvoiceDraft {
  customerId: string;
  issued: Date;
  terms: number;
  description: string;
  /** Net amount of the first line, major units. */
  net: number;
}

const nextNumber = () => {
  const last = Math.max(...INVOICE_RECORDS.map((r) => Number(r.document.number.slice(-4))));
  return `INV-2026-${String(last + 1).padStart(4, '0')}`;
};

const CUSTOMER_ITEMS = CUSTOMERS.map((c) => ({ value: c.id, label: c.name }));

/**
 * Starts a draft invoice: who it is for, when it is dated, the terms and a first line. Wire
 * `saveDraft` to your API; the dialog checks the fields and shows the totals before it saves.
 */
export function NewInvoiceDialog({
  open,
  onOpenChange,
  saveDraft,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  saveDraft?: (draft: InvoiceDraft) => void;
}) {
  const toast = useToast();
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [issued, setIssued] = useState<Date | null>(TODAY);
  const [terms, setTerms] = useState<number | null>(30);
  const [description, setDescription] = useState('');
  const [net, setNet] = useState<number | null>(null);
  const [tried, setTried] = useState(false);

  const customer = CUSTOMERS.find((c) => c.id === customerId);
  const errors = {
    customer: customer === undefined ? 'Choose who the invoice is for.' : null,
    issued: issued === null ? 'Enter the invoice date.' : null,
    description: description.trim() === '' ? 'Describe what you are billing for.' : null,
    net: net === null || net <= 0 ? 'Enter an amount above zero.' : null,
  };
  const show = (key: keyof typeof errors) => (tried ? errors[key] : null);
  const vat =
    customer === undefined || net === null ? 0 : Math.round(net * customer.vatRate * 100) / 100;

  const reset = () => {
    setCustomerId(null);
    setIssued(TODAY);
    setTerms(30);
    setDescription('');
    setNet(null);
    setTried(false);
  };

  const submit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTried(true);
    if (Object.values(errors).some((e) => e !== null) || customer === undefined) return;
    if (issued === null || net === null) return;
    saveDraft?.({ customerId: customer.id, issued, terms: terms ?? 30, description, net });
    toast.add({
      type: 'success',
      title: `Draft ${nextNumber()} saved`,
      description: `For ${customer.name}. Send it from the invoice when it is ready.`,
    });
    onOpenChange(false);
    reset();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) reset();
      }}
    >
      <DialogContent className="max-w-lg">
        <form noValidate onSubmit={submit} className="flex min-h-0 flex-col">
          <DialogHeader>
            <DialogTitle>New invoice</DialogTitle>
            <DialogDescription>
              Saved as a draft numbered <span className="numeric">{nextNumber()}</span>. Add more
              lines before you send it.
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <Field invalid={show('customer') !== null}>
              <FieldLabel>Customer</FieldLabel>
              <Select
                items={CUSTOMER_ITEMS}
                value={customerId}
                onValueChange={(value) => {
                  setCustomerId(value);
                  const picked = CUSTOMERS.find((c) => c.id === value);
                  if (picked !== undefined) setTerms(picked.terms);
                }}
              >
                <SelectTrigger placeholder="Choose a customer" />
                <SelectContent>
                  {CUSTOMERS.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {customer !== undefined && (
                <FieldDescription>
                  {customer.vatRate > 0
                    ? `Irish VAT at ${String(customer.vatRate * 100)}%.`
                    : 'Reverse charge: no VAT on the invoice.'}
                </FieldDescription>
              )}
              <FieldError>{show('customer')}</FieldError>
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field invalid={show('issued') !== null}>
                <FieldLabel>Invoice date</FieldLabel>
                <DatePicker value={issued} onValueChange={setIssued} locale={LOCALE} />
                <FieldError>{show('issued')}</FieldError>
              </Field>
              <Field>
                <FieldLabel>Payment terms</FieldLabel>
                <NumberField
                  value={terms}
                  onValueChange={setTerms}
                  min={0}
                  max={120}
                  step={15}
                  locale={LOCALE}
                  format={{ style: 'unit', unit: 'day', unitDisplay: 'long' }}
                />
                {issued !== null && (
                  <FieldDescription>
                    Due {formatLongDate(addDays(issued, terms ?? 0))}
                  </FieldDescription>
                )}
              </Field>
            </div>
            <Field invalid={show('description') !== null}>
              <FieldLabel>First line</FieldLabel>
              <Input
                value={description}
                onChange={(event) => {
                  setDescription(event.target.value);
                }}
                placeholder="Route optimisation module, 25 seats"
              />
              <FieldError>{show('description')}</FieldError>
            </Field>
            <Field invalid={show('net') !== null}>
              <FieldLabel>Net amount</FieldLabel>
              <AmountInput currency={CURRENCY} locale={LOCALE} value={net} onValueChange={setNet} />
              <FieldError>{show('net')}</FieldError>
            </Field>
            <dl className="flex flex-col gap-1 rounded-control bg-surface-sunken px-4 py-3 text-sm">
              <div className="flex justify-between gap-6">
                <dt className="text-fg-muted">VAT</dt>
                <dd>
                  <Money amount={vat} currency={CURRENCY} locale={LOCALE} />
                </dd>
              </div>
              <div className="flex justify-between gap-6 font-medium">
                <dt>Total</dt>
                <dd>
                  <Money amount={(net ?? 0) + vat} currency={CURRENCY} locale={LOCALE} />
                </dd>
              </div>
            </dl>
          </DialogBody>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                onOpenChange(false);
                reset();
              }}
            >
              Cancel
            </Button>
            <Button type="submit">Save draft</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
