import * as plain from '@rectio/blocks';
import * as moving from '@rectio/blocks/motion';
import { Button, ThemeScope } from '@rectio/ui';
import { useReducer, type ReactNode } from 'react';

import { usePageCanvas } from '../page-canvas';
import { readSkin, type Mode, type ThemeId } from '../themes';
import * as data from './data';
import { REPORTING_BLOCKS, isReportingBlock, renderReporting } from './reporting';
import { OPERATIONS_BLOCKS, isOperationsBlock, renderOperations } from './operations';
import { SaasPage, saasBlockFrom } from './saas/saas-page';

/** The one action each block offers in its empty state. */
function emptyAction(name: BlockName): ReactNode {
  const label = {
    'invoice-list': 'Create invoice',
    ledger: 'Add an entry',
    'cash-flow': 'Import bank feed',
    'budget-vs-actual': 'Set a budget',
    'ar-aging': 'Create invoice',
    'expense-approval': 'View submitted expenses',
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
  const locale = data.LOCALES['en-GB'];
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
  const text = data.copy();
  switch (name) {
    case 'invoice-list':
      return (
        <blocks.InvoiceList
          {...common}
          invoices={data.invoices()}
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
          invoice={data.invoiceDocument()}
          today={data.TODAY}
          onRecordPayment={() => undefined}
          onSendReminder={() => undefined}
          onDownload={() => undefined}
        />
      );
    case 'ledger':
      return (
        <blocks.Ledger
          {...common}
          accounts={data.accounts()}
          lines={data.journal()}
          openingBalances={data.openingBalances()}
          period={text.month}
        />
      );
    case 'cash-flow':
      return <blocks.CashFlowChart {...common} points={data.cashFlow()} />;
    case 'kpi-row':
      return (
        <blocks.KpiRow
          {...common}
          // `kpis=saas` shows the count, duration and currency formats.
          kpis={
            new URLSearchParams(window.location.search).get('kpis') === 'saas'
              ? data.saasKpis()
              : data.kpis()
          }
          comparison={text.comparison}
          label={text.kpiLabel}
        />
      );
    case 'expense-approval':
      return <Approvals blocks={blocks} locale={locale} />;
    case 'ar-aging':
      return <blocks.ArAging {...common} receivables={data.receivables()} today={data.TODAY} />;
    case 'budget-vs-actual':
      return (
        <blocks.BudgetVsActual {...common} lines={data.budget()} period={text.quarterProgress} />
      );
  }
}

/** Each block with nothing to show, as a new company's first day would have it. */
function renderEmpty(name: BlockName, blocks: Blocks, locale: data.Locale): ReactNode {
  const common = { currency: locale.currency, locale: locale.locale };
  const text = data.copy();
  const emptyActionNode = emptyAction(name);
  switch (name) {
    case 'invoice-list':
      return (
        <blocks.InvoiceList
          {...common}
          invoices={[]}
          today={data.TODAY}
          emptyAction={emptyActionNode}
        />
      );
    case 'ledger':
      return (
        <blocks.Ledger
          {...common}
          accounts={data.accounts()}
          lines={[]}
          period={text.month}
          emptyAction={emptyActionNode}
        />
      );
    case 'cash-flow':
      return <blocks.CashFlowChart {...common} points={[]} emptyAction={emptyActionNode} />;
    case 'expense-approval':
      return (
        <blocks.ExpenseApproval
          {...common}
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
          receivables={[]}
          today={data.TODAY}
          emptyAction={emptyActionNode}
        />
      );
    case 'budget-vs-actual':
      return (
        <blocks.BudgetVsActual
          {...common}
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
  const [state, dispatch] = useReducer(plain.approvalReducer, undefined, data.expenses);
  const actor = 'Niamh Walsh';
  // `?approval=approved` opens a decided view, for the shoot scripts.
  const view = plain.APPROVAL_VIEWS.find(
    (v) => v === new URLSearchParams(window.location.search).get('approval'),
  );
  return (
    <blocks.ExpenseApproval
      {...(view === undefined ? {} : { defaultStatus: view })}
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
  const saas = saasBlockFrom(window.location.search);
  const blocks: Blocks = motion ? moving : plain;
  const canvas = usePageCanvas(theme, mode);
  return (
    <ThemeScope
      ref={canvas}
      theme={theme}
      mode={mode}
      density={compact ? 'compact' : 'comfortable'}
      skin={readSkin(window.location.search)}
      className="min-h-dvh bg-surface-canvas"
    >
      {saas !== null ? (
        <SaasPage selection={saas} motion={motion} empty={empty} locale={locale.id} />
      ) : block !== undefined ? (
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
      label: 'Overview',
      body: (
        <>
          {block('kpi-row')}
          {block('cash-flow')}
        </>
      ),
    },
    {
      id: 'receivables',
      label: 'Receivables and spend',
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
      label: 'Books',
      body: pair('ledger', 'invoice-detail'),
    },
    {
      id: 'reporting',
      label: 'Reporting',
      body: (
        <>
          {pair('cash-runway', 'tax-summary')}
          {block('profit-and-loss')}
        </>
      ),
    },
    {
      id: 'operations',
      label: 'Operations',
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
            {data.copy().dashboardTitle}
          </h1>
        </div>
        <nav aria-label={'Sections'}>
          {/* One row that scrolls sideways on a phone, fading at the edge so the cut reads as more to come. */}
          <ul className="scrollbar-none flex gap-1 overflow-x-auto max-sm:-mx-4 max-sm:px-4 max-sm:mask-r-from-85%">
            {sections.map((section) => (
              <li key={section.id} className="shrink-0 whitespace-nowrap">
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
