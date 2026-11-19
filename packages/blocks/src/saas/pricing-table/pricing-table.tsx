import { CheckIcon, MinusIcon } from '@phosphor-icons/react';
import { cn } from '@rectio/ui';
import { Fragment, useState } from 'react';

import { useBlockParts } from '../../lib/block-parts';
import { BlockPanel } from '../../lib/block-panel';
import { EmptyNote } from '../../lib/empty-note';
import { formatPercent, resolveLocale } from '../../lib/finance';
import { Segmented } from '../../lib/segmented';
import {
  groupPricingFeatures,
  pricingBestSaving,
  pricingMonthlyPrice,
  pricingYearlySaving,
  type PricingCycle,
  type PricingFeature,
  type PricingPlan,
} from './pricing-table.logic';

export interface PricingTableProps {
  /** Two to four plans, cheapest first. */
  plans: readonly PricingPlan[];
  /** Rows of the comparison under the plans; omit to show the plans alone. */
  features?: readonly PricingFeature[];
  currency: string;
  locale?: string;
  defaultCycle?: PricingCycle;
  /** Marks the plan someone is on, so its button reads "Current plan" and does nothing. */
  currentPlanId?: string | undefined;
  /** Called with the plan and the cycle shown when its button is pressed. */
  onSelectPlan: (plan: PricingPlan, cycle: PricingCycle) => void;
  title?: string;
  description?: string;
  /** Drop the panel frame, for a landing page section. */
  bare?: boolean;
  className?: string;
}

/** Columns by plan count: never more columns than plans, so no card stretches alone. */
const COLUMNS: Record<number, string> = {
  1: '',
  2: '@2xl:grid-cols-2',
  3: '@3xl:grid-cols-3',
  4: '@2xl:grid-cols-2 @5xl:grid-cols-4',
};

/**
 * Plans side by side with a monthly and yearly switch that says what yearly saves, one plan drawn
 * forward as recommended, the visitor's current plan marked, and a comparison of every feature
 * below. Prices are per month on both cycles, with the yearly total spelled out under them.
 */
