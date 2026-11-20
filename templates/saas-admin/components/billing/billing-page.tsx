'use client';

import type { BillingPlan } from '@rectio/blocks';
import { Billing, PricingTable } from '@rectio/blocks/motion';
import { Tabs, TabsList, TabsPanel, TabsTab, useToast } from '@rectio/ui';
import { useState } from 'react';

import {
  BILLING_INVOICES,
  PAYMENT_METHOD,
  PLAN,
  PLANS,
  PLAN_FEATURES,
  USAGE,
} from '@/data/account';
import { CURRENCY, LOCALE, TODAY } from '@/data/workspace';
import { PageHeader } from '../page-header';
import { ErrorPanel, LoadingPanel, LoadingRegion } from '../states/state-views';
import { usePageState } from '../use-page-state';

/** The workspace's plan, usage, card and invoices, and the plans to move to. */
export function BillingPage() {
  const state = usePageState();
  const toast = useToast();
  const [tab, setTab] = useState<'overview' | 'plans'>('overview');
  const [plan, setPlan] = useState<BillingPlan>(PLAN);
  // A new workspace is on a trial with nothing used and nothing invoiced yet.
  const trial = state === 'empty';
  const shownPlan: BillingPlan = trial
    ? { ...PLAN, id: 'team', name: 'Team', price: 147, status: 'trialing', seats: 3 }
    : plan;

  return (
    <>
      <PageHeader title="Billing" description="Billed monthly in US dollars" />
      {state === 'loading' ? (
        <LoadingRegion label="Loading billing">
          <LoadingPanel kind="figures" />
          <LoadingPanel kind="table" rows={5} columns={4} />
        </LoadingRegion>
      ) : state === 'error' ? (
        <ErrorPanel title="Billing did not load" />
      ) : (
        <Tabs
          value={tab}
          onValueChange={(value: 'overview' | 'plans') => {
            setTab(value);
          }}
        >
          <TabsList>
            <TabsTab value="overview">Plan and invoices</TabsTab>
            <TabsTab value="plans">Compare plans</TabsTab>
          </TabsList>
          <TabsPanel value="overview">
            <Billing
              plan={shownPlan}
              usage={trial ? USAGE.map((u) => ({ ...u, used: 0 })) : USAGE}
              paymentMethod={trial ? undefined : PAYMENT_METHOD}
              invoices={trial ? [] : BILLING_INVOICES}
              currency={CURRENCY}
              locale={LOCALE}
              today={TODAY}
              onChangePlan={() => {
                setTab('plans');
              }}
              onCancelPlan={() => {
                toast.add({
                  title: 'Talk to us before you go',
                  description: 'Cancelling keeps your data for 30 days.',
                });
              }}
              onUpdatePaymentMethod={() => {
                toast.add({ title: 'Card form opens with your payment provider' });
              }}
              onDownloadInvoice={(invoice) => {
                toast.add({ title: `Downloading ${invoice.number}` });
              }}
              onAddSeats={() => {
                toast.add({ title: 'Add seats', description: 'Each seat is $99 a month.' });
              }}
            />
          </TabsPanel>
          <TabsPanel value="plans">
            <PricingTable
              title="Plans"
              description="Prices per agent. Paying yearly saves about a fifth."
              plans={PLANS}
              features={PLAN_FEATURES}
              currency={CURRENCY}
              locale={LOCALE}
              currentPlanId={shownPlan.id}
              onSelectPlan={(next, cycle) => {
                setPlan({
                  ...plan,
                  id: next.id,
                  name: next.name,
                  price: (cycle === 'yearly' ? next.yearly : next.monthly) ?? plan.price,
                  interval: cycle === 'yearly' ? 'year' : 'month',
                });
                setTab('overview');
                toast.add({
                  type: 'success',
                  title: `Moved to ${next.name}`,
                  description: 'The change shows on your next invoice, prorated.',
                });
              }}
            />
          </TabsPanel>
        </Tabs>
      )}
    </>
  );
}
