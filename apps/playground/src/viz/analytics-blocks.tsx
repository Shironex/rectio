import * as plain from '@rectio/blocks/analytics';
import * as moving from '@rectio/blocks/analytics/motion';
import { Toggle, ToggleGroup } from '@rectio/ui';
import { useState } from 'react';

import {
  ACTIVE_WORKSPACES,
  CHURN,
  MRR_WEEKLY,
  REVENUE_BY_CHANNEL,
  SPEND_BY_VENDOR,
  TRIAL_FUNNEL,
  TRIAL_FUNNEL_BEFORE,
} from './data';

const LOCALE = 'en-GB';
/** A fixed today, so the pace reads the same on every visit. */
const TODAY = new Date(2026, 10, 18);

export function AnalyticsBlocks({ motion }: { motion: boolean }) {
  const { BreakdownTable, FunnelCard, GoalTracker, MetricTrend } = motion ? moving : plain;
  const [period, setPeriod] = useState('month');
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <MetricTrend
          label="Monthly recurring revenue"
          points={MRR_WEEKLY}
          previous={MRR_WEEKLY.at(-5)?.value}
          comparison="vs 4 weeks ago"
          format="currency"
          currency="EUR"
          locale={LOCALE}
        />
        <MetricTrend
          label="Logo churn"
          points={CHURN}
          previous={CHURN.at(-2)?.value}
          comparison="vs October"
          better="down"
          format="percent"
          locale={LOCALE}
        />
        <MetricTrend
          label="Active workspaces"
          points={ACTIVE_WORKSPACES}
          previous={ACTIVE_WORKSPACES.at(-8)?.value}
          comparison="vs last week"
          locale={LOCALE}
        />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <MetricTrend
          variant="stacked"
          className="lg:col-span-7"
          label="Monthly recurring revenue"
          description="Weekly, last 6 months"
          points={MRR_WEEKLY}
          previous={MRR_WEEKLY[0]?.value}
          comparison="since May"
          format="currency"
          currency="EUR"
          locale={LOCALE}
          reference={{ value: 50000, label: 'Q4 target' }}
        />
        <GoalTracker
          className="lg:col-span-5"
          label="New ARR this quarter"
          description="1 October to 31 December"
          value={412000}
          target={600000}
          start={new Date(2026, 9, 1)}
          end={new Date(2026, 11, 31)}
          today={TODAY}
          format="currency"
          currency="EUR"
          locale={LOCALE}
        />
        <FunnelCard
          className="lg:col-span-7"
          title="Trial to paid"
          description="Last 30 days"
          stages={TRIAL_FUNNEL}
          previous={TRIAL_FUNNEL_BEFORE}
          comparison="vs the 30 days before"
          locale={LOCALE}
        />
        <div className="flex flex-col gap-4 lg:col-span-5">
          <GoalTracker
            variant="bar"
            label="Support replies within 4 hours"
            description="This month"
            value={1184}
            target={1500}
            start={new Date(2026, 10, 1)}
            end={new Date(2026, 10, 30)}
            today={TODAY}
            locale={LOCALE}
          />
          <BreakdownTable
            title="Spend by vendor"
            description="This quarter, against last"
            items={SPEND_BY_VENDOR}
            variant="compact"
            better="down"
            comparison="vs last quarter"
            format="currency"
            currency="EUR"
            locale={LOCALE}
          />
        </div>
        <BreakdownTable
          className="lg:col-span-12"
          title="Revenue by channel"
          description={period === 'month' ? 'November, against October' : 'This quarter'}
          items={
            period === 'month'
              ? REVENUE_BY_CHANNEL
              : REVENUE_BY_CHANNEL.map((item) => ({
                  ...item,
                  value: item.value * 3 - 1200,
                  previous: (item.previous || 0) * 3,
                }))
          }
          limit={6}
          comparison="vs last period"
          format="currency"
          currency="EUR"
          locale={LOCALE}
          actions={
            <ToggleGroup
              size="sm"
              aria-label="Period"
              value={[period]}
              onValueChange={(value) => {
                setPeriod(value[0] ?? 'month');
              }}
            >
              <Toggle value="month">Month</Toggle>
              <Toggle value="quarter">Quarter</Toggle>
            </ToggleGroup>
          }
        />
      </div>
    </div>
  );
}
