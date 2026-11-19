'use client';

import { PlusIcon } from '@phosphor-icons/react';
import {
  AmountInput,
  Button,
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
  FieldLabel,
  Input,
  formatMoney,
} from '@rectio/ui';
import { useState, type SyntheticEvent } from 'react';

export default function DialogDemo() {
  const [open, setOpen] = useState(false);
  const [merchant, setMerchant] = useState('Deutsche Bahn');
  const [amount, setAmount] = useState<number | null>(89.9);
  const [saved, setSaved] = useState<string | null>(null);

  const save = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaved(`${merchant}, ${formatMoney(amount ?? 0, 'EUR', { locale: 'en-IE' })}`);
    setOpen(false);
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger render={<Button />}>
          <PlusIcon aria-hidden weight="bold" className="size-4" />
          Add expense
        </DialogTrigger>
        <DialogContent>
          <form onSubmit={save}>
            <DialogHeader>
              <DialogTitle>Add expense</DialogTitle>
              <DialogDescription>Goes into the March report as a draft line.</DialogDescription>
            </DialogHeader>
            <DialogBody>
              <Field>
                <FieldLabel>Merchant</FieldLabel>
                <Input value={merchant} onValueChange={setMerchant} />
              </Field>
              <Field>
                <FieldLabel>Amount, EUR</FieldLabel>
                <AmountInput
                  currency="EUR"
                  locale="en-IE"
                  value={amount}
                  onValueChange={setAmount}
                />
              </Field>
            </DialogBody>
            <DialogFooter>
              <DialogClose render={<Button variant="ghost" />}>Cancel</DialogClose>
              <Button type="submit">Save expense</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <p className="text-sm text-fg-muted" aria-live="polite">
        {saved === null ? 'No line added yet.' : `Added: ${saved}`}
      </p>
    </div>
  );
}
