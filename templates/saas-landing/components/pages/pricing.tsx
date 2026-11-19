'use client';

import { CheckIcon, MinusIcon } from '@phosphor-icons/react';
import {
  ActionLink,
  CtaBand,
  Em,
  Faq,
  Section,
  SectionHeader,
} from '@rectio/blocks/marketing/motion';
import { Money, NumberField, ToggleGroup } from '@rectio/motion';
import {
  Badge,
  Field,
  FieldDescription,
  FieldLabel,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Toggle,
  cn,
} from '@rectio/ui';
import { Fragment, useState } from 'react';

import { PageIntro } from '@/components/page-intro';
import {
  COMPARISON,
  CURRENCY,
  LOCALE,
  monthlyTotal,
  PLANS,
  PRICING_FAQ,
  yearlySaving,
  type Billing,
  type Cell,
  type Plan,
} from '@/data/pricing';
import { DEMO } from '@/data/site';

const SAVING = Math.max(...PLANS.map(yearlySaving));

function BillingSwitch({ value, onChange }: { value: Billing; onChange: (next: Billing) => void }) {
  return (
    <ToggleGroup
      aria-label="Billing period"
      value={[value]}
      onValueChange={(next) => {
        if (next[0] === 'monthly' || next[0] === 'yearly') onChange(next[0]);
      }}
    >
      <Toggle value="monthly">Monthly</Toggle>
      <Toggle value="yearly">
        Yearly
        <span className="text-sm font-regular text-positive-strong">save {SAVING}%</span>
      </Toggle>
    </ToggleGroup>
  );
}

function PlanCard({ plan, billing }: { plan: Plan; billing: Billing }) {
  const price = plan.price[billing] / 100;
  const free = plan.price[billing] === 0;
  return (
    <li
      className={cn(
        'relative flex flex-col gap-6 rounded-panel border p-6 sm:p-8',
        plan.featured === true
          ? 'border-accent bg-surface-raised shadow-overlay'
          : 'border-line bg-surface',
      )}
    >
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-display text-2xl font-strong tracking-tight text-fg">{plan.name}</h3>
          {plan.featured === true && <Badge tone="info">Most teams pick this</Badge>}
        </div>
        <p className="text-base text-fg-muted">{plan.summary}</p>
      </div>
      <div className="flex flex-col gap-1">
        <p className="flex items-baseline gap-2">
          <Money
            amount={price}
            currency={CURRENCY}
            locale={LOCALE}
            className="font-display text-5xl font-strong tracking-tight text-fg"
          />
          {!free && <span className="text-base text-fg-muted">per person a month</span>}
        </p>
        <p className="text-sm text-fg-muted">
          {free
            ? `Free for up to ${String(plan.limit ?? 0)} people, for as long as you like.`
            : billing === 'yearly'
              ? 'Billed yearly.'
              : 'Billed monthly, cancel any time.'}
        </p>
      </div>
      <ActionLink
        action={plan.cta}
        variant={plan.featured === true ? 'primary' : 'secondary'}
        className="w-full"
      />
      <ul className="flex flex-col gap-2.5 border-t border-line pt-6">
        {plan.highlights.map((item) => (
          <li key={item} className="flex items-start gap-2.5 text-base text-fg">
            <CheckIcon aria-hidden weight="bold" className="mt-1 size-4 shrink-0 text-accent" />
            {item}
          </li>
        ))}
      </ul>
    </li>
  );
}