export function PricingTable({
  plans,
  features = [],
  currency,
  locale: requestedLocale,
  defaultCycle = 'yearly',
  currentPlanId,
  onSelectPlan,
  ...panel
}: PricingTableProps) {
  const locale = resolveLocale(requestedLocale);
  const { Button, Money } = useBlockParts();
  const [cycle, setCycle] = useState<PricingCycle>(defaultCycle);
  const saving = pricingBestSaving(plans);
  const hasYearly = plans.some((plan) => plan.yearly !== undefined);

  return (
    <BlockPanel
      {...panel}
      title={panel.title ?? 'Plans and pricing'}
      actions={
        hasYearly ? (
          <Segmented
            label="Billing cycle"
            value={cycle}
            onValueChange={setCycle}
            options={[
              { value: 'monthly', label: 'Monthly' },
              {
                value: 'yearly',
                label: 'Yearly',
                ...(saving > 0
                  ? { hint: `Save up to ${formatPercent(saving, locale, { digits: 0 })}` }
                  : {}),
              },
            ]}
          />
        ) : undefined
      }
      bodyClassName="gap-8"
    >
      {plans.length === 0 ? (
        <EmptyNote title="No plans to show">
          Add a plan to show its price and features here.
        </EmptyNote>
      ) : (
        <>
          <ul
            aria-label={`Plans, prices per month, billed ${cycle}`}
            className={cn('grid items-stretch gap-4', COLUMNS[Math.min(plans.length, 4)])}
          >
            {plans.map((plan) => {
              const price = pricingMonthlyPrice(plan, cycle, currency);
              const current = plan.id === currentPlanId;
              const planSaving = cycle === 'yearly' ? pricingYearlySaving(plan) : 0;
              const recommended = plan.recommended === true;
              return (
                <li
                  key={plan.id}
                  aria-label={recommended ? `${plan.name}, recommended` : plan.name}
                  className={cn(
                    'relative flex flex-col gap-5 rounded-panel border p-5',
                    recommended
                      ? 'border-accent bg-surface-raised shadow-raised ring-1 ring-accent'
                      : 'border-line bg-surface',
                  )}
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-display text-lg font-heading tracking-tight">
                        {plan.name}
                      </h3>
                      {recommended && (
                        <span className="rounded-badge bg-accent px-1.5 py-px text-xs font-medium text-accent-contrast">
                          Recommended
                        </span>
                      )}
                      {!recommended && current && (
                        <span className="rounded-badge border border-line-strong px-1.5 py-px text-xs font-medium text-fg-muted">
                          Your plan
                        </span>
                      )}
                    </div>
                    {plan.description !== undefined && (
                      <p className="text-sm text-pretty text-fg-muted">{plan.description}</p>
                    )}
                  </div>

                  <div className="flex flex-col gap-1">
                    {price === null || price === 0 ? (
                      <span className="font-display text-4xl font-strong tracking-tight">
                        {price === null ? 'Custom' : 'Free'}
                      </span>
                    ) : (
                      <span className="flex flex-wrap items-baseline gap-x-1.5">
                        <Money
                          amount={price}
                          currency={currency}
                          locale={locale}
                          quietCurrency
                          className="text-4xl font-strong tracking-tight"
                        />
                        <span className="text-sm text-fg-muted">
                          per month{plan.unit !== undefined && `, ${plan.unit}`}
                        </span>
                      </span>
                    )}
                    <span className="text-sm text-fg-muted">
                      {price === null ? (
                        'Priced for your volume, billed yearly'
                      ) : price === 0 ? (
                        'Free for as long as you like'
                      ) : cycle === 'yearly' && plan.yearly !== undefined ? (
                        <>
                          <Money amount={plan.yearly} currency={currency} locale={locale} /> billed
                          yearly
                          {planSaving > 0 && (
                            <span className="text-positive-strong">
                              , you save {formatPercent(planSaving, locale, { digits: 0 })}
                            </span>
                          )}
                        </>
                      ) : (
                        'Billed monthly, cancel any time'
                      )}
                    </span>
                  </div>

                  {current ? (
                    <Button variant="secondary" disabled className="w-full">
                      <CheckIcon aria-hidden weight="bold" className="size-4" />
                      Current plan
                    </Button>
                  ) : (
                    <Button
                      variant={recommended ? 'primary' : 'secondary'}
                      className="w-full"
                      aria-label={`${plan.cta ?? `Choose ${plan.name}`}, ${plan.name} plan`}
                      onClick={() => {
                        onSelectPlan(plan, cycle);
                      }}
                    >
                      {plan.cta ?? `Choose ${plan.name}`}
                    </Button>
                  )}

                  {plan.highlights !== undefined && plan.highlights.length > 0 && (
                    <ul className="flex flex-col gap-2 border-t border-line pt-4 text-sm">
                      {plan.highlights.map((line) => (
                        <li key={line} className="flex items-start gap-2">
                          <CheckIcon
                            aria-hidden
                            weight="bold"
                            className="mt-0.5 size-3.5 shrink-0 text-accent-strong"
                          />
                          <span>{line}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>

          {features.length > 0 && <Comparison plans={plans} features={features} />}
        </>
      )}
    </BlockPanel>
  );
}

function FeatureValue({ value }: { value: boolean | string | undefined }) {
  if (value === true) {
    return (
      <>
        <CheckIcon aria-hidden weight="bold" className="mx-auto size-4 text-accent-strong" />
        <span className="sr-only">Included</span>
      </>
    );
  }
  if (value === false || value === undefined) {
    return (
      <>
        <MinusIcon aria-hidden weight="bold" className="mx-auto size-4 text-fg-disabled" />
        <span className="sr-only">Not included</span>
      </>
    );
  }
  return <span className="numeric">{value}</span>;
}

/** Every feature against every plan. Scrolls sideways on a narrow block, row names kept in view. */
function Comparison({
  plans,
  features,
}: {
  plans: readonly PricingPlan[];
  features: readonly PricingFeature[];
}) {
  const groups = groupPricingFeatures(features);
  return (
    <div
      role="region"
      aria-label="Compare plans"
      tabIndex={0}
      className="-mx-1 overflow-x-auto rounded-control px-1 outline-offset-2 focus-visible:outline-2 focus-visible:outline-focus"
    >
      <table className="w-full min-w-xl border-collapse text-sm">
        <caption className="pb-3 text-start font-display text-lg font-heading tracking-tight text-fg">
          Compare plans
        </caption>
        <thead>
          <tr className="border-b border-line-strong">
            <th
              scope="col"
              className="sticky start-0 bg-surface py-2 pe-4 text-start font-medium text-fg-muted"
            >
              <span className="sr-only">Feature</span>
            </th>
            {plans.map((plan) => (
              <th
                key={plan.id}
                scope="col"
                className={cn(
                  'w-1/6 px-2 py-2 text-center font-medium',
                  plan.recommended === true && 'text-accent-strong',
                )}
              >
                {plan.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {groups.map((group) => (
            <Fragment key={group.name ?? 'features'}>
              {group.name !== null && (
                <tr>
                  <th
                    scope="colgroup"
                    colSpan={plans.length + 1}
                    className="pt-5 pb-1.5 text-start text-xs font-medium tracking-caps text-fg-subtle uppercase"
                  >
                    {group.name}
                  </th>
                </tr>
              )}
              {group.features.map((feature) => (
                <tr key={feature.id} className="border-b border-line last:border-b-0">
                  <th
                    scope="row"
                    className="sticky start-0 bg-surface py-2.5 pe-4 text-start font-regular text-fg"
                  >
                    {feature.label}
                  </th>
                  {plans.map((plan) => (
                    <td key={plan.id} className="px-2 py-2.5 text-center text-fg-muted">
                      <FeatureValue value={feature.values[plan.id]} />
                    </td>
                  ))}
                </tr>
              ))}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
