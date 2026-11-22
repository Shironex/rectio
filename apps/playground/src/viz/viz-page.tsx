import * as movingCharts from '@rectio/motion/charts';
import * as moving from '@rectio/motion';
import { ChartCard, ThemeScope, Toggle, ToggleGroup } from '@rectio/ui';
import * as plainCharts from '@rectio/ui/charts';
import { useState, type ReactNode } from 'react';

import { usePageCanvas } from '../page-canvas';
import { MODES, THEMES, type Mode, type ThemeId } from '../themes';
import { AnalyticsBlocks } from './analytics-blocks';
import {
  ARR_BRIDGE,
  CASH_BRIDGE,
  COLLECTION_FUNNEL,
  DEPLOYS,
  QUOTA_BANDS,
  RETENTION,
  RETENTION_COLUMNS,
  RETENTION_ROWS,
  TICKET_COLUMNS,
  TICKET_ROWS,
  TICKETS_BY_HOUR,
  TRIAL_FUNNEL,
} from './data';

type Charts = Pick<
  typeof plainCharts,
  'FunnelChart' | 'Heatmap' | 'RadialGauge' | 'WaterfallChart'
>;

const LOCALE = 'en-GB';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-display text-xl font-heading tracking-tight">{title}</h2>
      {children}
    </section>
  );
}

function Charts({ charts }: { charts: Charts }) {
  const { FunnelChart, Heatmap, RadialGauge, WaterfallChart } = charts;
  const [quarter, setQuarter] = useState('q3');
  const [week, setWeek] = useState('w9');
  const attainment = { w5: 0.41, w9: 0.82, w13: 1.08 }[week] ?? 0.82;
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      <ChartCard className="lg:col-span-7" title="Trial funnel" description="Last 30 days">
        <FunnelChart data={TRIAL_FUNNEL} locale={LOCALE} />
      </ChartCard>
      <ChartCard
        className="lg:col-span-5"
        title="Invoice collection"
        description="Issued in October"
      >
        <FunnelChart
          data={COLLECTION_FUNNEL}
          orientation="vertical"
          format="currency"
          currency="EUR"
          locale={LOCALE}
        />
      </ChartCard>
      <ChartCard
        className="lg:col-span-12"
        title="Deploys"
        description="Every day of the last year"
      >
        <Heatmap variant="calendar" data={DEPLOYS} locale={LOCALE} label="Deploys by day" />
      </ChartCard>
      <ChartCard
        className="lg:col-span-7"
        title="Logo retention"
        description="Share of each sign-up cohort still paying"
      >
        <Heatmap
          rows={RETENTION_ROWS}
          columns={RETENTION_COLUMNS}
          data={RETENTION}
          format="percent"
          locale={LOCALE}
          rowHeader="Cohort"
          label="Logo retention by cohort"
        />
      </ChartCard>
      <ChartCard
        className="lg:col-span-5"
        title="Tickets opened"
        description="By weekday and time, last 4 weeks"
      >
        <Heatmap
          rows={TICKET_ROWS}
          columns={TICKET_COLUMNS}
          data={TICKETS_BY_HOUR}
          steps={4}
          locale={LOCALE}
          rowHeader="Day"
          label="Tickets opened by weekday and time"
        />
      </ChartCard>
      <ChartCard
        className="lg:col-span-8"
        title="Cash bridge"
        description={quarter === 'q3' ? 'July to September' : 'April to June'}
        actions={
          <ToggleGroup
            size="sm"
            aria-label="Quarter"
            value={[quarter]}
            onValueChange={(value) => {
              setQuarter(value[0] ?? 'q3');
            }}
          >
            <Toggle value="q2">Q2</Toggle>
            <Toggle value="q3">Q3</Toggle>
          </ToggleGroup>
        }
      >
        <WaterfallChart
          data={
            quarter === 'q3'
              ? CASH_BRIDGE
              : CASH_BRIDGE.map((step) =>
                  step.value === undefined
                    ? step
                    : { ...step, value: Math.round(step.value * 0.86) },
                )
          }
          format="currency"
          currency="EUR"
          locale={LOCALE}
        />
      </ChartCard>
      <ChartCard
        className="lg:col-span-4"
        title="Quota attainment"
        description="Sales team, this quarter"
        actions={
          <ToggleGroup
            size="sm"
            aria-label="Week of the quarter"
            value={[week]}
            onValueChange={(value) => {
              setWeek(value[0] ?? 'w9');
            }}
          >
            <Toggle value="w5">Wk 5</Toggle>
            <Toggle value="w9">Wk 9</Toggle>
            <Toggle value="w13">Wk 13</Toggle>
          </ToggleGroup>
        }
      >
        <RadialGauge
          label="Quota attainment"
          value={attainment}
          max={1.25}
          target={1}
          marker={{ value: { w5: 0.38, w9: 0.69, w13: 1 }[week] ?? 0.69, label: 'Pace' }}
          bands={QUOTA_BANDS}
          format="percent"
          locale={LOCALE}
        />
      </ChartCard>
      <ChartCard className="lg:col-span-7" title="ARR movement" description="Since 1 January">
        <WaterfallChart
          data={ARR_BRIDGE}
          format="currency"
          currency="EUR"
          locale={LOCALE}
          orientation="horizontal"
        />
      </ChartCard>
      <ChartCard className="lg:col-span-5" title="Cloud spend" description="Of the monthly budget">
        <RadialGauge
          label="Cloud spend"
          value={31840}
          max={40000}
          target={36000}
          bands={[
            { to: 30000, label: 'Within' },
            { to: 36000, label: 'Watch' },
            { to: 40000, label: 'Over' },
          ]}
          better="lower"
          format="currency"
          currency="EUR"
          locale={LOCALE}
          centerLabel="of €36,000 budget"
        />
      </ChartCard>
    </div>
  );
}

