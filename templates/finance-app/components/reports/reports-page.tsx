'use client';

import { ChartLineUpIcon, DownloadSimpleIcon, PrinterIcon } from '@phosphor-icons/react';
import { BlockPanel, formatPercent, relativeChange, sumMoney } from '@rectio/blocks';
import { BudgetVsActual, CashFlowChart } from '@rectio/blocks/motion';
import {
  Button,
  Menu,
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
  Money,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  cn,
  useToast,
} from '@rectio/ui';
import { useState, type ReactNode } from 'react';

import { CURRENCY, LOCALE } from '@/data/company';
import { CASH_FLOW } from '@/data/overview';
import {
  BALANCE_SHEET,
  PROFIT_AND_LOSS,
  REPORT_BUDGET,
  REPORT_PERIODS,
  equityOf,
  type ReportPeriod,
  type ReportSection,
} from '@/data/reports';
import { PageHeader } from '../page-header';
import { EmptyPanel, ErrorPanel, LoadingPanel, LoadingRegion } from '../states/state-views';
import { usePageState } from '../use-page-state';

const money = (amount: number, className?: string) => (
  <Money
    amount={amount}
    currency={CURRENCY}
    locale={LOCALE}
    {...(className === undefined ? {} : { className })}
  />
);

/**
 * The change from the previous period in words a reader can trust without colour: a signed
 * percentage, tinted only when the move is good or bad for the business.
 */
function Change({
  current,
  previous,
  kind,
}: {
  current: number;
  previous: number;
  kind: 'revenue' | 'cost' | 'profit';
}) {
  const change = relativeChange(current, previous);
  if (change === null || Math.abs(change) < 0.0005)
    return <span className="text-fg-subtle">No change</span>;
  const good = kind === 'cost' ? change < 0 : change > 0;
  return (
    <span className={cn('numeric', good ? 'text-positive-strong' : 'text-negative-strong')}>
      {formatPercent(change, LOCALE, { signed: true })}
      <span className="sr-only">{good ? ', better' : ', worse'}</span>
    </span>
  );
}

interface Totals {
  current: number;
  previous: number;
}

function total(section: ReportSection | undefined): Totals {
  const lines = section?.lines ?? [];
  return {
    current: sumMoney(
      lines.map((l) => l.current),
      CURRENCY,
    ),
    previous: sumMoney(
      lines.map((l) => l.previous),
      CURRENCY,
    ),
  };
}

const minus = (a: Totals, b: Totals): Totals => ({
  current: sumMoney([a.current, -b.current], CURRENCY),
  previous: sumMoney([a.previous, -b.previous], CURRENCY),
});

function ResultRow({
  label,
  totals,
  margin,
  strong = false,
}: {
  label: string;
  totals: Totals;
  margin?: number;
  strong?: boolean;
}) {
  return (
    <TableRow className={cn('bg-surface-sunken', strong && 'font-strong')}>
      <TableCell className={cn(strong ? 'font-strong' : 'font-medium')}>
        {label}
        {margin !== undefined && (
          <span className="ms-2 text-sm font-regular text-fg-muted numeric">
            {formatPercent(margin, LOCALE)} margin
          </span>
        )}
      </TableCell>
      <TableCell align="end">{money(totals.current, 'font-medium')}</TableCell>
      <TableCell align="end" className="hidden text-fg-muted @xl:table-cell">
        {money(totals.previous)}
      </TableCell>
      <TableCell align="end" className="hidden @lg:table-cell">
        <Change current={totals.current} previous={totals.previous} kind="profit" />
      </TableCell>
    </TableRow>
  );
}

function ProfitAndLoss({ period }: { period: ReportPeriod }) {
  const sections = PROFIT_AND_LOSS[period];
  const info = REPORT_PERIODS.find((p) => p.value === period);
  const byId = (id: string) => sections.find((s) => s.id === id);
  const revenue = total(byId('revenue'));
  const gross = minus(revenue, total(byId('cost-of-sales')));
  const operating = minus(gross, total(byId('operating')));
  const results: Record<string, ReactNode> = {
    revenue: <ResultRow label="Total revenue" totals={revenue} />,
    'cost-of-sales': (
      <ResultRow label="Gross profit" totals={gross} margin={gross.current / revenue.current} />
    ),
    operating: (
      <ResultRow
        label="Operating profit"
        totals={operating}
        margin={operating.current / revenue.current}
        strong
      />
    ),
  };

  return (
    <BlockPanel
      title="Profit and loss"
      description={`${info?.label ?? ''}, compared with ${info?.compare ?? ''}`}
    >
      <Table>
        <TableCaption className="sr-only">Profit and loss, amounts in {CURRENCY}</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Account</TableHead>
            <TableHead align="end">{info?.label ?? 'This period'}</TableHead>
            <TableHead align="end" className="hidden @xl:table-cell">
              {info?.compare ?? 'Previous'}
            </TableHead>
            <TableHead align="end" className="hidden @lg:table-cell">
              Change
            </TableHead>
          </TableRow>
        </TableHeader>
        {sections.map((section) => (
          <TableBody key={section.id}>
            <TableRow>
              <TableCell colSpan={4} className="pt-5 text-sm font-medium text-fg-muted">
                {section.label}
              </TableCell>
            </TableRow>
            {section.lines.map((line) => (
              <TableRow key={line.id}>
                <TableCell className="ps-6">{line.label}</TableCell>
                <TableCell align="end">{money(line.current)}</TableCell>
                <TableCell align="end" className="hidden text-fg-muted @xl:table-cell">
                  {money(line.previous)}
                </TableCell>
                <TableCell align="end" className="hidden @lg:table-cell">
                  <Change current={line.current} previous={line.previous} kind={section.kind} />
                </TableCell>
              </TableRow>
            ))}
            {results[section.id]}
          </TableBody>
        ))}
      </Table>
    </BlockPanel>
  );
}

