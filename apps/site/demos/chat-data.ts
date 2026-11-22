import type { AiChatStatus, AiChatTurn } from '@rectio/blocks/ai';
import { ChatSourceChip, type MarkdownComponents } from '@rectio/ui';
import { createElement, useEffect, useRef, useState } from 'react';

/**
 * A stand-in for a model's streaming API, shared by the chat demos: it sends `text` in uneven
 * bursts, the way real tokens arrive. Returns a function that stops it.
 */
export function fakeStream(
  text: string,
  { onChunk, onDone }: { onChunk: (received: string) => void; onDone: () => void },
): () => void {
  const words = text.split(/(?<=\s)/);
  const bursts = [1, 4, 2, 7, 3, 1, 5, 2, 9, 3];
  const pauses = [60, 140, 90, 220, 70, 110, 40, 180, 90, 130];
  let index = 0;
  let step = 0;
  let received = '';
  let timer: ReturnType<typeof setTimeout> | undefined;
  const tick = () => {
    const take = bursts[step % bursts.length] ?? 3;
    received += words.slice(index, index + take).join('');
    index += take;
    onChunk(received);
    if (index >= words.length) {
      onDone();
      return;
    }
    timer = setTimeout(tick, pauses[step % pauses.length] ?? 100);
    step += 1;
  };
  timer = setTimeout(tick, 300);
  return () => {
    clearTimeout(timer);
  };
}

export const OVERDUE_REPLY = `Three invoices are past due, **$18,420.00** in total[1](#source-1). Northwind is the one to chase first.

| Customer | Invoice | Days late | Amount |
| :-- | :-- | --: | --: |
| Northwind Traders | INV-2041 | 42 | $9,800.00 |
| Fabrikam | INV-2066 | 20 | $5,120.00 |
| Contoso | INV-2079 | 7 | $3,500.00 |

Northwind paid its last four invoices late, so a reminder alone has not worked before[2](#source-2).`;

export const CLOSE_REPLY = `October closed on November 6 with every account reconciled.

- The only adjustment was a **$240.00** accrual for a late cloud bill
- Bank feeds matched to the cent

Want the trial balance as a CSV?`;

export const SOURCES = [
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
  { id: 's3', title: 'Payment terms and late fees', url: 'https://example.com/terms' },
];

/** Markdown parts that turn `[1](#source-1)` in a reply into the chip of that source. */
export const CITATIONS: MarkdownComponents = {
  link: (props) => {
    const match = /^#source-(\d+)$/.exec(props.href);
    const source = match === null ? undefined : SOURCES[Number(match[1]) - 1];
    if (match === null || source === undefined) return undefined;
    return createElement(ChatSourceChip, { index: Number(match[1]), source });
  },
};

export const SUGGESTIONS = [
  { id: 'overdue', label: 'Which invoices are overdue?' },
  { id: 'close', label: 'Did the October close finish?' },
  { id: 'runway', label: 'How many months of runway do we have?' },
  { id: 'vendors', label: 'Summarise spend by vendor for October' },
];

/** The reply a suggestion or question gets, so the demos answer in kind. */
export function replyFor(question: string): string {
  return /close|october/i.test(question) ? CLOSE_REPLY : OVERDUE_REPLY;
}

export const HISTORY: AiChatTurn[] = [
  { id: 'u1', role: 'user', content: 'Which invoices are overdue?' },
  {
    id: 'a1',
    role: 'assistant',
    content: OVERDUE_REPLY,
    reasoning: {
      status: 'done',
      duration: 4,
      text: 'Receivables question: find unpaid invoices past their due date, then check who pays late.',
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
    ],
    sources: SOURCES,
    feedback: null,
  },
];

/**
 * A conversation driven by `fakeStream`: what an app does with its own model client. Sending adds
 * the user's turn, waits a beat, then streams the reply; Stop keeps what arrived.
 */
export function useDemoChat(initial: AiChatTurn[] = []) {
  const [turns, setTurns] = useState(initial);
  const [status, setStatus] = useState<AiChatStatus>('idle');
  const stopStream = useRef<(() => void) | null>(null);
  const wait = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const count = useRef(0);
  useEffect(
    () => () => {
      stopStream.current?.();
      clearTimeout(wait.current);
    },
    [],
  );
  const id = (prefix: string) => {
    count.current += 1;
    return `${prefix}-${String(count.current)}`;
  };
  const reply = (text: string) => {
    setStatus('submitting');
    wait.current = setTimeout(() => {
      const replyId = id('a');
      setStatus('streaming');
      setTurns((all) => [
        ...all,
        { id: replyId, role: 'assistant', content: '', status: 'streaming', feedback: null },
      ]);
      stopStream.current = fakeStream(text, {
        onChunk: (received) => {
          setTurns((all) => all.map((t) => (t.id === replyId ? { ...t, content: received } : t)));
        },
        onDone: () => {
          setTurns((all) => all.map((t) => (t.id === replyId ? { ...t, status: undefined } : t)));
          setStatus('idle');
          stopStream.current = null;
        },
      });
    }, 600);
  };
  return {
    conversation: turns,
    status,
    onSend: (text: string) => {
      setTurns((all) => [...all, { id: id('u'), role: 'user', content: text }]);
      reply(replyFor(text));
    },
    onStop: () => {
      stopStream.current?.();
      stopStream.current = null;
      clearTimeout(wait.current);
      setTurns((all) =>
        all.map((t) => (t.status === 'streaming' ? { ...t, status: 'stopped' } : t)),
      );
      setStatus('idle');
    },
    onRegenerate: (turn: AiChatTurn) => {
      const question = turns.findLast((t) => t.role === 'user')?.content ?? '';
      setTurns((all) => all.filter((t) => t.id !== turn.id));
      reply(replyFor(question));
    },
    onFeedback: (turn: AiChatTurn, value: 'good' | 'bad' | null) => {
      setTurns((all) => all.map((t) => (t.id === turn.id ? { ...t, feedback: value } : t)));
    },
  };
}