function States({ charts }: { charts: Charts }) {
  const { FunnelChart, Heatmap, RadialGauge, WaterfallChart } = charts;
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      <ChartCard title="Funnel" description="Loading">
        <FunnelChart data={[]} loading />
      </ChartCard>
      <ChartCard title="Funnel" description="Empty">
        <FunnelChart data={[]} />
      </ChartCard>
      <ChartCard title="Heatmap" description="Empty">
        <Heatmap rows={[]} columns={[]} data={[]} />
      </ChartCard>
      <ChartCard title="Waterfall" description="Below zero">
        <WaterfallChart
          data={[
            { id: 'open', label: 'Opening', value: 18000, kind: 'start' },
            { id: 'refunds', label: 'Refunds', value: -26500 },
            { id: 'fees', label: 'Fees', value: -3100 },
            { id: 'close', label: 'Closing', kind: 'end' },
          ]}
          format="currency"
          currency="EUR"
          locale={LOCALE}
          labels={false}
        />
      </ChartCard>
      <ChartCard title="Waterfall" description="Loading">
        <WaterfallChart data={[]} loading />
      </ChartCard>
      <ChartCard title="Gauge" description="Loading">
        <RadialGauge label="Uptime" value={0} max={1} loading />
      </ChartCard>
      <ChartCard title="Gauge" description="Nothing yet">
        <RadialGauge label="Uptime" value={0} max={1} target={0.999} format="percent" />
      </ChartCard>
    </div>
  );
}

export function VizPage({ theme, mode, motion }: { theme: ThemeId; mode: Mode; motion: boolean }) {
  const canvas = usePageCanvas(theme, mode);
  const charts: Charts = motion ? movingCharts : plainCharts;
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
              <h1 className="font-display text-3xl font-heading tracking-tight">Analytics</h1>
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
                    href={`?view=viz&theme=${t.id}&mode=${m}${motion ? '&motion=on' : ''}`}
                    aria-current={t.id === theme && m === mode ? 'page' : undefined}
                    className="inline-flex items-center rounded-control px-2 py-1 text-fg-muted pointer-coarse:min-h-(--rx-control-height-touch) hover:bg-surface-hover hover:text-fg focus-visible:outline-2 focus-visible:outline-focus aria-[current=page]:bg-surface-selected aria-[current=page]:text-fg"
                  >
                    {t.name} {m}
                  </a>
                )),
              )}
            </nav>
          </header>
          <Section title="Analytics blocks">
            <AnalyticsBlocks motion={motion} />
          </Section>
          <Section title="Funnel, heatmap, waterfall and gauge">
            <Charts charts={charts} />
          </Section>
          <Section title="States">
            <States charts={charts} />
          </Section>
        </div>
      </moving.MotionPreferenceProvider>
    </ThemeScope>
  );
}
