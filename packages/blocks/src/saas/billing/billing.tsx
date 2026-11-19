import {
  ArrowsClockwiseIcon,
  CreditCardIcon,
  DownloadSimpleIcon,
  WarningCircleIcon,
} from '@phosphor-icons/react';
import { Badge, cn } from '@rectio/ui';

import { useBlockParts } from '../../lib/block-parts';
import { BlockPanel } from '../../lib/block-panel';
import { EmptyNote } from '../../lib/empty-note';
import { formatLongDate, formatShortDate, resolveLocale } from '../../lib/finance';
import { StateBadge } from '../../lib/state-badge';
import { UsageMeter } from '../lib/meter';
import {
  billingCardState,
  billingDaysLeft,
  billingInvoiceTotals,
  billingUsageLevel,
  billingUsageNote,
  type BillingInvoice,
  type BillingPaymentMethod,
  type BillingPlan,
  type BillingUsage,
} from './billing.logic';

export interface BillingProps {
  plan: BillingPlan;
  usage?: readonly BillingUsage[];
  paymentMethod?: BillingPaymentMethod | undefined;
  /** Newest first, as they are listed. */
  invoices?: readonly BillingInvoice[];
  /** ISO 4217 code of the plan and its invoices. */
  currency: string;
  locale?: string;
  /** The day renewals and card expiry are measured from. */
  today?: Date;
  onChangePlan?: () => void;
  onCancelPlan?: () => void;
  onUpdatePaymentMethod?: () => void;
  onDownloadInvoice?: (invoice: BillingInvoice) => void;
  title?: string;
  className?: string;
}

const INTERVAL_WORDS = { month: 'month', year: 'year' } as const;

const PLAN_STATUS = {
  active: { label: 'Active', tone: 'positive' },
  trialing: { label: 'Trial', tone: 'info' },
  'past-due': { label: 'Payment due', tone: 'negative' },
  canceled: { label: 'Canceled', tone: 'neutral' },
} as const;

const INVOICE_STATE = {
  paid: { state: 'paid', label: 'Paid' },
  open: { state: 'due', label: 'Open' },
  failed: { state: 'overdue', label: 'Failed' },
  void: { state: 'void', label: 'Void' },
} as const;

/**
 * The account's money in one place: the plan and when it renews, how much of each allowance is
 * used, the card on file and every invoice. The block reads only; changing the plan, the card or
 * downloading an invoice goes to your callbacks.
 */
