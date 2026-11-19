import { roundMoney } from '../../lib/finance';

export type PricingCycle = 'monthly' | 'yearly';

export interface PricingPlan {
  id: string;
  name: string;
  /** One line on who the plan is for. */
  description?: string;
  /** Price per month on monthly billing, in major units; null for a plan priced on request. */
  monthly: number | null;
  /** Price for a whole year on yearly billing; omit when the plan is monthly only. */
  yearly?: number;
  /** "per seat", shown after the price. */
  unit?: string;
  /** Three to six lines of what the plan adds, shown on its card. */
  highlights?: readonly string[];
  /** The label of the plan's button, such as "Start free trial". */
  cta?: string;
  /** Drawn forward of the others, with a "Recommended" mark. One plan at most. */
  recommended?: boolean;
}

export interface PricingFeature {
  id: string;
  label: string;
  /** Features with the same group sit under one heading in the comparison. */
  group?: string;
  /** Per plan id: included, not included, or a value such as "10 GB" or "Unlimited". */
  values: Readonly<Record<string, boolean | string>>;
}

/** What a plan costs per month on a cycle: the yearly price spread over twelve months. */
export function pricingMonthlyPrice(
  plan: PricingPlan,
  cycle: PricingCycle,
  currency: string,
): number | null {
  if (plan.monthly === null) return null;
  if (cycle === 'yearly' && plan.yearly !== undefined)
    return roundMoney(plan.yearly / 12, currency);
  return plan.monthly;
}

/**
 * A price as it reads on a pricing page: whole amounts without the cents ("€20"), others to the
 * currency's minor unit ("€39.17").
 */
export function pricingPriceText(amount: number, currency: string, locale: string): string {
  const whole = Number.isInteger(amount);
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    ...(whole ? { minimumFractionDigits: 0, maximumFractionDigits: 0 } : {}),
  }).format(amount);
}

/** The share saved by paying yearly, such as 0.17 for 17 per cent; 0 when there is no saving. */
export function pricingYearlySaving(plan: PricingPlan): number {
  if (plan.monthly === null || plan.monthly <= 0 || plan.yearly === undefined) return 0;
  return Math.max(0, 1 - plan.yearly / (plan.monthly * 12));
}

/** The largest saving any plan offers, for the cycle switch. */
export function pricingBestSaving(plans: readonly PricingPlan[]): number {
  return plans.reduce((best, plan) => Math.max(best, pricingYearlySaving(plan)), 0);
}

export interface PricingFeatureGroup {
  name: string | null;
  features: PricingFeature[];
}

export function groupPricingFeatures(features: readonly PricingFeature[]): PricingFeatureGroup[] {
  const groups: PricingFeatureGroup[] = [];
  for (const feature of features) {
    const name = feature.group ?? null;
    const group = groups.find((g) => g.name === name);
    if (group === undefined) groups.push({ name, features: [feature] });
    else group.features.push(feature);
  }
  return groups;
}
