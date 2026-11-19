import {
  ChartLineUpIcon,
  FileTextIcon,
  GithubLogoIcon,
  LinkedinLogoIcon,
  LockKeyIcon,
  MapPinIcon,
  ChatCircleTextIcon,
  EnvelopeSimpleIcon,
  ReceiptIcon,
  ShieldCheckIcon,
  StackIcon,
  XLogoIcon,
} from '@phosphor-icons/react';
import type {
  ArticleSummary,
  CookieCategory,
  FaqItem,
  FooterColumn,
  IconFeature,
  MarketingLink,
  SocialLink,
  Stat,
  TeamMember,
  TeamValue,
  Testimonial,
} from '@rectio/blocks/marketing';

/**
 * Copy for the landing template, all of it data: swap these and the page is yours. The product,
 * the people and the figures are invented samples.
 */

export const NAV: MarketingLink[] = [
  { label: 'Product', href: '#product' },
  { label: 'Customers', href: '#customers' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Changelog', href: '#changelog' },
  { label: 'Docs', href: '#docs' },
];

export const START = { label: 'Start free', href: '#start' };
export const DEMO = { label: 'Book a demo', href: '#demo' };
export const SIGN_IN = { label: 'Sign in', href: '#sign-in' };

export const STATS: Stat[] = [
  {
    id: 'teams',
    value: 1240,
    format: 'number',
    label: 'finance teams close on Northlake',
    suffix: '+',
  },
  { id: 'invoices', value: 14200000, format: 'compact', label: 'invoices sent last year' },
  {
    id: 'close',
    value: 3.5,
    format: 'number',
    fractionDigits: 1,
    label: 'days to close, the median',
    suffix: ' days',
  },
];

export const ICON_FEATURES: IconFeature[] = [
  {
    id: 'invoices',
    icon: <ReceiptIcon weight="duotone" />,
    title: 'Invoices',
    description: 'Send, chase and match invoices without leaving the ledger.',
  },
  {
    id: 'approvals',
    icon: <ShieldCheckIcon weight="duotone" />,
    title: 'Approvals',
    description: 'Route spend to the right person with limits per team.',
  },
  {
    id: 'reporting',
    icon: <ChartLineUpIcon weight="duotone" />,
    title: 'Reporting',
    description: 'Cash, budget and aging, current to the minute.',
  },
  {
    id: 'audit',
    icon: <FileTextIcon weight="duotone" />,
    title: 'Audit trail',
    description: 'Every change recorded with who, when and why.',
  },
  {
    id: 'security',
    icon: <LockKeyIcon weight="duotone" />,
    title: 'Access control',
    description: 'Roles, single sign-on and approval limits per entity.',
  },
  {
    id: 'integrations',
    icon: <StackIcon weight="duotone" />,
    title: 'Integrations',
    description: 'Bank feeds, payroll and your CRM, connected in minutes.',
  },
];

export const TESTIMONIALS: Testimonial[] = [
  {
    id: 't1',
    quote:
      'We closed March in four days. Last year it took us eleven, and nobody worked the weekend this time.',
    name: 'Ingrid Solberg',
    role: 'Finance director',
    company: 'Halden & Co',
  },
  {
    id: 't2',
    quote: 'Approvals stopped living in my inbox. The queue just empties.',
    name: 'Rafael Ortega',
    role: 'Controller',
    company: 'Brightwater',
  },
  {
    id: 't3',
    quote: 'Our auditors asked how we built the trail. We did not build it; it was already there.',
    name: 'Mei Tanaka',
    role: 'Head of accounting',
    company: 'Kestrel Labs',
  },
  {
    id: 't4',
    quote: 'Receivables over 60 days fell by a third in one quarter.',
    name: 'Owen Gallagher',
    role: 'CFO',
    company: 'Meridian Freight',
  },
  {
    id: 't5',
    quote: 'It feels like a tool built by people who have done a month end.',
    name: 'Leila Haddad',
    role: 'Senior accountant',
    company: 'Orchard Health',
  },
  {
    id: 't6',
    quote: 'Setup took an afternoon. The bank feed was matching by dinner.',
    name: 'Bartek Nowicki',
    role: 'Operations lead',
    company: 'Vantor',
  },
];

/** The quote the single-testimonial gallery shows, a different voice from the landing's lead. */
export const FEATURED_QUOTE: Testimonial = {
  id: 't4',
  quote: 'Receivables over 60 days fell by a third in one quarter.',
  name: 'Owen Gallagher',
  role: 'CFO',
  company: 'Meridian Freight',
};

export const FAQ: FaqItem[] = [
  {
    id: 'f1',
    question: 'How long does it take to set up?',
    answer:
      'Most teams connect their bank and import open invoices in an afternoon. We help you map your chart of accounts on a call.',
  },
  {
    id: 'f2',
    question: 'Can we keep our current accounting system?',
    answer:
      'Yes. Northlake syncs both ways with the major ledgers, so your accountant keeps working where they work today.',
  },
  {
    id: 'f3',
    question: 'Which currencies and tax rules do you support?',
    answer:
      'Every ISO currency, with VAT per rate for the EU and the UK. Multi-entity groups can consolidate in one reporting currency.',
  },
  {
    id: 'f4',
    question: 'Where is our data stored?',
    answer:
      'In the EU, encrypted at rest and in transit. You can export everything at any time, in open formats.',
  },
  {
    id: 'f5',
    question: 'What happens when our trial ends?',
    answer:
      'Nothing is deleted. Choose a plan to keep going, or export your data and leave; there is no card needed to start.',
  },
];

export const FOOTER_COLUMNS: FooterColumn[] = [
  {
    id: 'product',
    title: 'Product',
    links: [
      { label: 'Invoices', href: '#invoices' },
      { label: 'Approvals', href: '#approvals' },
      { label: 'Close', href: '#close' },
      { label: 'Pricing', href: '#pricing' },
    ],
  },
  {
    id: 'company',
    title: 'Company',
    links: [
      { label: 'About', href: '#about' },
      { label: 'Customers', href: '#customers' },
      { label: 'Careers', href: '#careers' },
      { label: 'Contact', href: '#contact' },
    ],
  },
  {
    id: 'resources',
    title: 'Resources',
    links: [
      { label: 'Docs', href: '#docs' },
      { label: 'Changelog', href: '#changelog' },
      { label: 'Blog', href: '#blog' },
      { label: 'Status', href: '#status' },
    ],
  },
];

export const LEGAL_LINKS: MarketingLink[] = [
  { label: 'Privacy', href: '#privacy' },
  { label: 'Terms', href: '#terms' },
  { label: 'Cookies', href: '#cookies' },
];

export const SOCIAL: SocialLink[] = [
  { label: 'Northlake on LinkedIn', href: 'https://www.linkedin.com', icon: <LinkedinLogoIcon /> },
  { label: 'Northlake on X', href: 'https://x.com', icon: <XLogoIcon /> },
  { label: 'Northlake on GitHub', href: 'https://github.com', icon: <GithubLogoIcon /> },
];

export const COOKIE_CATEGORIES: CookieCategory[] = [
  {
    id: 'necessary',
    title: 'Necessary',
    description:
      'Keep you signed in and remember this choice. The site does not work without them.',
    required: true,
  },
  {
    id: 'analytics',
    title: 'Analytics',
    description: 'Count visits and see which pages help, without identifying you.',
  },
  {
    id: 'marketing',
    title: 'Marketing',
    description: 'Measure our campaigns on other sites.',
  },
];

export const TEAM: TeamMember[] = [
  {
    id: 'm1',
    name: 'Ingrid Solberg',
    role: 'Co-founder, CEO',
    bio: 'Ran finance at two scale-ups before starting Northlake.',
  },
  {
    id: 'm2',
    name: 'Tomás Rivera',
    role: 'Co-founder, CTO',
    bio: 'Builds the ledger engine and its audit trail.',
  },
  {
    id: 'm3',
    name: 'Amara Okafor',
    role: 'Head of design',
    bio: 'Makes month end feel calm, one screen at a time.',
  },
  {
    id: 'm4',
    name: 'Jonas Becker',
    role: 'Head of customer success',
    bio: 'Has onboarded more than four hundred finance teams.',
  },
];

export const VALUES: TeamValue[] = [
  {
    id: 'v1',
    title: 'Exact before fast',
    description: 'Every figure is right to the cent, then we make it quick.',
  },
  {
    id: 'v2',
    title: 'Calm by default',
    description: 'No red alerts for things that can wait until Monday.',
  },
  {
    id: 'v3',
    title: 'Your data, your exit',
    description: 'Open formats and a full export, always.',
  },
];

export const CHANNELS = [
  {
    id: 'sales',
    label: 'Sales',
    value: 'sales@northlake.example',
    href: 'mailto:sales@northlake.example',
    icon: <EnvelopeSimpleIcon />,
  },
  {
    id: 'support',
    label: 'Support, weekdays 8 to 18 CET',
    value: 'Chat in the app',
    icon: <ChatCircleTextIcon />,
  },
  { id: 'office', label: 'Office', value: 'Torggata 5, 0181 Oslo', icon: <MapPinIcon /> },
];

export const ARTICLES: ArticleSummary[] = [
  {
    id: 'a1',
    title: 'How Halden closed March in four days',
    href: '#a1',
    excerpt:
      'A finance team of five, three entities and one rule: nothing waits for the last day. Here is the checklist they use.',
    date: '2026-03-12',
    author: { name: 'Leila Haddad' },
    tag: 'Customer story',
    readingMinutes: 7,
  },
  {
    id: 'a2',
    title: 'Accruals without the spreadsheet',
    href: '#a2',
    excerpt: 'Recurring accruals that post themselves and reverse on the first of the month.',
    date: '2026-02-26',
    author: { name: 'Tomás Rivera' },
    tag: 'Product',
    readingMinutes: 4,
  },
  {
    id: 'a3',
    title: 'What auditors look for in an approval trail',
    href: '#a3',
    excerpt:
      'Who approved, against which limit, and what changed after. A short guide with examples.',
    date: '2026-02-09',
    author: { name: 'Mei Tanaka' },
    tag: 'Guide',
    readingMinutes: 6,
  },
  {
    id: 'a4',
    title: 'Multi-currency VAT, explained with one invoice',
    href: '#a4',
    excerpt: 'One invoice in three currencies and two VAT rates, followed from issue to payment.',
    date: '2026-01-21',
    author: { name: 'Owen Gallagher' },
    tag: 'Guide',
    readingMinutes: 5,
  },
];
