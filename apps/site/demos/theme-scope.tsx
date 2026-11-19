'use client';

import { Badge, Button, Money, ThemeScope } from '@rectio/ui';

const SCOPES = [
  { theme: 'default', mode: 'light' },
  { theme: 'ledger', mode: 'light' },
  { theme: 'default', mode: 'dark' },
  { theme: 'ledger', mode: 'dark' },
] as const;

export default function ThemeScopeDemo() {
  return (
    <div className="grid w-full gap-3 sm:grid-cols-2">
      {SCOPES.map(({ theme, mode }) => (
        <ThemeScope
          key={`${theme}-${mode}`}
          theme={theme}
          mode={mode}
          className="flex flex-col gap-4 rounded-panel border border-line p-5"
        >
          <div className="flex items-center justify-between gap-3">
            <span className="font-mono text-xs text-fg-subtle">
              {theme}, {mode}
            </span>
            <Badge tone="positive">Approved</Badge>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-sm text-fg-muted">Total claimed, 6 expenses</span>
            <Money
              amount={1269.2}
              currency="EUR"
              locale="en-IE"
              quietCurrency
              className="font-display text-3xl font-heading"
            />
          </div>
          <div className="flex gap-2">
            <Button size="sm">Pay out</Button>
            <Button size="sm" variant="secondary">
              Export
            </Button>
          </div>
        </ThemeScope>
      ))}
    </div>
  );
}
