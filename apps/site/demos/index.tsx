'use client';

import dynamic from 'next/dynamic';

/**
 * Every docs demo, each in its own chunk: a page loads the demos it renders and no others, so a
 * component page never ships the chart library of a block page. MDX names a demo by its file:
 * `<Demo name="cash-flow" />`. The demos still render into the static HTML.
 */
const DEMOS = {
  'amount-input': dynamic(() => import('./amount-input')),
  'amount-input.motion': dynamic(() => import('./amount-input.motion')),
  'ar-aging': dynamic(() => import('./ar-aging')),
  'ar-aging.motion': dynamic(() => import('./ar-aging.motion')),
  badge: dynamic(() => import('./badge')),
  'budget-vs-actual': dynamic(() => import('./budget-vs-actual')),
  'budget-vs-actual.motion': dynamic(() => import('./budget-vs-actual.motion')),
  button: dynamic(() => import('./button')),
  'button.motion': dynamic(() => import('./button.motion')),
  calendar: dynamic(() => import('./calendar')),
  'cash-flow': dynamic(() => import('./cash-flow')),
  'cash-flow.motion': dynamic(() => import('./cash-flow.motion')),
  checkbox: dynamic(() => import('./checkbox')),
  'data-table': dynamic(() => import('./data-table')),
  'data-table.motion': dynamic(() => import('./data-table.motion')),
  'date-picker': dynamic(() => import('./date-picker')),
  dialog: dynamic(() => import('./dialog')),
  'dialog.motion': dynamic(() => import('./dialog.motion')),
  'expense-approval': dynamic(() => import('./expense-approval')),
  'expense-approval.motion': dynamic(() => import('./expense-approval.motion')),
  field: dynamic(() => import('./field')),
  'invoice-detail': dynamic(() => import('./invoice-detail')),
  'invoice-detail.motion': dynamic(() => import('./invoice-detail.motion')),
  'invoice-list': dynamic(() => import('./invoice-list')),
  'invoice-list.motion': dynamic(() => import('./invoice-list.motion')),
  'kpi-row': dynamic(() => import('./kpi-row')),
  'kpi-row.motion': dynamic(() => import('./kpi-row.motion')),
  ledger: dynamic(() => import('./ledger')),
  'ledger.motion': dynamic(() => import('./ledger.motion')),
  money: dynamic(() => import('./money')),
  'money.motion': dynamic(() => import('./money.motion')),
  select: dynamic(() => import('./select')),
  'select.motion': dynamic(() => import('./select.motion')),
  'theme-scope': dynamic(() => import('./theme-scope')),
  toast: dynamic(() => import('./toast')),
  'toast.motion': dynamic(() => import('./toast.motion')),
};

export type DemoName = keyof typeof DEMOS;

export function Demo({ name }: { name: DemoName }) {
  const Component = DEMOS[name];
  return <Component />;
}
