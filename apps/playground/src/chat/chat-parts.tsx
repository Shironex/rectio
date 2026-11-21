import {
  ChatLoader,
  ChatMessage,
  ChatMessageEditor,
  ChatSourceChip,
  ChatSources,
  Markdown,
  PromptInput,
  Reasoning,
  ToolCall,
  type FileUploadEntry,
} from '@rectio/ui';
import { useState, type ReactNode } from 'react';

import { CONVERSATION } from './chat-data';

const SOURCES = CONVERSATION.at(-1)?.sources ?? [];

const DOC = `## Close checklist

Run these **in order**; each step needs the one before it.

- Reconcile every bank account to the statement
- Post accruals for bills that arrived after month end
  - Cloud and payroll first, they are the largest
- Review the \`suspense\` account and clear it to zero

> A close is done when the trial balance ties and nobody has an open adjustment.

---

Questions go to the controller, or see the [close policy](https://example.com/close).`;

function Section({ title, note, children }: { title: string; note: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 border-t border-line pt-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-heading text-fg">{title}</h2>
        <p className="text-sm text-fg-muted text-pretty">{note}</p>
      </div>
      {children}
    </section>
  );
}

export function ChatParts() {
  const [attachments, setAttachments] = useState<FileUploadEntry[]>([
    { id: 'f1', name: 'november-ar-aging.csv', size: 48_200, status: 'done' },
    {
      id: 'f2',
      name: 'northwind-statement.pdf',
      size: 1_820_000,
      status: 'uploading',
      progress: 62,
    },
  ]);
  const [editing, setEditing] = useState(true);

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-8 sm:px-8">
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-heading tracking-tight text-fg">Chat parts</h1>
        <p className="text-sm text-fg-muted">
          Message states, tool calls, reasoning, loaders, the prompt field, sources and Markdown on
          their own.
        </p>
      </header>

      <Section
        title="Message states"
        note="Sending, failed with a reason and Retry, stopped mid reply, editing in place and a system note."
      >
        <div className="flex flex-col gap-6">
          <ChatMessage from="system">Model changed to the faster one for this chat</ChatMessage>
          <ChatMessage from="user" status="sending">
            What did we spend on software in October?
          </ChatMessage>
          <ChatMessage
            from="user"
            status="error"
            error="You are offline. The message will not send until you reconnect."
            onRetry={() => undefined}
          >
            Draft a reminder to Northwind.
          </ChatMessage>
          <ChatMessage from="assistant" author="Ledger assistant" status="stopped">
            <Markdown>
              {
                'Software came to **$12,480.00** in October, up 8% on September. The largest lines were'
              }
            </Markdown>
          </ChatMessage>
          {editing && (
            <ChatMessage from="user">
              <ChatMessageEditor
                defaultValue="Which invoices are overdue by more than 30 days?"
                onSave={() => {
                  setEditing(false);
                }}
                onCancel={() => {
                  setEditing(false);
                }}
              />
            </ChatMessage>
          )}
        </div>
      </Section>

      <Section
        title="Tool calls and reasoning"
        note="Running, failed and done; reasoning open while the model thinks."
      >
        <div className="flex flex-col gap-3">
          <Reasoning status="thinking">
            <Markdown size="sm" streaming>
              {
                'The reader wants software spend, so I will group October bills by the **software** category and compare with'
              }
            </Markdown>
          </Reasoning>
          <ToolCall
            name="fx_rate"
            title="Fetching the EUR to USD rate"
            status="running"
            args={{ pair: 'EURUSD', date: '2026-10-31' }}
          />
          <ToolCall
            name="bank_feed"
            title="Read the Mercury bank feed"
            status="failed"
            error="The bank connection expired. Reconnect it in Settings, then ask again."
            args={{ account: 'operating', from: '2026-10-01' }}
          />
          <ToolCall
            name="search_bills"
            title="Searched October bills"
            status="done"
            duration="0.6 s"
            defaultOpen
            args={{ category: 'software', month: '2026-10' }}
            result={{ count: 14, total: 12480 }}
          />
        </div>
      </Section>

      <Section
        title="Loaders"
        note="Typing dots before the first words, the skeleton of a reply while history loads."
      >
        <div className="flex flex-col gap-6">
          <ChatLoader />
          <ChatLoader variant="skeleton" />
        </div>
      </Section>

      <Section
        title="Prompt field"
        note="Attachments with an upload in progress, the count near the limit, and the field while a reply streams."
      >
        <div className="flex flex-col gap-6">
          <PromptInput
            onSubmit={() => undefined}
            attachments={attachments}
            onAttach={() => undefined}
            onRemoveAttachment={(file) => {
              setAttachments((all) => all.filter((f) => f.id !== file.id));
            }}
            maxLength={120}
            defaultValue="Compare these two files and tell me which Northwind invoices the statement says are paid but our ledger shows open."
          />
          <PromptInput onSubmit={() => undefined} onStop={() => undefined} status="streaming" />
        </div>
      </Section>

      <Section title="Sources" note="Citation chips in the text and the list behind a reply, open.">
        <div className="flex flex-col gap-3">
          <p className="text-sm text-fg leading-relaxed">
            Northwind has paid late four times in a row
            {SOURCES[1] !== undefined && <ChatSourceChip index={2} source={SOURCES[1]} />}, and the
            terms allow a 1.5% monthly fee after 30 days
            {SOURCES[2] !== undefined && <ChatSourceChip index={3} source={SOURCES[2]} />}.
          </p>
          <ChatSources sources={SOURCES} defaultOpen />
        </div>
      </Section>

      <Section
        title="Markdown"
        note="The same renderer at the docs size: headings, nested lists, inline code, a quote and a rule."
      >
        <Markdown size="base">{DOC}</Markdown>
      </Section>
    </main>
  );
}
