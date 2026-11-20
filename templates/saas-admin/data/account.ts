import type {
  ApiKey,
  ApiKeyScopeOption,
  AppNotification,
  BillingInvoice,
  BillingPaymentMethod,
  BillingPlan,
  BillingUsage,
  ChangelogRelease,
  NotificationChannel,
  NotificationEvent,
  NotificationMatrix,
  PricingFeature,
  PricingPlan,
} from '@rectio/blocks';

import { at, minutesAgo } from './workspace';

// Notifications ------------------------------------------------------------------------------

export const NOTIFICATIONS: readonly AppNotification[] = [
  {
    id: 'n1',
    kind: 'assigned',
    title: 'CPL-2147 was assigned to you',
    body: 'Card payments fail for customers paying by Apple Pay. Tern Bay Pools, urgent.',
    at: minutesAgo(12),
    read: false,
    actor: { name: 'Tomás Rivera' },
  },
  {
    id: 'n2',
    kind: 'mention',
    title: 'Priya mentioned you on CPL-2141',
    body: '“The QuickBooks token expired with the password change. Can you approve a reconnect email?”',
    at: minutesAgo(26),
    read: false,
    actor: { name: 'Priya Natarajan' },
  },
  {
    id: 'n3',
    kind: 'system',
    title: 'Halden Roofing rated a reply 2 of 5',
    body: 'On CPL-2143: “Third time I am explaining this.”',
    at: minutesAgo(48),
    read: false,
  },
  {
    id: 'n4',
    kind: 'invite',
    title: 'Freya Lund has not accepted her invite',
    body: 'It expires in 6 days. Resend it from the team page.',
    at: minutesAgo(60 * 4),
    read: true,
  },
  {
    id: 'n5',
    kind: 'security',
    title: 'Sign-in blocked for yuki@copperline.app',
    body: 'A sign-in from Lisbon, Portugal was stopped because two-factor is not set up.',
    at: minutesAgo(60 * 3),
    read: true,
  },
  {
    id: 'n6',
    kind: 'billing',
    title: 'Invoice LW-2026-0311 was paid',
    body: '$1,188.00, charged to the Visa ending 4242.',
    at: minutesAgo(60 * 22),
    read: true,
  },
  {
    id: 'n7',
    kind: 'comment',
    title: 'Kwame replied on CPL-2135',
    body: 'Merged the duplicates; sending Dev the list of the 12 that need a manual look.',
    at: minutesAgo(60 * 26),
    read: true,
    actor: { name: 'Kwame Asante' },
  },
];

export const NOTIFICATION_CHANNELS: readonly NotificationChannel[] = [
  { id: 'app', label: 'In the app' },
  { id: 'email', label: 'Email' },
  { id: 'mobile', label: 'Mobile push' },
];

export const NOTIFICATION_EVENTS: readonly NotificationEvent[] = [
  {
    id: 'assigned',
    label: 'A ticket is assigned to me',
    group: 'Tickets',
    required: ['app'],
  },
  { id: 'mention', label: 'Someone mentions me', group: 'Tickets', required: ['app'] },
  {
    id: 'reply',
    label: 'A customer replies on my ticket',
    group: 'Tickets',
  },
  {
    id: 'sla',
    label: 'A ticket is about to miss its target',
    description: '30 minutes before the first-response target',
    group: 'Tickets',
  },
  {
    id: 'rating',
    label: 'A customer leaves a low rating',
    description: 'Ratings of 1 or 2 out of 5',
    group: 'Customers',
  },
  { id: 'renewal', label: 'An at-risk customer is due to renew', group: 'Customers' },
  { id: 'members', label: 'Members join or leave', group: 'Workspace' },
  {
    id: 'security',
    label: 'Blocked sign-ins and new devices',
    group: 'Workspace',
    required: ['email'],
  },
  { id: 'billing', label: 'Invoices and payment problems', group: 'Workspace' },
];

