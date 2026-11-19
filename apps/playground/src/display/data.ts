export const PEOPLE = [
  { name: 'Ana Ruiz', status: 'online' as const },
  { name: 'Tomasz Nowak', status: 'away' as const },
  { name: 'Lena Fischer', status: 'busy' as const },
  { name: 'Ivo Petrov' },
  { name: 'Mei Tanaka', status: 'offline' as const },
  { name: 'Omar Haddad' },
  { name: 'Sofia Conti' },
  { name: 'Jonas Berg' },
];

export const SETUP_STEPS = [
  { title: 'Company', description: 'Legal name and address' },
  { title: 'Bank account', description: 'Connect or add by IBAN' },
  { title: 'Tax settings', description: 'VAT number and rates' },
  { title: 'Invite team', description: 'Approvers and accountants' },
];

export const FAQ = [
  {
    value: 'vat',
    question: 'How is VAT worked out on an invoice?',
    answer:
      'Per line, at the rate set on the line, then summed by rate. Rounding happens once per rate, not per line, so totals match what tax offices expect.',
  },
  {
    value: 'fx',
    question: 'Which exchange rate applies to foreign invoices?',
    answer:
      'The central bank rate published on the day before the invoice date. You can override it per invoice when a contract fixes another rate.',
  },
  {
    value: 'lock',
    question: 'Can a closed period be reopened?',
    answer:
      'Only by an owner, and every change made while it is open is kept in the audit trail with who made it and why.',
  },
];

export const ACTIVITY = [
  { name: 'Ana Ruiz', action: 'approved invoice INV-2041', when: '09:42', iso: '2026-03-14T09:42' },
  {
    name: 'Tomasz Nowak',
    action: 'commented on the March budget',
    when: '09:15',
    iso: '2026-03-14T09:15',
  },
  {
    name: 'Lena Fischer',
    action: 'uploaded 3 receipts',
    when: 'Yesterday',
    iso: '2026-03-13T17:08',
  },
  {
    name: 'Ivo Petrov',
    action: 'changed the approval rule for travel',
    when: 'Mon',
    iso: '2026-03-09T11:30',
  },
];

export const SHORTCUTS = [
  { keys: ['⌘', 'K'], label: 'Search everything' },
  { keys: ['⇧', 'A'], label: 'Approve selected' },
  { keys: ['G', 'I'], label: 'Go to invoices' },
  { keys: ['?'], label: 'Show all shortcuts' },
];
