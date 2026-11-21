import {
  Button,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  type SheetSize,
} from '@rectio/ui';

const SIZES: readonly SheetSize[] = ['sm', 'md', 'lg', 'full'];

/** A trigger per size; `open` opens that size on load, for a screenshot. */
export function SheetSizes({ open }: { open: SheetSize | null }) {
  return (
    <div className="flex flex-wrap gap-2">
      {SIZES.map((size) => (
        <Sheet key={size} side="right" defaultOpen={open === size}>
          <SheetTrigger render={<Button variant="secondary" />}>Open {size}</SheetTrigger>
          <SheetContent size={size}>
            <SheetHeader>
              <SheetTitle>Invoice INV-0144</SheetTitle>
              <SheetDescription>
                Figma, due 4 March. The {size} sheet, from the sheet width tokens.
              </SheetDescription>
            </SheetHeader>
          </SheetContent>
        </Sheet>
      ))}
    </div>
  );
}
