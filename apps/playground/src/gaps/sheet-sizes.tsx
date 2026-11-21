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
  type SheetSize,
} from '@rectio/ui';

const SIZES: readonly { size: SheetSize; label: string }[] = [
  { size: 'sm', label: 'Small' },
  { size: 'md', label: 'Medium' },
  { size: 'lg', label: 'Large' },
  { size: 'full', label: 'Full screen' },
];

const LINES = [
  ['Professional plan, 12 seats', 540],
  ['Extra storage, 200 GB', 120],
  ['FigJam add-on', 100],
] as const;

/** A trigger per size; `open` opens that size on load, for a screenshot. */
export function SheetSizes({ open }: { open: SheetSize | null }) {
  return (
    <div className="flex flex-wrap gap-2">
      {SIZES.map(({ size, label }) => (
        <Sheet key={size} side="right" defaultOpen={open === size}>
          <SheetTrigger render={<Button variant="secondary" />}>{label}</SheetTrigger>
          <SheetContent size={size}>
            <SheetHeader>
              <SheetTitle>Invoice INV-0144</SheetTitle>
              <SheetDescription>Figma, due 4 March 2026</SheetDescription>
            </SheetHeader>
            <SheetBody>
              <div className="flex items-center justify-between gap-4">
                <Badge tone="negative">Overdue 15 days</Badge>
                <Money
                  amount={760}
                  currency="EUR"
                  locale="en-GB"
                  className="text-2xl font-strong"
                />
              </div>
              <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
                <dt className="text-fg-muted">Issued</dt>
                <dd>2 February 2026</dd>
                <dt className="text-fg-muted">Terms</dt>
                <dd>30 days</dd>
                <dt className="text-fg-muted">Billing contact</dt>
                <dd>accounts@figma.example</dd>
              </dl>
              <ul className="flex flex-col border-t border-line text-sm">
                {LINES.map(([item, amount]) => (
                  <li
                    key={item}
                    className="flex items-center justify-between gap-4 border-b border-line py-2.5"
                  >
                    <span>{item}</span>
                    <Money amount={amount} currency="EUR" locale="en-GB" />
                  </li>
                ))}
              </ul>
            </SheetBody>
            <SheetFooter>
              <SheetClose render={<Button variant="secondary" />}>Close</SheetClose>
              <Button>Send reminder</Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      ))}
    </div>
  );
}
