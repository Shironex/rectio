import type { AiChatSummary, AiComposerCommand, AiComposerModel } from '@rectio/blocks/ai';

const at = (day: number, hour: number, minute = 0) => new Date(2026, 10, day, hour, minute);

/** Chats across every date group, against the fixed `NOW` of the chat views (November 21). */
export const CHATS: AiChatSummary[] = [
  { id: 'c-close', title: 'Q3 close checklist', updatedAt: at(4, 9), pinned: true },
  { id: 'c-runway', title: 'Runway at the current burn', updatedAt: at(12, 16), pinned: true },
  { id: 'c-overdue', title: 'Overdue invoices and who to chase', updatedAt: at(21, 15, 12) },
  { id: 'c-reminder', title: 'Draft a reminder to Northwind', updatedAt: at(21, 11, 40) },
  { id: 'c-vendors', title: 'October spend by vendor', updatedAt: at(20, 17, 2) },
  {
    id: 'c-vat',
    title: 'VAT return for the third quarter, with the reverse charge lines',
    updatedAt: at(18, 10),
  },
  { id: 'c-fx', title: 'Why the euro account moved', updatedAt: at(16, 14) },
  { id: 'c-payroll', title: 'Payroll accrual for November', updatedAt: at(2, 8) },
  { id: 'c-audit', title: 'Audit sample for fixed assets', updatedAt: new Date(2026, 9, 28, 9) },
];

export const MODELS: AiComposerModel[] = [
  { id: 'ledger-pro', label: 'Ledger Pro', hint: 'Best for reconciling' },
  { id: 'ledger-fast', label: 'Ledger Fast', hint: 'Quick answers' },
  { id: 'ledger-deep', label: 'Ledger Deep', hint: 'Long reports' },
];

export const COMMANDS: AiComposerCommand[] = [
  { id: 'summarize', name: 'summarize', description: 'Summarise the thread so far' },
  {
    id: 'invoice',
    name: 'invoice',
    description: 'Find an invoice by number or customer',
    keywords: ['bill', 'receivable'],
  },
  {
    id: 'reconcile',
    name: 'reconcile',
    description: 'Match a bank line to the ledger',
    keywords: ['bank'],
  },
  { id: 'report', name: 'report', description: 'Build a report for a period' },
  { id: 'remind', name: 'remind', description: 'Draft a payment reminder' },
  { id: 'explain', name: 'explain', description: 'Explain a figure on this page' },
];
