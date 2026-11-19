'use client';

import dynamic from 'next/dynamic';

/**
 * Every docs demo, each in its own chunk: a page loads the demos it renders and no others, so a
 * component page never ships the chart library of a block page. MDX names a demo by its file:
 * `<Demo name="cash-flow" />`. The demos still render into the static HTML.
 */
const DEMOS = {
  accordion: dynamic(() => import('./accordion')),
  alert: dynamic(() => import('./alert')),
  'alert.motion': dynamic(() => import('./alert.motion')),
  'amount-input': dynamic(() => import('./amount-input')),
  'amount-input.motion': dynamic(() => import('./amount-input.motion')),
  'ar-aging': dynamic(() => import('./ar-aging')),
  'ar-aging.motion': dynamic(() => import('./ar-aging.motion')),
  avatar: dynamic(() => import('./avatar')),
  'avatar-group': dynamic(() => import('./avatar-group')),
  badge: dynamic(() => import('./badge')),
  banner: dynamic(() => import('./banner')),
  'banner.motion': dynamic(() => import('./banner.motion')),
  'budget-vs-actual': dynamic(() => import('./budget-vs-actual')),
  'budget-vs-actual.motion': dynamic(() => import('./budget-vs-actual.motion')),
  button: dynamic(() => import('./button')),
  'button.motion': dynamic(() => import('./button.motion')),
  calendar: dynamic(() => import('./calendar')),
  card: dynamic(() => import('./card')),
  'cash-flow': dynamic(() => import('./cash-flow')),
  'cash-flow.motion': dynamic(() => import('./cash-flow.motion')),
  checkbox: dynamic(() => import('./checkbox')),
  collapsible: dynamic(() => import('./collapsible')),
  'data-table': dynamic(() => import('./data-table')),
  'data-table.motion': dynamic(() => import('./data-table.motion')),
  'date-picker': dynamic(() => import('./date-picker')),
  dialog: dynamic(() => import('./dialog')),
  'dialog.motion': dynamic(() => import('./dialog.motion')),
  'empty-state': dynamic(() => import('./empty-state')),
  'expense-approval': dynamic(() => import('./expense-approval')),
  'expense-approval.motion': dynamic(() => import('./expense-approval.motion')),
  field: dynamic(() => import('./field')),
  'invoice-detail': dynamic(() => import('./invoice-detail')),
  'invoice-detail.motion': dynamic(() => import('./invoice-detail.motion')),
  'invoice-list': dynamic(() => import('./invoice-list')),
  'invoice-list.motion': dynamic(() => import('./invoice-list.motion')),
  kbd: dynamic(() => import('./kbd')),
  'kpi-row': dynamic(() => import('./kpi-row')),
  'kpi-row.motion': dynamic(() => import('./kpi-row.motion')),
  ledger: dynamic(() => import('./ledger')),
  'ledger.motion': dynamic(() => import('./ledger.motion')),
  meter: dynamic(() => import('./meter')),
  'meter.motion': dynamic(() => import('./meter.motion')),
  money: dynamic(() => import('./money')),
  'money.motion': dynamic(() => import('./money.motion')),
  progress: dynamic(() => import('./progress')),
  'progress-circle': dynamic(() => import('./progress-circle')),
  'progress-circle.motion': dynamic(() => import('./progress-circle.motion')),
  'progress.motion': dynamic(() => import('./progress.motion')),
  'scroll-area': dynamic(() => import('./scroll-area')),
  select: dynamic(() => import('./select')),
  'select.motion': dynamic(() => import('./select.motion')),
  separator: dynamic(() => import('./separator')),
  skeleton: dynamic(() => import('./skeleton')),
  'skeleton.motion': dynamic(() => import('./skeleton.motion')),
  spinner: dynamic(() => import('./spinner')),
  'spinner.motion': dynamic(() => import('./spinner.motion')),
  stat: dynamic(() => import('./stat')),
  stepper: dynamic(() => import('./stepper')),
  'theme-scope': dynamic(() => import('./theme-scope')),
  timeline: dynamic(() => import('./timeline')),
  'timeline.motion': dynamic(() => import('./timeline.motion')),
  toast: dynamic(() => import('./toast')),
  'toast.motion': dynamic(() => import('./toast.motion')),
};

export type DemoName = keyof typeof DEMOS;

export function Demo({ name }: { name: DemoName }) {
  const Component = DEMOS[name];
  return <Component />;
}
