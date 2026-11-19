import {
  ArrowsClockwiseIcon,
  CreditCardIcon,
  DownloadSimpleIcon,
  PlusIcon,
  WarningCircleIcon,
} from '@phosphor-icons/react';
import { Badge, cn } from '@rectio/ui';

import { useBlockParts } from '../../lib/block-parts';
import { BlockPanel } from '../../lib/block-panel';
import { EmptyNote } from '../../lib/empty-note';
import { formatLongDate, formatShortDate, resolveLocale } from '../../lib/finance';
import { StateBadge } from '../../lib/state-badge';
import { useNow } from '../lib/focus';
import { UsageMeter } from '../lib/meter';
import { numberFormat, plural } from '../lib/saas';
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
  /** Offered as "Add seats" under the seats meter (id or unit `seats`) once every seat is taken. */
  onAddSeats?: () => void;
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
  today: requestedToday,
  onChangePlan,
  onCancelPlan,
  onUpdatePaymentMethod,
  onDownloadInvoice,
  onAddSeats,
  title = 'Billing',
  className,
}: BillingProps) {
  const locale = resolveLocale(requestedLocale);
  const today = useNow(requestedToday);
  const { Button, Money } = useBlockParts();
  const status = PLAN_STATUS[plan.status];
  const days = billingDaysLeft(plan, today);
  const renewal = formatLongDate(plan.renewsOn, locale);
  const totals = billingInvoiceTotals(invoices, currency);
  const card = paymentMethod === undefined ? null : billingCardState(paymentMethod, today);
  // During a trial nothing is charged yet, so an expiring card is not yet a call to act.
  const cardUrgent = plan.status !== 'trialing' && card !== 'ok';

  const renewalText =
    plan.status === 'canceled'
      ? `Access ends on ${renewal}`
      : plan.status === 'trialing'
        ? `Trial ends on ${renewal}, in ${plural(days, 'day')}`
        : `Renews on ${renewal}, in ${plural(days, 'day')}`;

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
        <div className="flex flex-col gap-3 @3xl:col-span-2 @3xl:border-e @3xl:border-line @3xl:pe-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-col">
              <span className="text-sm text-fg-muted">Current plan</span>
              <span className="font-display text-lg font-heading tracking-tight">{plan.name}</span>
            </div>
            <Badge tone={status.tone}>{status.label}</Badge>
          </div>
          <div className="flex flex-col gap-0.5">
            <p className="flex flex-wrap items-baseline gap-x-1.5">
              <Money
                amount={plan.price}
                currency={currency}
                locale={locale}
                className="text-2xl font-heading tracking-tight"
              />
              <span className="text-sm text-fg-muted">
                per {INTERVAL_WORDS[plan.interval]}
                {plan.seats !== undefined && `, ${plural(plan.seats, 'seat')} included`}
              </span>
            </p>
            <p className="text-sm text-fg-muted">{renewalText}</p>
          </div>
          {(onChangePlan !== undefined || onCancelPlan !== undefined) && (
            // On a wide block the actions sit at the column foot, level with the last meter.
            <div className="flex flex-wrap gap-2 pt-1 pointer-coarse:gap-3 @3xl:mt-auto">
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
          <h3 className="text-sm font-medium text-fg-muted">
            {usage.length === 0 && plan.status === 'trialing' ? 'Your trial' : 'Usage this period'}
          </h3>
          {usage.length === 0 ? (
            plan.status === 'trialing' ? (
              <div className="flex flex-col gap-1">
                <p className="font-display text-xl font-heading tracking-tight">
                  {plural(days, 'day')} left in your trial
                </p>
                <p className="text-sm text-fg-muted">
                  Everything in {plan.name} is open until then. The first charge,{' '}
                  <Money amount={plan.price} currency={currency} locale={locale} />, is on {renewal}
                  .
                </p>
              </div>
            ) : (
              <p className="text-sm text-fg-muted">This plan has no metered allowances.</p>
            )
          ) : (
            <div className="flex flex-col gap-5">
              {usage.map((item) => {
                const level = billingUsageLevel(item.used, item.limit);
                const format = numberFormat(locale);
                const seatsFull =
                  onAddSeats !== undefined &&
                  (item.id === 'seats' || item.unit === 'seats') &&
                  item.limit > 0 &&
                  item.used >= item.limit;
                return (
                  <div key={item.id} className="flex flex-col items-start gap-1">
                    <UsageMeter
                      className="w-full"
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
                          : `on ${formatLongDate(item.resetsOn, locale)}`,
                      )}
                    />
                    {seatsFull && (
                      <Button variant="secondary" size="sm" className="mt-1" onClick={onAddSeats}>
                        <PlusIcon aria-hidden weight="bold" className="size-4" />
                        Add seats
                      </Button>
                    )}
                  </div>
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
                  cardUrgent && card === 'expiring' && 'text-warning-strong',
                  cardUrgent && card === 'expired' && 'text-negative-strong',
                )}
              >
                {paymentMethod.expMonth !== undefined && paymentMethod.expYear !== undefined ? (
                  <>
                    {cardUrgent && (
                      <WarningCircleIcon
                        aria-hidden
                        weight="bold"
                        className="me-1 inline size-3.5 align-text-bottom"
                      />
                    )}
                    {card === 'expired' ? 'Expired' : 'Expires'}{' '}
                    <span className="numeric">
                      {String(paymentMethod.expMonth).padStart(2, '0')}/{paymentMethod.expYear}
                    </span>
                    {cardUrgent && card === 'expiring' && ', update it before the next charge'}
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
          <ul aria-label="Invoices" className="flex flex-col">
            {invoices.map((invoice) => {
              const state = INVOICE_STATE[invoice.status];
              return (
                <li
                  key={invoice.id}
                  className="flex items-center gap-3 py-2 not-last:border-b not-last:border-line pointer-coarse:gap-4"
                >
                  <span className="flex min-w-0 flex-1 flex-col @md:flex-row @md:items-baseline @md:gap-4">
                    <span className="font-medium numeric">{invoice.number}</span>
                    <span className="flex items-center gap-2 text-sm text-fg-muted">
                      <span className="numeric">{formatShortDate(invoice.date, locale)}</span>
                      {/* Narrow: a compact badge beside the date, icon and word, never colour alone. */}
                      <span className="inline-flex @md:hidden">
                        <StateBadge state={state.state} label={state.label} />
                      </span>
                    </span>
                  </span>
                  <span className="hidden @md:inline-flex">
                    <StateBadge state={state.state} label={state.label} />
                  </span>
                  <Money
                    amount={invoice.amount}
                    currency={currency}
                    locale={locale}
                    className={cn(invoice.status === 'void' && 'text-fg-muted line-through')}
                  />
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
