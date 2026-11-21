'use client';

import { ChatSourceChip, ChatSources } from '@rectio/ui';

import { SOURCES } from './chat-data';

/** Numbered chips beside the claims, the list behind them folded under a count. */
export default function ChatSourceDemo() {
  const [aging, northwind, terms] = SOURCES;
  return (
    <div className="flex w-full max-w-xl flex-col gap-3">
      <p className="text-sm text-fg">
        Three invoices are past due
        {aging !== undefined && <ChatSourceChip index={1} source={aging} />}, and Northwind has paid
        late four times in a row
        {northwind !== undefined && <ChatSourceChip index={2} source={northwind} />}. The terms
        allow a 1.5% monthly fee
        {terms !== undefined && <ChatSourceChip index={3} source={terms} />}.
      </p>
      <ChatSources sources={SOURCES} />
    </div>
  );
}
