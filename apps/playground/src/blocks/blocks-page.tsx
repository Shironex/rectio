import * as plain from '@rectio/blocks';
import * as moving from '@rectio/blocks/motion';
import { Button, ThemeScope } from '@rectio/ui';
import { useReducer, type ReactNode } from 'react';

import { usePageCanvas } from '../page-canvas';
import type { Mode, ThemeId } from '../themes';
import * as data from './data';
import { arAgingPl } from './pl/ar-aging';
import { budgetVsActualPl } from './pl/budget-vs-actual';
import { cashFlowPl } from './pl/cash-flow';
import { expenseApprovalPl } from './pl/expense-approval';
import { invoiceDetailPl } from './pl/invoice-detail';
import { invoiceListPl } from './pl/invoice-list';
import { kpiRowPl } from './pl/kpi-row';
import { ledgerPl } from './pl/ledger';
import { REPORTING_BLOCKS, isReportingBlock, renderReporting } from './reporting';
import { OPERATIONS_BLOCKS, isOperationsBlock, renderOperations } from './operations';

/** The one action each block offers in its empty state, in the shown language. */
function emptyAction(name: BlockName, locale: data.Locale): ReactNode {
  const pl = locale.id === 'pl-PL';
  const label = {
    'invoice-list': pl ? 'Utwórz fakturę' : 'Create invoice',
    ledger: pl ? 'Dodaj zapis' : 'Add an entry',
    'cash-flow': pl ? 'Importuj wyciąg bankowy' : 'Import bank feed',
    'budget-vs-actual': pl ? 'Ustaw budżet' : 'Set a budget',
    'ar-aging': pl ? 'Utwórz fakturę' : 'Create invoice',
    'expense-approval': pl ? 'Zobacz przesłane wydatki' : 'View submitted expenses',
    'kpi-row': undefined,
    'invoice-detail': undefined,
    // The reporting blocks carry their own empty actions, in reporting.tsx.
    'profit-and-loss': undefined,
    'tax-summary': undefined,
    'cash-runway': undefined,
    'bank-reconciliation': undefined,
    payouts: undefined,
    'vendors-list': undefined,
  }[name];
  if (label === undefined) return undefined;
  return <Button variant={name === 'expense-approval' ? 'secondary' : 'primary'}>{label}</Button>;
}

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
  | 'ProfitAndLoss'
  | 'TaxSummary'
  | 'CashRunway'
  | 'BankReconciliation'
  | 'Payouts'
  | 'VendorsList'
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
  ...REPORTING_BLOCKS,
  ...OPERATIONS_BLOCKS,
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
  if (isReportingBlock(name)) return renderReporting(name, blocks, locale, empty);
  if (isOperationsBlock(name)) return renderOperations(name, blocks, locale, empty);
  if (empty) return renderEmpty(name, blocks, locale);
  const common = { currency: locale.currency, locale: locale.locale };
  const pl = locale.id === 'pl-PL';
  const text = data.copy(locale);
  switch (name) {
    case 'invoice-list':
      return (
        <blocks.InvoiceList
          {...common}
          {...(pl ? { messages: invoiceListPl } : {})}
          invoices={data.invoices(locale.rate)}
          defaultPeriod="all"
          today={data.TODAY}
          onOpenInvoice={() => undefined}
          onCreateInvoice={() => undefined}
        />
      );
    case 'invoice-detail':
      return (
        <blocks.InvoiceDetail
          {...common}
          {...(pl ? { messages: invoiceDetailPl } : {})}
          invoice={data.invoiceDocument(locale.rate, pl)}
          today={data.TODAY}
          onRecordPayment={() => undefined}
          onDownload={() => undefined}
        />
      );
    case 'ledger':
      return (
        <blocks.Ledger
          {...common}
          {...(pl ? { messages: ledgerPl } : {})}
          accounts={data.accounts(pl)}
          lines={data.journal(locale.rate, pl)}
          openingBalances={data.openingBalances(locale.rate)}
          period={text.month}
        />
      );
    case 'cash-flow':
      return (
        <blocks.CashFlowChart
          {...common}
          {...(pl ? { messages: cashFlowPl } : {})}
          points={data.cashFlow(locale.rate)}
        />
      );
    case 'kpi-row':
      return (
        <blocks.KpiRow
          {...common}
          {...(pl ? { messages: kpiRowPl } : {})}
          kpis={data.kpis(locale.rate, pl)}
          comparison={text.comparison}
          label={text.kpiLabel}
        />
      );
    case 'expense-approval':
      return <Approvals blocks={blocks} locale={locale} />;
    case 'ar-aging':
      return (
        <blocks.ArAging
          {...common}
          {...(pl ? { messages: arAgingPl } : {})}
          receivables={data.receivables(locale.rate)}
          today={data.TODAY}
        />
      );
    case 'budget-vs-actual':
      return (
        <blocks.BudgetVsActual
          {...common}
          {...(pl ? { messages: budgetVsActualPl } : {})}
          lines={data.budget(locale.rate, pl)}
          period={text.quarterProgress}
        />
      );
  }
}

