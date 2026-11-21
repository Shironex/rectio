'use client';

import { ToolCall } from '@rectio/ui';

/** Running, failed and done; each opens to its arguments and result. */
export default function ToolCallDemo() {
  return (
    <div className="flex w-full max-w-xl flex-col gap-1">
      <ToolCall
        name="fx_rate"
        title="Fetching the EUR to USD rate"
        status="running"
        args={{ pair: 'EURUSD' }}
      />
      <ToolCall
        name="bank_feed"
        title="Read the bank feed"
        status="failed"
        error="The bank connection expired. Reconnect it in Settings."
        args={{ account: 'operating' }}
      />
      <ToolCall
        name="search_invoices"
        title="Searched unpaid invoices"
        status="done"
        duration="0.8 s"
        args={{ status: 'unpaid', due_before: '2026-11-21' }}
        result={{ count: 3, total: 18420 }}
      />
    </div>
  );
}