function BalanceSheet() {
  const equity = equityOf(BALANCE_SHEET);
  const groupTotal = (id: string) =>
    sumMoney(BALANCE_SHEET.find((g) => g.id === id)?.lines.map((l) => l.amount) ?? [], CURRENCY);
  return (
    <BlockPanel title="Balance sheet" description="As at 19 November 2026">
      <div className="flex flex-col gap-5">
        {BALANCE_SHEET.map((group) => (
          <dl key={group.id} className="flex flex-col text-sm">
            <dt className="pb-1.5 font-medium text-fg-muted">{group.label}</dt>
            {group.lines.map((line) => (
              <div
                key={line.id}
                className="flex items-baseline justify-between gap-4 border-b border-line py-2"
              >
                <dt className="min-w-0 truncate">{line.label}</dt>
                <dd>{money(line.amount)}</dd>
              </div>
            ))}
            <div className="flex items-baseline justify-between gap-4 py-2 font-medium">
              <dt>Total {group.label.toLowerCase()}</dt>
              <dd>{money(groupTotal(group.id), 'font-medium')}</dd>
            </div>
          </dl>
        ))}
        <div className="flex items-baseline justify-between gap-4 rounded-control bg-surface-sunken px-3 py-2.5 text-sm">
          <span className="font-strong">Equity</span>
          {money(equity, 'font-strong')}
        </div>
      </div>
    </BlockPanel>
  );
}

function ReportsLoading() {
  return (
    <LoadingRegion label="Loading reports">
      <LoadingPanel kind="table" rows={12} columns={4} />
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <LoadingPanel kind="table" rows={6} />
        <LoadingPanel kind="table" rows={6} />
      </div>
    </LoadingRegion>
  );
}

/** The month-end pack: profit and loss, the balance sheet, spend against plan, cash by quarter. */
export function ReportsPage() {
  const state = usePageState();
  const toast = useToast();
  const [period, setPeriod] = useState<ReportPeriod>('month');
  const info = REPORT_PERIODS.find((p) => p.value === period);
  const exported = (file: string) => {
    toast.add({
      type: 'success',
      title: 'Export started',
      description: `${file} will download in a moment.`,
    });
  };

  return (
    <>
      <PageHeader
        title="Reports"
        description="Closed periods only. November closes on 4 December."
        actions={
          <>
            <Select
              items={REPORT_PERIODS}
              value={period}
              onValueChange={(value) => {
                if (value !== null) setPeriod(value);
              }}
            >
              <SelectTrigger
                aria-label="Report period"
                className="sm:w-56"
                disabled={state === 'empty'}
              />
              <SelectContent>
                {REPORT_PERIODS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Menu>
              <MenuTrigger
                render={
                  <Button variant="secondary" disabled={state !== 'ready'}>
                    <DownloadSimpleIcon aria-hidden weight="bold" className="size-4" />
                    Export
                  </Button>
                }
              />
              <MenuContent align="end" className="min-w-56">
                <MenuItem
                  onClick={() => {
                    exported('management-pack.pdf');
                  }}
                >
                  Management pack, PDF
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    exported('profit-and-loss.xlsx');
                  }}
                >
                  Profit and loss, Excel
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    exported('trial-balance.csv');
                  }}
                >
                  Trial balance, CSV
                </MenuItem>
                <MenuSeparator />
                <MenuItem
                  icon={<PrinterIcon aria-hidden weight="bold" className="size-4" />}
                  onClick={() => {
                    print();
                  }}
                >
                  Print
                </MenuItem>
              </MenuContent>
            </Menu>
          </>
        }
      />
      {state === 'loading' ? (
        <ReportsLoading />
      ) : state === 'error' ? (
        <ErrorPanel title="Reports did not load" />
      ) : state === 'empty' ? (
        <EmptyPanel
          icon={<ChartLineUpIcon aria-hidden weight="bold" />}
          title="No closed periods yet"
          description="Reports are built from closed months, so the figures never move under you. Close your first month from the journal."
        />
      ) : (
        <>
          <ProfitAndLoss period={period} />
          <div className="grid items-start gap-6 lg:grid-cols-2">
            <BalanceSheet />
            <BudgetVsActual
              lines={REPORT_BUDGET[period]}
              currency={CURRENCY}
              locale={LOCALE}
              title="Spend against budget"
              period={info?.label ?? ''}
            />
          </div>
          <CashFlowChart
            points={CASH_FLOW}
            currency={CURRENCY}
            locale={LOCALE}
            defaultGranularity="quarter"
            title="Cash flow by quarter"
          />
        </>
      )}
    </>
  );
}
