'use client';

import {
  Badge,
  Button,
  Money,
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@rectio/ui';

const LINES = [
  { id: 'a', label: 'Consulting, 14 hours', amount: 1_680 },
  { id: 'b', label: 'Travel to Gdansk', amount: 214.6 },
  { id: 'c', label: 'Software licence', amount: 480 },
] as const;

export default function SheetDemo() {
  return (
    <Sheet>
      <SheetTrigger render={<Button variant="secondary" />}>View invoice 2041</SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Invoice 2041</SheetTitle>
          <SheetDescription>Nordlicht GmbH, issued 12 March, due 11 April.</SheetDescription>
        </SheetHeader>
        <SheetBody>
          <Badge tone="info" className="w-fit">
            Sent
          </Badge>
          <ul className="flex flex-col divide-y divide-line text-sm">
            {LINES.map((line) => (
              <li key={line.id} className="flex items-center justify-between gap-4 py-2">
                <span className="text-fg">{line.label}</span>
                <Money amount={line.amount} currency="EUR" locale="en-IE" tone="neutral" />
              </li>
            ))}
          </ul>
        </SheetBody>
        <SheetFooter>
          <SheetClose render={<Button variant="ghost" />}>Close</SheetClose>
          <Button>Record payment</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