/** Each block with nothing to show, as a new company's first day would have it. */
function renderEmpty(name: BlockName, blocks: Blocks, locale: data.Locale): ReactNode {
  const common = { currency: locale.currency, locale: locale.locale };
  const pl = locale.id === 'pl-PL';
  const text = data.copy(locale);
  const emptyActionNode = emptyAction(name, locale);
  switch (name) {
    case 'invoice-list':
      return (
        <blocks.InvoiceList
          {...common}
          {...(pl ? { messages: invoiceListPl } : {})}
          invoices={[]}
          today={data.TODAY}
          emptyAction={emptyActionNode}
        />
      );
    case 'ledger':
      return (
        <blocks.Ledger
          {...common}
          {...(pl ? { messages: ledgerPl } : {})}
          accounts={data.accounts(pl)}
          lines={[]}
          period={text.month}
          emptyAction={emptyActionNode}
        />
      );
    case 'cash-flow':
      return (
        <blocks.CashFlowChart
          {...common}
          {...(pl ? { messages: cashFlowPl } : {})}
          points={[]}
          emptyAction={emptyActionNode}
        />
      );
    case 'expense-approval':
      return (
        <blocks.ExpenseApproval
          {...common}
          {...(pl ? { messages: expenseApprovalPl } : {})}
          requests={[]}
          events={[]}
          onApprove={() => undefined}
          onReject={() => undefined}
          emptyAction={emptyActionNode}
        />
      );
    case 'ar-aging':
      return (
        <blocks.ArAging
          {...common}
          {...(pl ? { messages: arAgingPl } : {})}
          receivables={[]}
          today={data.TODAY}
          emptyAction={emptyActionNode}
        />
      );
    case 'budget-vs-actual':
      return (
        <blocks.BudgetVsActual
          {...common}
          {...(pl ? { messages: budgetVsActualPl } : {})}
          lines={[]}
          period={text.quarter}
          emptyAction={emptyActionNode}
        />
      );
    case 'kpi-row':
    case 'invoice-detail':
      return renderBlock(name, blocks, locale);
  }
}

/** The approval block holds no decisions itself: the app keeps them, here with the exported reducer. */
function Approvals({ blocks, locale }: { blocks: Blocks; locale: data.Locale }) {
  const pl = locale.id === 'pl-PL';
  const [state, dispatch] = useReducer(plain.approvalReducer, locale.rate, (rate: number) =>
    data.expenses(rate, pl),
  );
  const actor = 'Niamh Walsh';
  return (
    <blocks.ExpenseApproval
      currency={locale.currency}
      locale={locale.locale}
      {...(pl ? { messages: expenseApprovalPl } : {})}
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
  const pl = locale.id === 'pl-PL';
  const block = (name: BlockName) => renderBlock(name, blocks, locale);
  const pair = (a: BlockName, b: BlockName) => (
    <div className="grid items-start gap-6 xl:grid-cols-2">
      {block(a)}
      {block(b)}
    </div>
  );
  const sections: { id: string; label: string; body: ReactNode }[] = [
    {
      id: 'overview',
      label: pl ? 'Przegląd' : 'Overview',
      body: (
        <>
          {block('kpi-row')}
          {block('cash-flow')}
        </>
      ),
    },
    {
      id: 'receivables',
      label: pl ? 'Należności i wydatki' : 'Receivables and spend',
      body: (
        <>
          {pair('expense-approval', 'ar-aging')}
          {block('invoice-list')}
          {block('budget-vs-actual')}
        </>
      ),
    },
    {
      id: 'books',
      label: pl ? 'Księgi' : 'Books',
      body: pair('ledger', 'invoice-detail'),
    },
    {
      id: 'reporting',
      label: pl ? 'Raporty' : 'Reporting',
      body: (
        <>
          {pair('cash-runway', 'tax-summary')}
          {block('profit-and-loss')}
        </>
      ),
    },
    {
      id: 'operations',
      label: pl ? 'Operacje' : 'Operations',
      body: (
        <>
          {block('bank-reconciliation')}
          {pair('payouts', 'vendors-list')}
        </>
      ),
    },
  ];
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-8">
      <header className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <p className="text-sm text-fg-muted">Fernhill Systems Ltd</p>
          <h1 className="font-display text-3xl font-heading tracking-tight">
            {data.copy(locale).dashboardTitle}
          </h1>
        </div>
        <nav aria-label={pl ? 'Sekcje' : 'Sections'}>
          <ul className="flex flex-wrap gap-x-1 gap-y-1">
            {sections.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="inline-flex min-h-8 items-center rounded-md px-2 text-sm text-fg-muted hover:bg-surface-sunken hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus pointer-coarse:min-h-(--rx-control-height-touch)"
                >
                  {section.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      {sections.map((section) => (
        <section
          key={section.id}
          id={section.id}
          aria-labelledby={`${section.id}-heading`}
          className="flex scroll-mt-4 flex-col gap-6"
        >
          <h2
            id={`${section.id}-heading`}
            className="text-sm font-medium tracking-wide text-fg-muted uppercase"
          >
            {section.label}
          </h2>
          {section.body}
        </section>
      ))}
    </div>
  );
}
