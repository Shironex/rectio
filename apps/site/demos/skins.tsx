'use client';

import {
  Badge,
  Button,
  Field,
  FieldDescription,
  FieldLabel,
  Input,
  Money,
  ThemeScope,
} from '@rectio/ui';

import { useSiteMode } from '@/lib/use-site-mode';

const LOOKS = [
  { skin: undefined, label: 'Default' },
  { skin: 'dense', label: 'Dense' },
  { skin: 'editorial', label: 'Editorial' },
] as const;

/** The same card under each skin, in the site's mode: only tokens change between them. */
export default function SkinsDemo() {
  const mode = useSiteMode();
  return (
    <div className="grid w-full items-start gap-3 lg:grid-cols-3">
      {LOOKS.map(({ skin, label }) => (
        <ThemeScope
          key={label}
          mode={mode}
          skin={skin}
          className="flex flex-col gap-4 rounded-panel border border-line p-5"
        >
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-medium tracking-caps text-fg-subtle uppercase">
              {label}
            </span>
            <Badge tone="positive">Approved</Badge>
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="font-display text-2xl font-heading tracking-tight text-fg">
              March travel
            </h3>
            <p className="text-sm text-fg-muted">Six expenses, one waiting on a receipt.</p>
          </div>
          <Money
            amount={1269.2}
            currency="EUR"
            locale="en-IE"
            quietCurrency
            className="text-xl font-strong"
          />
          <Field>
            <FieldLabel>Note to finance</FieldLabel>
            <Input defaultValue="Client dinner in Dublin" />
            <FieldDescription>Shown on the approval request.</FieldDescription>
          </Field>
          <div className="flex gap-2 border-t border-line pt-4">
            <Button>Submit</Button>
            <Button variant="secondary">Save draft</Button>
          </div>
        </ThemeScope>
      ))}
    </div>
  );
}
