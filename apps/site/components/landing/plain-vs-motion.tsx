'use client';

import { CheckIcon, MinusIcon, PlusIcon } from '@phosphor-icons/react';
import * as motion from '@rectio/motion';
import * as ui from '@rectio/ui';
import { useState } from 'react';

import { ProBadge } from '@/components/pro-badge';

const KITS = {
  plain: {
    Button: ui.Button,
    Money: ui.Money,
    SelectContent: ui.SelectContent,
    SelectItem: ui.SelectItem,
  },
  motion: {
    Button: motion.Button,
    Money: motion.Money,
    SelectContent: motion.SelectContent,
    SelectItem: motion.SelectItem,
  },
};

const PERIODS = [
  { value: 'march', label: 'March 2026' },
  { value: 'q1', label: 'Q1 2026' },
  { value: 'ytd', label: 'Year to date' },
];
const STEP = 120;

/** The same small approval panel, built from one kit or the other. */
function Panel({ kind }: { kind: keyof typeof KITS }) {
  const { Button, Money, SelectContent, SelectItem } = KITS[kind];
  const [amount, setAmount] = useState(2481.6);
  const [period, setPeriod] = useState<string | null>('march');
  const [approving, setApproving] = useState(false);
  const [approved, setApproved] = useState(false);
  const source = kind === 'plain' ? '@rectio/ui' : '@rectio/motion';

  return (
    <div className="flex flex-col overflow-hidden rounded-panel border border-line bg-surface">
      <div className="flex items-center justify-between gap-3 border-b border-line bg-surface-sunken px-5 py-3">
        <code className="truncate font-mono text-sm text-fg">
          {'import { Button, Money } from '}
          <span className="text-accent-strong">{`'${source}'`}</span>
        </code>
        {kind === 'motion' && <ProBadge />}
      </div>
      <div className="flex flex-col gap-6 p-5 sm:p-6">
        <ui.Field>
          <ui.FieldLabel>Period</ui.FieldLabel>
          <ui.Select items={PERIODS} value={period} onValueChange={setPeriod}>
            <ui.SelectTrigger />
            <SelectContent>
              {PERIODS.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </ui.Select>
        </ui.Field>
        <div className="flex items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-sm text-fg-muted">To approve</span>
            <Money amount={amount} currency="EUR" locale="en-IE" className="text-3xl font-strong" />
          </div>
          <div className="flex gap-1.5">
            <Button
              variant="secondary"
              iconOnly
              aria-label={`Subtract ${String(STEP)} euro`}
              onClick={() => {
                setAmount((a) => a - STEP);
              }}
            >
              <MinusIcon aria-hidden weight="bold" className="size-4" />
            </Button>
            <Button
              variant="secondary"
              iconOnly
              aria-label={`Add ${String(STEP)} euro`}
              onClick={() => {
                setAmount((a) => a + STEP);
              }}
            >
              <PlusIcon aria-hidden weight="bold" className="size-4" />
            </Button>
          </div>
        </div>
        <Button
          loading={approving}
          onClick={() => {
            setApproving(true);
            setApproved(false);
            setTimeout(() => {
              setApproving(false);
              setApproved(true);
            }, 1200);
          }}
        >
          <CheckIcon aria-hidden weight="bold" className="size-4" />
          {approved ? 'Approved' : 'Approve'}
        </Button>
      </div>
    </div>
  );
}

/** Plain and motioned side by side: the same props, a different import path. */
export function PlainVsMotion() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="site-reveal min-w-0">
        <Panel kind="plain" />
      </div>
      <div className="site-reveal site-step-1 min-w-0">
        <Panel kind="motion" />
      </div>
    </div>
  );
}