/** What a team of a given size pays on each plan, as the visitor types their headcount. */
function Estimator({ billing }: { billing: Billing }) {
  const [people, setPeople] = useState<number | null>(24);
  const count = people ?? 0;
  return (
    <div className="grid gap-8 rounded-panel border border-line bg-surface-sunken p-6 sm:p-8 lg:grid-cols-12 lg:items-center">
      <div className="flex flex-col gap-4 lg:col-span-4">
        <h2 className="font-display text-2xl font-regular tracking-tight text-fg sm:text-3xl">
          What would <Em>your team</Em> pay?
        </h2>
        <Field>
          <FieldLabel>People on the rota</FieldLabel>
          <NumberField
            value={people}
            onValueChange={(value) => {
              setPeople(value);
            }}
            min={1}
            max={5000}
            locale={LOCALE}
            unit="people"
          />
          <FieldDescription>Managers who never work a shift are free.</FieldDescription>
        </Field>
      </div>
      <dl className="grid gap-3 sm:grid-cols-3 lg:col-span-8" aria-live="polite">
        {PLANS.map((plan) => {
          const total = monthlyTotal(plan, billing, count);
          return (
            <div
              key={plan.id}
              className="flex flex-col gap-1 rounded-panel border border-line bg-surface p-4"
            >
              <dt className="text-sm font-medium text-fg-muted">{plan.name}</dt>
              <dd className="flex flex-col gap-0.5">
                {total === null ? (
                  <>
                    <span className="font-display text-2xl font-strong text-fg-subtle">
                      Not available
                    </span>
                    <span className="text-sm text-fg-muted">Up to {plan.limit ?? 0} people</span>
                  </>
                ) : (
                  <>
                    <Money
                      amount={total / 100}
                      currency={CURRENCY}
                      locale={LOCALE}
                      className="font-display text-2xl font-strong text-fg"
                    />
                    <span className="text-sm text-fg-muted">a month</span>
                  </>
                )}
              </dd>
            </div>
          );
        })}
      </dl>
    </div>
  );
}

function CellValue({ value }: { value: Cell }) {
  if (value === true) {
    return (
      <>
        <CheckIcon aria-hidden weight="bold" className="size-4 text-accent" />
        <span className="sr-only">Included</span>
      </>
    );
  }
  if (value === false) {
    return (
      <>
        <MinusIcon aria-hidden weight="bold" className="size-4 text-fg-subtle" />
        <span className="sr-only">Not included</span>
      </>
    );
  }
  return <span className="text-fg">{value}</span>;
}

function Comparison() {
  return (
    <Section width="default" labelledBy="compare-title">
      <SectionHeader id="compare-title" title="Compare every plan" size="md" />
      <div className="mt-8 overflow-x-auto">
        <Table className="min-w-xl">
          <TableHeader>
            <TableRow>
              <TableHead className="w-2/5">
                <span className="sr-only">Feature</span>
              </TableHead>
              {PLANS.map((plan) => (
                <TableHead key={plan.id}>{plan.name}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {COMPARISON.map((group) => (
              <Fragment key={group.id}>
                <TableRow>
                  <TableHead
                    scope="colgroup"
                    colSpan={PLANS.length + 1}
                    className="bg-surface-sunken text-sm font-strong text-fg"
                  >
                    {group.title}
                  </TableHead>
                </TableRow>
                {group.rows.map((row) => (
                  <TableRow key={row.feature}>
                    <TableHead scope="row" className="font-regular text-fg-muted">
                      {row.feature}
                    </TableHead>
                    {PLANS.map((plan) => (
                      <TableCell key={plan.id}>
                        <CellValue value={row.cells[plan.id]} />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </Fragment>
            ))}
          </TableBody>
        </Table>
      </div>
    </Section>
  );
}

export function PricingPage() {
  const [billing, setBilling] = useState<Billing>('yearly');
  return (
    <>
      <PageIntro
        align="center"
        title={
          <>
            Simple pricing, <Em>per person on the rota</Em>
          </>
        }
        description="Free for small teams. Pay only for people who work shifts, and change plans whenever you like."
      >
        <BillingSwitch value={billing} onChange={setBilling} />
      </PageIntro>
      <section id="plans" aria-label="Plans" className="pb-16 text-fg sm:pb-24">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 sm:px-6 lg:px-8">
          <ul className="grid gap-4 lg:grid-cols-3 lg:items-start">
            {PLANS.map((plan) => (
              <PlanCard key={plan.id} plan={plan} billing={billing} />
            ))}
          </ul>
          <Estimator billing={billing} />
        </div>
      </section>
      <Comparison />
      <Faq
        variant="numbered"
        title="Billing questions"
        description="The four things teams ask before they pay."
        items={PRICING_FAQ}
        tone="tinted"
      />
      <CtaBand
        tone="tinted"
        layout="split"
        title="More than 200 people on the rota?"
        description="We will set up your sites, roles and payroll with you, and price it for your group."
        primary={DEMO}
      />
    </>
  );
}
