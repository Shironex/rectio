/**
 * Plans and prices. Prices are per person per month in minor units (cents), so the page never
 * does float arithmetic on money; yearly prices are the monthly equivalent when billed yearly.
 */

export type Billing = 'monthly' | 'yearly';

export interface Plan {
  id: 'free' | 'team' | 'business';
  name: string;
  summary: string;
  price: Record<Billing, number>;
  /** People included before the per-person price applies; null for no limit. */
  limit: number | null;
  cta: { label: string; href: string };
  featured?: boolean;
  /** The headline features, in the card. The full list is in the comparison. */
  highlights: readonly string[];
}

export const CURRENCY = 'EUR';
export const LOCALE = 'en-IE';

export const PLANS: readonly Plan[] = [
  {
    id: 'free',
    name: 'Free',
    summary: 'For a small team with one site.',
    price: { monthly: 0, yearly: 0 },
    limit: 10,
    cta: { label: 'Start free', href: 'https://app.rostra.example/sign-up' },
    highlights: ['Up to 10 people', 'One site', 'Rota builder and app', 'Shift swaps'],
  },
  {
    id: 'team',
    name: 'Team',
    summary: 'For growing teams that plan every week.',
    price: { monthly: 350, yearly: 290 },
    limit: null,
    cta: { label: 'Start a 30 day trial', href: 'https://app.rostra.example/sign-up?plan=team' },
    featured: true,
    highlights: [
      'Everything in Free',
      'Up to 3 sites',
      'Open shifts and time off',
      'Text message reminders',
      'Rest and overtime checks',
    ],
  },
  {
    id: 'business',
    name: 'Business',
    summary: 'For groups with many sites and a payroll team.',
    price: { monthly: 600, yearly: 500 },
    limit: null,
    cta: { label: 'Book a demo', href: '/contact' },
    highlights: [
      'Everything in Team',
      'Unlimited sites',
      'Payroll sync',
      'Single sign-on and audit log',
      'A named onboarding lead',
    ],
  },
];

/** A cell of the comparison: included, not included, or a short value such as a limit. */
export type Cell = boolean | string;

export interface ComparisonGroup {
  id: string;
  title: string;
  rows: readonly { feature: string; cells: Record<Plan['id'], Cell> }[];
}

export const COMPARISON: readonly ComparisonGroup[] = [
  {
    id: 'scheduling',
    title: 'Scheduling',
    rows: [
      { feature: 'People', cells: { free: 'Up to 10', team: 'Unlimited', business: 'Unlimited' } },
      { feature: 'Sites', cells: { free: '1', team: 'Up to 3', business: 'Unlimited' } },
      { feature: 'Rota templates', cells: { free: true, team: true, business: true } },
      { feature: 'Open shift board', cells: { free: false, team: true, business: true } },
      { feature: 'Rest and overtime checks', cells: { free: false, team: true, business: true } },
    ],
  },
  {
    id: 'team',
    title: 'Your team',
    rows: [
      { feature: 'Mobile app', cells: { free: true, team: true, business: true } },
      { feature: 'Shift swaps', cells: { free: true, team: true, business: true } },
      { feature: 'Time off requests', cells: { free: false, team: true, business: true } },
      { feature: 'Text message reminders', cells: { free: false, team: true, business: true } },
    ],
  },
  {
    id: 'admin',
    title: 'Admin and security',
    rows: [
      { feature: 'Hours export', cells: { free: 'CSV', team: 'CSV', business: 'CSV and sync' } },
      { feature: 'Single sign-on', cells: { free: false, team: false, business: true } },
      { feature: 'Audit log', cells: { free: false, team: false, business: true } },
      {
        feature: 'Support',
        cells: { free: 'Help centre', team: 'Email', business: 'Named lead' },
      },
    ],
  },
];

/** What a team of `people` pays a month on a plan, in minor units; null when the plan cannot hold them. */
export function monthlyTotal(plan: Plan, billing: Billing, people: number): number | null {
  if (plan.limit !== null && people > plan.limit) return null;
  return plan.price[billing] * people;
}

/** The share saved by paying yearly, rounded to a whole percent, for the toggle's hint. */
export function yearlySaving(plan: Plan): number {
  if (plan.price.monthly === 0) return 0;
  return Math.round((1 - plan.price.yearly / plan.price.monthly) * 100);
}

export const PRICING_FAQ = [
  {
    id: 'p1',
    question: 'Who counts as a person?',
    answer:
      'Anyone with shifts on a rota in the billing period. Managers who only plan and never work a shift are free.',
  },
  {
    id: 'p2',
    question: 'Can I switch between monthly and yearly?',
    answer:
      'Yes, at any time. Moving to yearly takes effect at once with the unused month credited; moving to monthly starts when the year ends.',
  },
  {
    id: 'p3',
    question: 'What if my team grows mid month?',
    answer:
      'New people are added pro rata on your next invoice. You never pay for someone twice in a month.',
  },
  {
    id: 'p4',
    question: 'Do you offer discounts for charities?',
    answer:
      'Registered charities and schools get Team at half price. Write to us with your number.',
  },
] as const;
