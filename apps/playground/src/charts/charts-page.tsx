import * as movingCharts from '@rectio/motion/charts';
import * as moving from '@rectio/motion';
import {
  Button,
  ChartCard,
  Sparkline,
  ThemeScope,
  Toggle,
  ToggleGroup,
  TrendChip,
} from '@rectio/ui';
import * as plainCharts from '@rectio/ui/charts';
import { useState, type ReactNode } from 'react';

import { usePageCanvas } from '../page-canvas';
import { MODES, THEMES, type Mode, type ThemeId } from '../themes';
import {
  ACTIVE_USERS,
  CASHFLOW,
  MRR,
  MRR_NEXT,
  NET_CASH,
  PLAN_MIX,
  RESPONSE,
  REVENUE,
  SIGNUPS,
  SPEND,
  STATS,
  TICKETS,
} from './data';

type Charts = Pick<typeof plainCharts, 'AreaChart' | 'BarChart' | 'DonutChart' | 'LineChart'>;

const LOCALE = 'en-GB';

const money = (value: number) =>
  new Intl.NumberFormat(LOCALE, {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value);

const mrrTotal = (row: (typeof MRR)[number] | undefined) =>
  row === undefined ? 1 : row.starter + row.team + row.enterprise;

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-display text-xl font-heading tracking-tight">{title}</h2>
      {children}
    </section>
  );
}

