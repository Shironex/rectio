import * as plain from '@rectio/blocks';
import * as moving from '@rectio/blocks/motion';
import { ThemeScope } from '@rectio/ui';
import { useReducer, type ReactNode } from 'react';

import { usePageCanvas } from '../page-canvas';
import type { Mode, ThemeId } from '../themes';
import * as data from './data';

/** The playground shows each block plain and motioned; an app picks one by import path. */
type Blocks = Pick<
  typeof plain,
  | 'InvoiceList'
  | 'InvoiceDetail'
  | 'Ledger'
  | 'CashFlowChart'
  | 'KpiRow'
  | 'ExpenseApproval'
  | 'ArAging'
  | 'BudgetVsActual'
>;

export const BLOCK_NAMES = [
  'kpi-row',
  'cash-flow',
  'invoice-list',
  'invoice-detail',
  'ledger',
  'expense-approval',
  'ar-aging',
  'budget-vs-actual',
] as const;
export type BlockName = (typeof BLOCK_NAMES)[number];

function readParams(search: string) {
  const params = new URLSearchParams(search);
  const locale = data.LOCALES[params.get('locale') === 'pl-PL' ? 'pl-PL' : 'en-GB'];
  const block = BLOCK_NAMES.find((name) => name === params.get('block'));
  const compact = params.get('density') === 'compact';
  const empty = params.get('empty') === '1';
  return { locale, block, compact, empty };
}

function renderBlock(
  name: BlockName,
  blocks: Blocks,
  locale: data.Locale,
  empty = false,
): ReactNode {
  if (empty) return renderEmpty(name, blocks, locale);
  const common = { currency: locale.currency, locale: locale.locale };
  switch (name) {
    case 'invoice-list':
      return (
        <blocks.InvoiceList
          {...common}
          invoices={data.invoices(locale.rate)}
          today={data.TODAY}
          onOpenInvoice={() => undefined}
          onCreateInvoice={() => undefined}
        />
      );
    case 'invoice-detail':
      return (
        <blocks.InvoiceDetail
          {...common}
          invoice={data.invoiceDocument(locale.rate)}
          today={data.TODAY}
          onRecordPayment={() => undefined}
          onDownload={() => undefined}
        />
      );
    case 'ledger':
      return (
        <blocks.Ledger
          {...common}
          accounts={data.ACCOUNTS}
          lines={data.journal(locale.rate)}
          openingBalances={data.openingBalances(locale.rate)}
          period="March 2026"
        />
      );
    case 'cash-flow':
      return <blocks.CashFlowChart {...common} points={data.cashFlow(locale.rate)} />;
    case 'kpi-row':
      return (
        <blocks.KpiRow
          {...common}
          kpis={data.kpis(locale.rate)}
          comparison="vs February"
          label="Key figures, March 2026"
        />
      );
    case 'expense-approval':
      return <Approvals blocks={blocks} locale={locale} />;
    case 'ar-aging':
      return (
        <blocks.ArAging
          {...common}
          receivables={data.receivables(locale.rate)}
          today={data.TODAY}
        />
      );
    case 'budget-vs-actual':
      return (
        <blocks.BudgetVsActual
          {...common}
          lines={data.budget(locale.rate)}
          period="Q1 2026, 11 of 13 weeks"
        />
      );
  }
}

/** Each block with nothing to show, as a new company's first day would have it. */
function renderEmpty(name: BlockName, blocks: Blocks, locale: data.Locale): ReactNode {
  const common = { currency: locale.currency, locale: locale.locale };
  switch (name) {
    case 'invoice-list':
      return (
        <blocks.InvoiceList
          {...common}
          invoices={[]}
          today={data.TODAY}
          onCreateInvoice={() => undefined}
        />
      );
    case 'ledger':
      return <blocks.Ledger {...common} accounts={data.ACCOUNTS} lines={[]} period="March 2026" />;
    case 'cash-flow':
      return <blocks.CashFlowChart {...common} points={[]} />;
    case 'expense-approval':
      return (
        <blocks.ExpenseApproval
          {...common}
          requests={[]}
          events={[]}
          onApprove={() => undefined}
          onReject={() => undefined}
        />
      );
    case 'ar-aging':
      return <blocks.ArAging {...common} receivables={[]} today={data.TODAY} />;
    case 'budget-vs-actual':
      return <blocks.BudgetVsActual {...common} lines={[]} period="Q1 2026" />;
    case 'kpi-row':
    case 'invoice-detail':
      return renderBlock(name, blocks, locale);
  }
}

/** The approval block holds no decisions itself: the app keeps them, here with the exported reducer. */
function Approvals({ blocks, locale }: { blocks: Blocks; locale: data.Locale }) {
  const [state, dispatch] = useReducer(plain.approvalReducer, locale.rate, data.expenses);
  const actor = 'Niamh Walsh';
  return (
    <blocks.ExpenseApproval
      currency={locale.currency}
      locale={locale.locale}
      requests={state.requests}
      events={state.events}
      onApprove={(ids) => {
        dispatch({ type: 'approve', ids, actor, at: new Date() });
      }}
      onReject={(ids, reason) => {
        dispatch({ type: 'reject', ids, actor, at: new Date(), reason });
      }}
      onReopen={(id) => {
        dispatch({ type: 'reopen', id, actor, at: new Date() });
      }}
    />
  );
}

export function BlocksPage({
  theme,
  mode,
  motion,
}: {
  theme: ThemeId;
  mode: Mode;
  motion: boolean;
}) {
  const { locale, block, compact, empty } = readParams(window.location.search);
  const blocks: Blocks = motion ? moving : plain;
  const canvas = usePageCanvas(theme, mode);
  return (
    <ThemeScope
      ref={canvas}
      theme={theme}
      mode={mode}
      density={compact ? 'compact' : 'comfortable'}
      className="min-h-dvh bg-surface-canvas"
    >
      {block !== undefined ? (
        <main className="mx-auto max-w-5xl px-4 py-8 sm:px-8">
          {renderBlock(block, blocks, locale, empty)}
        </main>
      ) : (
        <Dashboard blocks={blocks} locale={locale} />
      )}
    </ThemeScope>
  );
}

function Dashboard({ blocks, locale }: { blocks: Blocks; locale: data.Locale }) {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-8">
      <header className="flex flex-col gap-1">
        <p className="text-sm text-fg-muted">Fernhill Systems Ltd</p>
        <h1 className="font-display text-3xl font-heading tracking-tight">Finance, March 2026</h1>
      </header>
      {renderBlock('kpi-row', blocks, locale)}
      {renderBlock('cash-flow', blocks, locale)}
      <div className="grid items-start gap-6 xl:grid-cols-2">
        {renderBlock('expense-approval', blocks, locale)}
        {renderBlock('ar-aging', blocks, locale)}
      </div>
      {renderBlock('invoice-list', blocks, locale)}
      {renderBlock('budget-vs-actual', blocks, locale)}
      <div className="grid items-start gap-6 xl:grid-cols-2">
        {renderBlock('ledger', blocks, locale)}
        {renderBlock('invoice-detail', blocks, locale)}
      </div>
    </div>
  );
}
