'use client';

import {
  AmountInput,
  Button,
  DatePicker,
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  FileDropzone,
  FileItem,
  FileList,
  FileUpload,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  Textarea,
  useFileUpload,
  useToast,
} from '@rectio/ui';
import { useState, type SubmitEvent } from 'react';

import { CURRENCY, LOCALE, TODAY } from '@/data/company';
import { EXPENSE_CATEGORIES, RECEIPT_LIMIT, type ExpenseCategory } from '@/data/expenses';

export interface ExpenseDraft {
  merchant: string;
  amount: number;
  date: Date;
  category: ExpenseCategory;
  note: string;
  hasReceipt: boolean;
}

const MB = 1024 * 1024;
const CATEGORY_ITEMS = EXPENSE_CATEGORIES.map((c) => ({ value: c, label: c }));

/**
 * Claims an expense: merchant, amount, date, category and the receipt. A receipt is required above
 * the policy limit. `onSubmit` gets the checked draft; upload the receipt where you store files.
 */
export function SubmitExpenseSheet({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (draft: ExpenseDraft) => void;
}) {
  const toast = useToast();
  const [merchant, setMerchant] = useState('');
  const [amount, setAmount] = useState<number | null>(null);
  const [date, setDate] = useState<Date | null>(TODAY);
  const [category, setCategory] = useState<ExpenseCategory | null>(null);
  const [note, setNote] = useState('');
  const [tried, setTried] = useState(false);
  const receipt = useFileUpload({ multiple: false });

  const hasReceipt = receipt.files.length > 0;
  const errors = {
    merchant: merchant.trim() === '' ? 'Enter where you paid.' : null,
    amount: amount === null || amount <= 0 ? 'Enter the amount you paid.' : null,
    date:
      date === null
        ? 'Enter the date on the receipt.'
        : date.getTime() > TODAY.getTime()
          ? 'The date cannot be in the future.'
          : null,
    category: category === null ? 'Choose a category.' : null,
    receipt:
      !hasReceipt && amount !== null && amount > RECEIPT_LIMIT
        ? `Attach the receipt: it is required above €${String(RECEIPT_LIMIT)}.`
        : null,
  };
  const show = (key: keyof typeof errors) => (tried ? errors[key] : null);

  const reset = () => {
    setMerchant('');
    setAmount(null);
    setDate(TODAY);
    setCategory(null);
    setNote('');
    setTried(false);
    receipt.clear();
  };

  const close = () => {
    onOpenChange(false);
    reset();
  };

  const submit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTried(true);
    if (Object.values(errors).some((e) => e !== null)) return;
    if (amount === null || date === null || category === null) return;
    onSubmit({ merchant: merchant.trim(), amount, date, category, note, hasReceipt });
    toast.add({
      type: 'success',
      title: 'Expense submitted',
      description: `${merchant.trim()} is waiting for approval.`,
    });
    close();
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (next) onOpenChange(true);
        else close();
      }}
    >
      <SheetContent>
        <form noValidate onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          <SheetHeader>
            <SheetTitle>Submit an expense</SheetTitle>
            <SheetDescription>
              It goes to your approver. Paid back with the next expense run.
            </SheetDescription>
          </SheetHeader>
          <SheetBody className="flex flex-col gap-4">
            <Field invalid={show('merchant') !== null}>
              <FieldLabel>Merchant</FieldLabel>
              <Input
                value={merchant}
                onChange={(event) => {
                  setMerchant(event.target.value);
                }}
                placeholder="Aer Lingus"
                autoComplete="off"
              />
              <FieldError>{show('merchant')}</FieldError>
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field invalid={show('amount') !== null}>
                <FieldLabel>Amount</FieldLabel>
                <AmountInput
                  currency={CURRENCY}
                  locale={LOCALE}
                  value={amount}
                  onValueChange={setAmount}
                />
                <FieldError>{show('amount')}</FieldError>
              </Field>
              <Field invalid={show('date') !== null}>
                <FieldLabel>Date</FieldLabel>
                <DatePicker value={date} onValueChange={setDate} locale={LOCALE} />
                <FieldError>{show('date')}</FieldError>
              </Field>
            </div>
            <Field invalid={show('category') !== null}>
              <FieldLabel>Category</FieldLabel>
              <Select
                items={CATEGORY_ITEMS}
                value={category}
                onValueChange={(value) => {
                  setCategory(value);
                }}
              >
                <SelectTrigger placeholder="Choose a category" />
                <SelectContent>
                  {EXPENSE_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError>{show('category')}</FieldError>
            </Field>
            <Field>
              <FieldLabel optional>Note for the approver</FieldLabel>
              <Textarea
                value={note}
                onChange={(event) => {
                  setNote(event.target.value);
                }}
                maxLength={200}
                showCount
                minRows={2}
                maxRows={5}
              />
            </Field>
            <Field invalid={show('receipt') !== null}>
              <FieldLabel optional={amount === null || amount <= RECEIPT_LIMIT}>Receipt</FieldLabel>
              <FileUpload {...receipt.rootProps} accept=".pdf,.png,.jpg,.jpeg" maxSize={10 * MB}>
                {!hasReceipt && <FileDropzone />}
                {hasReceipt && (
                  <FileList aria-label="Receipt">
                    {receipt.files.map((file) => (
                      <FileItem key={file.id} file={file} />
                    ))}
                  </FileList>
                )}
              </FileUpload>
              <FieldDescription>PDF, PNG or JPG, up to 10 MB.</FieldDescription>
              <FieldError>{show('receipt')}</FieldError>
            </Field>
          </SheetBody>
          <SheetFooter>
            <Button type="button" variant="ghost" onClick={close}>
              Cancel
            </Button>
            <Button type="submit">Submit expense</Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