export function Billing({
  plan,
  usage = [],
  paymentMethod,
  invoices = [],
  currency,
  locale: requestedLocale,
  today = new Date(),
  onChangePlan,
  onCancelPlan,
  onUpdatePaymentMethod,
  onDownloadInvoice,
  title = 'Billing',
  className,
}: BillingProps) {
  const locale = resolveLocale(requestedLocale);
  const { Button, Money } = useBlockParts();
  const status = PLAN_STATUS[plan.status];
  const days = billingDaysLeft(plan, today);
  const renewal = formatLongDate(plan.renewsOn, locale);
  const totals = billingInvoiceTotals(invoices, currency);
  const card = paymentMethod === undefined ? null : billingCardState(paymentMethod, today);

  const renewalText =
    plan.status === 'canceled'
      ? `Access ends on ${renewal}`
      : plan.status === 'trialing'
        ? `Trial ends on ${renewal}, ${days === 1 ? 'in 1 day' : `in ${String(days)} days`}`
        : `Renews on ${renewal}, ${days === 1 ? 'in 1 day' : `in ${String(days)} days`}`;

  return (
    <BlockPanel
      title={title}
      description={`${plan.name} plan, ${status.label.toLowerCase()}`}
      className={className}
      bodyClassName="gap-6"
    >
      {plan.status === 'past-due' && (
        <p
          role="alert"
          className="flex items-start gap-2.5 rounded-control border border-negative-strong/25 bg-negative-subtle px-3 py-2.5 text-sm text-negative-strong"
        >
          <WarningCircleIcon aria-hidden weight="bold" className="mt-0.5 size-4 shrink-0" />
          <span>
            <span className="font-medium">The last payment did not go through.</span>{' '}
            <span className="text-fg-muted">
              Update the card on file to keep the workspace running
              {totals.owed > 0 && (
                <>
                  ; <Money amount={totals.owed} currency={currency} locale={locale} /> is owed
                </>
              )}
              .
            </span>
          </span>
        </p>
      )}

      <div className="grid gap-6 @3xl:grid-cols-5">
        {/* The plan: the one figure that matters, then when it moves. */}
        <div className="flex flex-col gap-4 rounded-control border border-line bg-surface-sunken p-4 @3xl:col-span-2">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-col">
              <span className="text-sm text-fg-muted">Current plan</span>
              <span className="font-display text-xl font-heading tracking-tight">{plan.name}</span>
            </div>
            <Badge tone={status.tone}>{status.label}</Badge>
          </div>
          <p className="flex flex-wrap items-baseline gap-x-1.5">
            <Money
              amount={plan.price}
              currency={currency}
              locale={locale}
              quietCurrency
              className="text-3xl font-strong tracking-tight"
            />
            <span className="text-sm text-fg-muted">
              per {INTERVAL_WORDS[plan.interval]}
              {plan.seats !== undefined && `, ${String(plan.seats)} seats included`}
            </span>
          </p>
          <p className="text-sm text-fg-muted">{renewalText}</p>
          {(onChangePlan !== undefined || onCancelPlan !== undefined) && (
            <div className="mt-auto flex flex-wrap gap-2 pointer-coarse:gap-3">
              {onChangePlan !== undefined && (
                <Button variant="secondary" onClick={onChangePlan}>
                  <ArrowsClockwiseIcon aria-hidden weight="bold" className="size-4" />
                  Change plan
                </Button>
              )}
              {onCancelPlan !== undefined && plan.status !== 'canceled' && (
                <Button variant="ghost" className="text-fg-muted" onClick={onCancelPlan}>
                  Cancel plan
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Usage against the allowances. */}
        <div className="flex flex-col gap-4 @3xl:col-span-3">
          <h3 className="text-sm font-medium text-fg-muted">Usage this period</h3>
          {usage.length === 0 ? (
            <p className="text-sm text-fg-muted">This plan has no metered allowances.</p>
          ) : (
            <div className="flex flex-col gap-5">
              {usage.map((item) => {
                const level = billingUsageLevel(item.used, item.limit);
                const format = new Intl.NumberFormat(locale);
                return (
                  <UsageMeter
                    key={item.id}
                    label={item.label}
                    value={item.used}
                    max={item.limit}
                    level={level}
                    valueText={`${format.format(item.used)} of ${format.format(item.limit)} ${item.unit}`}
                    note={billingUsageNote(
                      item,
                      locale,
                      item.resetsOn === undefined
                        ? null
                        : `on ${formatShortDate(item.resetsOn, locale)}`,
                    )}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      {paymentMethod !== undefined && card !== null && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
          <div className="flex min-w-0 items-center gap-3">
            <span
              aria-hidden
              className="inline-flex h-8 w-11 shrink-0 items-center justify-center rounded-badge border border-line-strong bg-surface-raised text-fg-muted"
            >
              <CreditCardIcon weight="bold" className="size-4" />
            </span>
            <div className="flex min-w-0 flex-col">
              <span className="font-medium">
                {paymentMethod.brand} ending <span className="numeric">{paymentMethod.last4}</span>
              </span>
              <span
                className={cn(
                  'text-sm text-fg-muted',
                  card === 'expiring' && 'text-warning-strong',
                  card === 'expired' && 'text-negative-strong',
                )}
              >
                {paymentMethod.expMonth !== undefined && paymentMethod.expYear !== undefined ? (
                  <>
                    {card === 'expired' ? 'Expired' : 'Expires'}{' '}
                    <span className="numeric">
                      {String(paymentMethod.expMonth).padStart(2, '0')}/{paymentMethod.expYear}
                    </span>
                    {card === 'expiring' && ', update it before the next charge'}
                  </>
                ) : (
                  'Charged on each renewal'
                )}
              </span>
            </div>
          </div>
          {onUpdatePaymentMethod !== undefined && (
            <Button variant="secondary" size="sm" onClick={onUpdatePaymentMethod}>
              Update payment method
            </Button>
          )}
        </div>
      )}

      <div className="flex flex-col gap-2 border-t border-line pt-5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3">
          <h3 className="text-sm font-medium text-fg-muted">Invoices</h3>
          {invoices.length > 0 && (
            <span className="text-sm text-fg-subtle">
              <Money amount={totals.paid} currency={currency} locale={locale} /> paid
              {totals.owedCount > 0 && (
                <>
                  , <Money amount={totals.owed} currency={currency} locale={locale} /> owed
                </>
              )}
            </span>
          )}
        </div>
        {invoices.length === 0 ? (
          <EmptyNote title="No invoices yet">
            Your first invoice appears here after the first charge, on {renewal}.
          </EmptyNote>
        ) : (
          <ul aria-label="Invoices" className="-mx-2 flex flex-col">
            {invoices.map((invoice) => {
              const state = INVOICE_STATE[invoice.status];
              return (
                <li
                  key={invoice.id}
                  className="flex items-center gap-3 rounded-control px-2 py-2 not-last:border-b not-last:border-line"
                >
                  <span className="flex min-w-0 flex-1 flex-col @md:flex-row @md:items-baseline @md:gap-4">
                    <span className="font-medium numeric">{invoice.number}</span>
                    <span className="text-sm text-fg-muted numeric">
                      {formatShortDate(invoice.date, locale)}
                    </span>
                  </span>
                  <span className="hidden @md:inline-flex">
                    <StateBadge state={state.state} label={state.label} />
                  </span>
                  <span className="flex flex-col items-end gap-1">
                    <Money
                      amount={invoice.amount}
                      currency={currency}
                      locale={locale}
                      className={cn(invoice.status === 'void' && 'text-fg-muted line-through')}
                    />
                    <span className="@md:hidden">
                      <StateBadge state={state.state} label={state.label} />
                    </span>
                  </span>
                  {onDownloadInvoice !== undefined && (
                    <Button
                      variant="ghost"
                      size="sm"
                      iconOnly
                      aria-label={`Download ${invoice.number}`}
                      onClick={() => {
                        onDownloadInvoice(invoice);
                      }}
                    >
                      <DownloadSimpleIcon aria-hidden weight="bold" className="size-4" />
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </BlockPanel>
  );
}