function StatRow({ spark }: { spark: typeof Sparkline }) {
  const Spark = spark;
  return (
    <div className="grid grid-cols-1 gap-px overflow-hidden rounded-panel border border-line bg-line sm:grid-cols-2 xl:grid-cols-4">
      {STATS.map((stat) => (
        <div key={stat.label} className="flex flex-col gap-2 bg-surface px-5 py-4">
          <p className="text-sm text-fg-muted">{stat.label}</p>
          <div className="flex items-end justify-between gap-3">
            <div className="flex min-w-0 flex-col gap-1">
              <span className="text-2xl font-strong tracking-tight numeric">{stat.value}</span>
              <TrendChip
                value={stat.change}
                format={stat.format ?? 'percent'}
                better={stat.better}
                locale={LOCALE}
                comparison="vs last month"
              />
            </div>
            <Spark data={stat.data} className="h-9 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}

function Dashboard({ charts }: { charts: Charts }) {
  const { AreaChart, BarChart, DonutChart, LineChart } = charts;
  const [range, setRange] = useState('90');
  const [basis, setBasis] = useState('booked');
  const mrr = basis === 'forecast' ? MRR_NEXT : MRR;
  const days = Number(range);
  const revenue = REVENUE.slice(-days);
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      <ChartCard
        className="lg:col-span-8"
        title="Revenue"
        description={`Last ${String(days)} days, by day`}
        value={money(revenue.reduce((sum, p) => sum + p.value, 0))}
        delta={
          <TrendChip
            value={days === 90 ? 0.124 : 0.058}
            locale={LOCALE}
            comparison="vs previous period"
          />
        }
        actions={
          <ToggleGroup
            size="sm"
            aria-label="Range"
            value={[range]}
            onValueChange={(value) => {
              setRange(value[0] ?? '90');
            }}
          >
            <Toggle value="30">30d</Toggle>
            <Toggle value="90">90d</Toggle>
          </ToggleGroup>
        }
      >
        <AreaChart
          series={[{ id: 'revenue', label: 'Revenue', points: revenue }]}
          format="currency"
          currency="EUR"
          locale={LOCALE}
          plotClassName="h-56 lg:h-72"
        />
      </ChartCard>
      <ChartCard
        className="lg:col-span-4"
        title="Plan mix"
        description="Active accounts"
        footer="Counted at the start of each day"
      >
        <DonutChart data={PLAN_MIX} locale={LOCALE} centerLabel="Accounts" />
      </ChartCard>
      <ChartCard
        className="lg:col-span-7"
        title="Monthly recurring revenue"
        description="By plan, June to November"
        value={money(mrrTotal(mrr.at(-1)))}
        delta={
          <TrendChip
            value={(mrrTotal(mrr.at(-1)) - mrrTotal(mrr.at(-2))) / mrrTotal(mrr.at(-2))}
            locale={LOCALE}
            comparison="vs October"
          />
        }
        actions={
          <ToggleGroup
            size="sm"
            aria-label="Figures"
            value={[basis]}
            onValueChange={(value) => {
              setBasis(value[0] ?? 'booked');
            }}
          >
            <Toggle value="booked">Booked</Toggle>
            <Toggle value="forecast">Forecast</Toggle>
          </ToggleGroup>
        }
      >
        <BarChart
          data={mrr}
          category="month"
          stacked
          series={[
            { key: 'starter', label: 'Starter' },
            { key: 'team', label: 'Team' },
            { key: 'enterprise', label: 'Enterprise' },
          ]}
          format="currency"
          currency="EUR"
          locale={LOCALE}
          plotClassName="h-60"
          messages={{ categoryHeader: 'Month' }}
        />
      </ChartCard>
      <ChartCard
        className="lg:col-span-5"
        title="Open tickets"
        description="By team, today"
        value="135"
        delta={<TrendChip value={-0.09} better="down" locale={LOCALE} comparison="vs last week" />}
      >
        <BarChart
          data={TICKETS}
          category="team"
          orientation="horizontal"
          labels
          series={[{ key: 'open', label: 'Open tickets' }]}
          locale={LOCALE}
          messages={{ categoryHeader: 'Team' }}
        />
      </ChartCard>
      <ChartCard
        className="lg:col-span-6"
        title="Weekly active users"
        description="This quarter against last"
        value="4,198"
        delta={<TrendChip value={0.112} locale={LOCALE} comparison="vs last quarter" />}
      >
        <LineChart series={ACTIVE_USERS} locale={LOCALE} baseline="fit" plotClassName="h-56" />
      </ChartCard>
      <ChartCard
        className="lg:col-span-6"
        title="Operating spend"
        description="Year to date, by category"
        value="€275,600"
        delta={<TrendChip value={0.042} better="down" locale={LOCALE} comparison="vs last year" />}
      >
        <DonutChart
          data={SPEND}
          format="currency"
          currency="EUR"
          locale={LOCALE}
          centerValue={null}
          plotClassName="h-44"
        />
      </ChartCard>
    </div>
  );
}

function Edges({ charts }: { charts: Charts }) {
  const { BarChart, LineChart } = charts;
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <ChartCard title="Signups" description="A week missing from the import breaks the line">
        <LineChart series={SIGNUPS} locale={LOCALE} plotClassName="h-48" />
      </ChartCard>
      <ChartCard title="Response time" description="By hour against a 250 ms target">
        <LineChart
          series={RESPONSE}
          locale={LOCALE}
          format="number"
          references={[{ value: 250, label: 'Target 250 ms' }]}
          plotClassName="h-48"
        />
      </ChartCard>
      <ChartCard title="Net cash" description="By month, both sides of zero">
        <BarChart
          data={NET_CASH}
          category="month"
          series={[{ key: 'net', label: 'Net cash' }]}
          format="currency"
          currency="EUR"
          locale={LOCALE}
          plotClassName="h-48"
        />
      </ChartCard>
      <ChartCard title="Invoiced and collected" description="By month, side by side">
        <BarChart
          data={CASHFLOW}
          category="month"
          series={[
            { key: 'invoiced', label: 'Invoiced' },
            { key: 'collected', label: 'Collected' },
          ]}
          format="currency"
          currency="EUR"
          locale={LOCALE}
          plotClassName="h-48"
          messages={{ categoryHeader: 'Month' }}
        />
      </ChartCard>
      <ChartCard title="Churn" description="Monthly, last 12 months" loading>
        <LineChart series={[]} loading plotClassName="h-48" />
      </ChartCard>
      <ChartCard title="Expansion revenue" description="No upgrades booked yet">
        <BarChart
          data={[] as { month: string; value: number }[]}
          category="month"
          series={[{ key: 'value', label: 'Expansion' }]}
          plotClassName="h-48"
          emptyAction={<Button size="sm">Connect billing</Button>}
        />
      </ChartCard>
    </div>
  );
}

export function ChartsPage({
  theme,
  mode,
  motion,
}: {
  theme: ThemeId;
  mode: Mode;
  motion: boolean;
}) {
  const canvas = usePageCanvas(theme, mode);
  const charts: Charts = motion ? movingCharts : plainCharts;
  const spark = motion ? moving.Sparkline : Sparkline;
  const themeName = THEMES.find((t) => t.id === theme)?.name ?? theme;
  return (
    <ThemeScope
      ref={canvas}
      theme={theme}
      mode={mode}
      className="min-h-dvh bg-surface-canvas text-fg"
    >
      <moving.MotionPreferenceProvider value={motion ? 'user' : 'off'}>
        <div className="mx-auto flex max-w-screen-2xl flex-col gap-10 px-4 py-8 sm:px-8">
          <header className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h1 className="font-display text-3xl font-heading tracking-tight">Charts</h1>
              <p className="text-sm text-fg-muted">
                {themeName}, {mode}
                {motion ? ', motion add-on' : ''}
              </p>
            </div>
            <nav aria-label="Theme and mode" className="flex flex-wrap gap-2 text-sm">
              {THEMES.flatMap((t) =>
                MODES.map((m) => (
                  <a
                    key={`${t.id}-${m}`}
                    href={`?view=charts&theme=${t.id}&mode=${m}${motion ? '&motion=on' : ''}`}
                    aria-current={t.id === theme && m === mode ? 'page' : undefined}
                    className="rounded-control px-2 py-1 text-fg-muted hover:bg-surface-hover hover:text-fg focus-visible:outline-2 focus-visible:outline-focus aria-[current=page]:bg-surface-selected aria-[current=page]:text-fg"
                  >
                    {t.name} {m}
                  </a>
                )),
              )}
            </nav>
          </header>
          <Section title="Key figures">
            <StatRow spark={spark} />
          </Section>
          <Section title="Dashboard">
            <Dashboard charts={charts} />
          </Section>
          <Section title="Gaps, targets, negatives and states">
            <Edges charts={charts} />
          </Section>
        </div>
      </moving.MotionPreferenceProvider>
    </ThemeScope>
  );
}
