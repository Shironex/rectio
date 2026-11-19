'use client';

import { FunnelSimpleIcon } from '@phosphor-icons/react';
import { PopoverContent } from '@rectio/motion/navigation';
import {
  Button,
  Field,
  FieldLabel,
  Input,
  Popover,
  PopoverClose,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
} from '@rectio/ui';
import { useState } from 'react';

export default function PopoverMotionDemo() {
  const [open, setOpen] = useState(false);
  const [supplier, setSupplier] = useState('Brennan Logistics');
  const [applied, setApplied] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-center gap-3">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger render={<Button variant="secondary" />}>
          <FunnelSimpleIcon aria-hidden weight="bold" className="size-4" />
          Filter payables
        </PopoverTrigger>
        <PopoverContent showClose align="start" className="w-72">
          <PopoverTitle>Filter payables</PopoverTitle>
          <PopoverDescription>Show the bills of one supplier.</PopoverDescription>
          <Field>
            <FieldLabel>Supplier</FieldLabel>
            <Input value={supplier} onValueChange={setSupplier} />
          </Field>
          <div className="flex justify-end gap-2 pt-1">
            <PopoverClose render={<Button variant="ghost" size="sm" />}>Cancel</PopoverClose>
            <Button
              size="sm"
              onClick={() => {
                setApplied(supplier);
                setOpen(false);
              }}
            >
              Apply
            </Button>
          </div>
        </PopoverContent>
      </Popover>
      <p className="text-sm text-fg-muted" aria-live="polite">
        {applied === null ? 'Showing every supplier.' : `Showing bills from ${applied}.`}
      </p>
    </div>
  );
}