export const NOTIFICATION_DEFAULTS: NotificationMatrix = {
  assigned: ['app', 'email', 'mobile'],
  mention: ['app', 'mobile'],
  reply: ['app'],
  sla: ['app', 'mobile'],
  rating: ['app', 'email'],
  renewal: ['email'],
  members: ['app'],
  security: ['app', 'email'],
  billing: ['email'],
};

export const NOTIFICATION_RECOMMENDED: NotificationMatrix = {
  ...NOTIFICATION_DEFAULTS,
  reply: ['app', 'mobile'],
  members: ['app', 'email'],
};

// Billing ------------------------------------------------------------------------------------

export const PLAN: BillingPlan = {
  id: 'business',
  name: 'Business',
  // 12 seats at $99.
  price: 1_188,
  interval: 'month',
  status: 'active',
  renewsOn: at(12, 1),
  seats: 12,
};

export const USAGE: readonly BillingUsage[] = [
  { id: 'seats', label: 'Agent seats', used: 10, limit: 12, unit: 'seats' },
  {
    id: 'ai',
    label: 'AI-drafted replies',
    used: 4_212,
    limit: 5_000,
    unit: 'replies',
    resetsOn: at(12, 1),
  },
  { id: 'storage', label: 'Attachment storage', used: 18.4, limit: 50, unit: 'GB' },
];

export const PAYMENT_METHOD: BillingPaymentMethod = {
  brand: 'Visa',
  last4: '4242',
  expMonth: 1,
  expYear: 2027,
};

export const BILLING_INVOICES: readonly BillingInvoice[] = [
  { id: 'b-0311', number: 'LW-2026-0311', date: at(11, 1), amount: 1_188, status: 'paid' },
  { id: 'b-0277', number: 'LW-2026-0277', date: at(10, 1), amount: 1_188, status: 'paid' },
  { id: 'b-0240', number: 'LW-2026-0240', date: at(9, 1), amount: 1_089, status: 'paid' },
  { id: 'b-0198', number: 'LW-2026-0198', date: at(8, 1), amount: 1_089, status: 'paid' },
  { id: 'b-0161', number: 'LW-2026-0161', date: at(7, 1), amount: 990, status: 'paid' },
  { id: 'b-0122', number: 'LW-2026-0122', date: at(6, 1), amount: 990, status: 'void' },
];

export const PLANS: readonly PricingPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'A shared inbox for a small team.',
    monthly: 19,
    yearly: 180,
    unit: 'per agent',
    highlights: ['Email and chat', 'Help center', '500 AI replies a month'],
  },
  {
    id: 'team',
    name: 'Team',
    description: 'Queues, targets and reports for a growing desk.',
    monthly: 49,
    yearly: 468,
    unit: 'per agent',
    highlights: ['Everything in Starter', 'First-response targets', '2,000 AI replies a month'],
  },
  {
    id: 'business',
    name: 'Business',
    description: 'Single sign-on, audit log and an API for the whole company.',
    monthly: 99,
    yearly: 948,
    unit: 'per agent',
    highlights: ['Everything in Team', 'SSO and audit log', '5,000 AI replies a month'],
    recommended: true,
  },
];

export const PLAN_FEATURES: readonly PricingFeature[] = [
  {
    id: 'channels',
    label: 'Channels',
    group: 'Desk',
    values: { starter: 'Email, chat', team: 'Email, chat, phone', business: 'All, plus API' },
  },
  {
    id: 'targets',
    label: 'First-response targets',
    group: 'Desk',
    values: { starter: false, team: true, business: true },
  },
  {
    id: 'ai',
    label: 'AI-drafted replies a month',
    group: 'Desk',
    values: { starter: '500', team: '2,000', business: '5,000' },
  },
  {
    id: 'storage',
    label: 'Attachment storage',
    group: 'Desk',
    values: { starter: '5 GB', team: '20 GB', business: '50 GB' },
  },
  {
    id: 'sso',
    label: 'Single sign-on',
    group: 'Security',
    values: { starter: false, team: false, business: true },
  },
  {
    id: 'audit',
    label: 'Audit log',
    group: 'Security',
    values: { starter: false, team: '30 days', business: '1 year' },
  },
];

