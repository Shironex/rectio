'use client';

import { FunnelIcon } from '@phosphor-icons/react';
import {
  Button,
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  Field,
  FieldLabel,
  Input,
  SegmentedControl,
  Switch,
} from '@rectio/ui';
import { useState } from 'react';

const STATUSES = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
] as const;

type Status = (typeof STATUSES)[number]['value'];

/** Expense filters: a side panel on a wide screen, a bottom sheet a thumb can reach on a phone. */
export default function DrawerDemo() {
  const [status, setStatus] = useState<Status>('pending');

  return (
    <Drawer>
      <DrawerTrigger render={<Button variant="secondary" />}>
        <FunnelIcon aria-hidden weight="bold" className="size-4" />
        Filter expenses
      </DrawerTrigger>
      <DrawerContent size="sm">
        <DrawerHeader>
          <DrawerTitle>Filter expenses</DrawerTitle>
          <DrawerDescription>Narrow the March report by status and owner.</DrawerDescription>
        </DrawerHeader>
        <DrawerBody>
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-fg">Status</span>
            <SegmentedControl
              label="Status"
              options={STATUSES}
              value={status}
              onValueChange={setStatus}
              size="sm"
            />
          </div>
          <Field>
            <FieldLabel>Owner</FieldLabel>
            <Input defaultValue="Rory Quinn" />
          </Field>
          <label className="flex items-center justify-between gap-4 text-sm text-fg">
            Only with receipts missing
            <Switch />
          </label>
        </DrawerBody>
        <DrawerFooter>
          <DrawerClose render={<Button variant="ghost" />}>Clear</DrawerClose>
          <DrawerClose render={<Button />}>Show 12 expenses</DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
