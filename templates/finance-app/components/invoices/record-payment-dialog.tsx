'use client';

import type { InvoicePayment } from '@rectio/blocks';
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
  Money,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@rectio/ui';
import { useState, type SubmitEvent } from 'react';

import { CURRENCY, LOCALE, TODAY } from '@/data/company';

const METHODS = [
  { value: 'Bank transfer, SEPA', label: 'Bank transfer, SEPA' },
  { value: 'Bank transfer', label: 'Bank transfer' },
  { value: 'Card, Stripe', label: 'Card, Stripe' },
  { value: 'Cheque', label: 'Cheque' },
];

/**
 * Records money received against an invoice. The amount starts at the balance due; a smaller
 * amount leaves the invoice part paid. `onRecord` gets the payment to save.
 */
export function RecordPaymentDialog({
  open,
  onOpenChange,
  number,
  balance,
  onRecord,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  number: string;
  balance: number;
  onRecord: (payment: Omit<InvoicePayment, 'id'>) => void;
}) {
  const [amount, setAmount] = useState<number | null>(balance);
  const [date, setDate] = useState<Date | null>(TODAY);
  const [method, setMethod] = useState<string | null>(METHODS[0]?.value ?? null);
  const [tried, setTried] = useState(false);

  const amountError =
    amount === null || amount <= 0
      ? 'Enter the amount received.'
      : amount > balance
        ? 'That is more than the balance due. Record the rest as a credit.'
        : null;
  const dateError = date === null ? 'Enter the date the money arrived.' : null;

  const submit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTried(true);
    if (amountError !== null || dateError !== null || amount === null || date === null) return;
    onRecord({ amount, date, method: method ?? 'Bank transfer' });
    onOpenChange(false);
    setTried(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (next) {
          setAmount(balance);
          setDate(TODAY);
          setTried(false);
        }
      }}
    >
      <DialogContent className="max-w-md">
        <form noValidate onSubmit={submit} className="flex min-h-0 flex-col">
          <DialogHeader>
            <DialogTitle>Record a payment</DialogTitle>
            <DialogDescription>
              Against <span className="numeric">{number}</span>, balance due{' '}
              <Money amount={balance} currency={CURRENCY} locale={LOCALE} />.
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <Field invalid={tried && amountError !== null}>
              <FieldLabel>Amount received</FieldLabel>
              <AmountInput
                currency={CURRENCY}
                locale={LOCALE}
                value={amount}
                onValueChange={setAmount}
              />
              <FieldDescription>
                Less than the balance leaves the invoice part paid.
              </FieldDescription>
              <FieldError>{tried ? amountError : null}</FieldError>
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field invalid={tried && dateError !== null}>
                <FieldLabel>Received on</FieldLabel>
                <DatePicker value={date} onValueChange={setDate} locale={LOCALE} />
                <FieldError>{tried ? dateError : null}</FieldError>
              </Field>
              <Field>
                <FieldLabel>Method</FieldLabel>
                <Select items={METHODS} value={method} onValueChange={setMethod}>
                  <SelectTrigger />
                  <SelectContent>
                    {METHODS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>
            <Button type="submit">Record payment</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