// API keys -----------------------------------------------------------------------------------

export const API_SCOPES: readonly ApiKeyScopeOption[] = [
  { value: 'read', label: 'Read only', description: 'Tickets, customers and reports' },
  {
    value: 'write',
    label: 'Read and write',
    description: 'Create and update tickets and customers',
  },
  {
    value: 'admin',
    label: 'Full access',
    description: 'Everything, including members and webhooks',
    elevated: true,
  },
];

export const API_KEYS: readonly ApiKey[] = [
  {
    id: 'k1',
    name: 'Copperline app, ticket widget',
    prefix: 'lw_live_7Hc2',
    scope: 'write',
    createdAt: at(3, 2),
    lastUsedAt: minutesAgo(1),
  },
  {
    id: 'k2',
    name: 'Data warehouse export',
    prefix: 'lw_live_Qm8x',
    scope: 'read',
    createdAt: at(6, 18),
    lastUsedAt: minutesAgo(60 * 7),
    expiresAt: at(12, 9),
  },
  {
    id: 'k3',
    name: 'Status page integration',
    prefix: 'lw_live_b41T',
    scope: 'read',
    createdAt: at(9, 30),
    lastUsedAt: minutesAgo(60 * 24 * 2),
  },
  {
    id: 'k4',
    name: 'Old Zapier connection',
    prefix: 'lw_live_Z0pe',
    scope: 'admin',
    createdAt: at(11, 3, 9, 0, 2025),
    lastUsedAt: at(8, 14),
    revokedAt: at(9, 2),
  },
];

/** Webhook endpoints the workspace sends events to. */
export const WEBHOOKS: readonly {
  id: string;
  url: string;
  events: string;
  status: 'healthy' | 'failing';
  lastDelivery: Date;
}[] = [
  {
    id: 'w1',
    url: 'https://api.copperline.app/hooks/lindwell',
    events: 'ticket.created, ticket.resolved',
    status: 'healthy',
    lastDelivery: minutesAgo(3),
  },
  {
    id: 'w2',
    url: 'https://hooks.slack.com/services/T0C9/…/support-alerts',
    events: 'ticket.escalated',
    status: 'healthy',
    lastDelivery: minutesAgo(41),
  },
  {
    id: 'w3',
    url: 'https://bi.copperline.app/ingest/csat',
    events: 'rating.created',
    status: 'failing',
    lastDelivery: minutesAgo(60 * 9),
  },
];

// Changelog ----------------------------------------------------------------------------------

export const RELEASES: readonly ChangelogRelease[] = [
  {
    id: 'r-2026-11',
    version: '2026.11',
    date: at(11, 12),
    title: 'Targets per queue',
    summary: 'Set a first-response target for each queue instead of one for the whole desk.',
    changes: [
      { kind: 'new', text: 'First-response targets per queue, with business hours per region.' },
      { kind: 'improved', text: 'The ticket board loads twice as fast on large workspaces.' },
      { kind: 'fixed', text: 'Ratings left from the mobile app now count toward satisfaction.' },
    ],
  },
  {
    id: 'r-2026-10',
    version: '2026.10',
    date: at(10, 15),
    title: 'AI-drafted replies',
    summary: 'Draft a reply from the ticket and your help center, then edit it before sending.',
    changes: [
      { kind: 'new', text: 'AI-drafted replies on the Team and Business plans.' },
      { kind: 'new', text: 'Portal users can be suspended without deleting their history.' },
      { kind: 'fixed', text: 'CSV imports keep phone numbers with a leading plus sign.' },
    ],
  },
  {
    id: 'r-2026-09',
    version: '2026.09',
    date: at(9, 10),
    changes: [{ kind: 'improved', text: 'Search finds customers by any portal user’s email.' }],
  },
];
