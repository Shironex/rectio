import type { AiChatSuggestion, AiChatTurn } from '@rectio/blocks/ai';

/** Today, fixed, so the day separators read the same in every shot. */
export const NOW = new Date(2026, 10, 21, 15, 20);

export const SUGGESTIONS: AiChatSuggestion[] = [
  { id: 'overdue', label: 'Which invoices are overdue, and by how long?' },
  { id: 'runway', label: 'How many months of runway do we have at the current burn?' },
  { id: 'vendors', label: 'Summarise spend by vendor for October' },
  { id: 'close', label: 'What is left before we can close November?' },
];

export const OVERDUE_REPLY = `Three invoices are past due, **$18,420.00** in total. Northwind is the one to chase first: it is the oldest and the largest.

| Customer | Invoice | Due | Days late | Amount |
| :-- | :-- | :-- | --: | --: |
| Northwind Traders | INV-2041 | Oct 10 | 42 | $9,800.00 |
| Fabrikam | INV-2066 | Nov 1 | 20 | $5,120.00 |
| Contoso | INV-2079 | Nov 14 | 7 | $3,500.00 |

Two things stand out:

1. Northwind paid its last four invoices late, by 30 days on average, so a reminder alone has not worked before.
2. Fabrikam's contact changed in October; the reminder may have gone to an old address.

To pull the same list in the ledger yourself:

\`\`\`sql
select customer, number, due_on, current_date - due_on as days_late, amount
from invoices
where status = 'unpaid' and due_on < current_date
order by days_late desc;
\`\`\`

Want me to draft a reminder to Northwind with the [late fee terms](https://example.com/terms) attached?`;

export const REMINDER_REPLY = `Here is a draft you can send from the invoice page:

> Hi Dana, a quick note that INV-2041 for $9,800.00 was due on October 10. Our terms add a 1.5% monthly fee after 30 days, which we are happy to waive if payment arrives by November 28. The invoice is attached.

I kept it short and left the waiver in, since Northwind has been a customer for six years.`;

export const CONVERSATION: AiChatTurn[] = [
  {
    id: 'u0',
    role: 'user',
    content: 'Did the October close finish?',
    createdAt: new Date(2026, 10, 20, 17, 2),
  },
  {
    id: 'a0',
    role: 'assistant',
    content:
      'Yes. October closed on November 6 with every account reconciled. The only adjustment was a **$240.00** accrual for the cloud bill that arrived late.',
    createdAt: new Date(2026, 10, 20, 17, 2),
    feedback: 'good',
  },
  {
    id: 'u1',
    role: 'user',
    content: 'Which invoices are overdue, and by how long?',
    createdAt: new Date(2026, 10, 21, 15, 12),
  },
  {
    id: 'a1',
    role: 'assistant',
    content: OVERDUE_REPLY,
    createdAt: new Date(2026, 10, 21, 15, 12),
    reasoning: {
      status: 'done',
      duration: 6,
      text: "The question is about receivables, so I need unpaid invoices whose due date has passed. I will search the ledger, then check each customer's payment history to say who to chase first.",
    },
    tools: [
      {
        id: 't1',
        name: 'search_invoices',
        title: 'Searched unpaid invoices',
        status: 'done',
        duration: '0.8 s',
        args: { status: 'unpaid', due_before: '2026-11-21' },
        result: { count: 3, total: 18420 },
      },
      {
        id: 't2',
        name: 'payment_history',
        title: 'Read payment history for 3 customers',
        status: 'done',
        duration: '1.4 s',
        args: { customers: ['northwind', 'fabrikam', 'contoso'], months: 12 },
        result: { northwind: { late: 4, average_days_late: 30 } },
      },
    ],
    sources: [
      {
        id: 's1',
        title: 'Accounts receivable aging, November 21',
        url: 'https://example.com/reports/ar-aging',
        excerpt: 'Over 30 days: $9,800.00 (1 invoice). 1 to 30 days: $8,620.00 (2 invoices).',
      },
      {
        id: 's2',
        title: 'Northwind Traders, customer record',
        url: 'https://example.com/customers/northwind',
        excerpt: 'Paid the last four invoices 22, 28, 31 and 39 days late.',
      },
      {
        id: 's3',
        title: 'Payment terms and late fees',
        url: 'https://example.com/terms',
      },
    ],
    feedback: null,
  },
];
