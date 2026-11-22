'use client';

import type * as PlainAi from '@rectio/blocks/ai';
import type { AiChatSummary, AiComposerCommand, AiComposerModel } from '@rectio/blocks/ai';
import { useState } from 'react';

import { HISTORY, SUGGESTIONS, useDemoChat } from './chat-data';

/** The plain or the motion entry: both have the same names and props. */
type AiEntry = Pick<
  typeof PlainAi,
  | 'AiChatThread'
  | 'AssistantSidebar'
  | 'AssistantSidebarProvider'
  | 'AssistantSidebarTrigger'
  | 'ChatWorkspace'
  | 'PromptComposer'
>;

const NOW = new Date(2026, 10, 21, 15, 20);
const at = (day: number, hour: number) => new Date(2026, 10, day, hour);

const CHATS: AiChatSummary[] = [
  { id: 'close', title: 'Q3 close checklist', updatedAt: at(4, 9), pinned: true },
  { id: 'overdue', title: 'Overdue invoices', updatedAt: at(21, 15) },
  { id: 'reminder', title: 'Draft a reminder to Northwind', updatedAt: at(21, 11) },
  { id: 'vendors', title: 'October spend by vendor', updatedAt: at(20, 17) },
  { id: 'fx', title: 'Why the euro account moved', updatedAt: at(16, 14) },
  { id: 'payroll', title: 'Payroll accrual for November', updatedAt: at(2, 8) },
];

export const MODELS: AiComposerModel[] = [
  { id: 'pro', label: 'Ledger Pro', hint: 'Best for reconciling' },
  { id: 'fast', label: 'Ledger Fast', hint: 'Quick answers' },
];

export const COMMANDS: AiComposerCommand[] = [
  { id: 'summarize', name: 'summarize', description: 'Summarise the thread so far' },
  { id: 'invoice', name: 'invoice', description: 'Find an invoice', keywords: ['bill'] },
  { id: 'reconcile', name: 'reconcile', description: 'Match a bank line', keywords: ['bank'] },
  { id: 'remind', name: 'remind', description: 'Draft a payment reminder' },
];

/** A chat page: pick, search, pin, rename or delete chats; the thread answers from a fake stream. */
export function ChatWorkspaceDemo({ ai }: { ai: AiEntry }) {
  const [chats, setChats] = useState(CHATS);
  const [activeId, setActiveId] = useState<string | null>('overdue');
  const chat = useDemoChat(HISTORY);
  return (
    <div className="flex h-160 w-full overflow-hidden rounded-panel border border-line">
      <ai.ChatWorkspace
        {...chat}
        className="w-full"
        chats={chats}
        activeId={activeId}
        now={NOW}
        onSelect={(picked) => {
          setActiveId(picked.id);
        }}
        onNewChat={() => {
          const id = `new-${String(Date.now())}`;
          setChats((all) => [{ id, title: '', updatedAt: new Date() }, ...all]);
          setActiveId(id);
        }}
        onRename={(target, title) => {
          setChats((all) => all.map((c) => (c.id === target.id ? { ...c, title } : c)));
        }}
        onDelete={(target) => {
          setChats((all) => all.filter((c) => c.id !== target.id));
        }}
        onPinChange={(target, pinned) => {
          setChats((all) => all.map((c) => (c.id === target.id ? { ...c, pinned } : c)));
        }}
        suggestions={SUGGESTIONS}
        threadMessages={{ assistant: 'Ledger assistant' }}
        renderComposer={(slot) => (
          <ai.PromptComposer
            {...slot}
            placeholder="Ask about invoices, cash or the close"
            models={MODELS}
            commands={COMMANDS}
          />
        )}
      />
    </div>
  );
}

/** An assistant docked beside a page: drag or arrow the handle, press Mod+J, fold it to the rail. */
export function AssistantSidebarDemo({ ai }: { ai: AiEntry }) {
  const chat = useDemoChat();
  return (
    <ai.AssistantSidebarProvider defaultOpen>
      <div className="flex h-160 w-full flex-col overflow-hidden rounded-panel border border-line">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-line px-4">
          <span className="text-sm font-medium">Invoices</span>
          <ai.AssistantSidebarTrigger />
        </header>
        <ai.AssistantSidebar
          className="min-h-0 flex-1"
          contentClassName="flex flex-col gap-3 p-6"
          title="Ledger assistant"
          phoneTrigger={false}
          panel={
            <ai.AiChatThread
              {...chat}
              className="min-h-0 flex-1"
              suggestions={SUGGESTIONS.slice(0, 2)}
              messages={{ assistant: 'Ledger assistant' }}
              renderComposer={(slot) => (
                <ai.PromptComposer
                  {...slot}
                  placeholder="Ask about this page"
                  commands={COMMANDS}
                />
              )}
            />
          }
        >
          <h2 className="font-display text-2xl font-heading tracking-tight">March invoices</h2>
          <p className="max-w-prose text-sm text-fg-muted">
            42 invoices, three overdue. Ask the assistant which to chase first, or press the
            shortcut to move into its field and back.
          </p>
        </ai.AssistantSidebar>
      </div>
    </ai.AssistantSidebarProvider>
  );
}

/** A field with a model picker, slash commands (type `/`) and a token count against a limit. */
export function PromptComposerDemo({ ai }: { ai: AiEntry }) {
  const [sent, setSent] = useState<string | null>(null);
  return (
    <div className="flex w-full max-w-xl flex-col gap-3 pt-56">
      <ai.PromptComposer
        placeholder="Type / for commands"
        models={MODELS}
        commands={COMMANDS}
        count="tokens"
        limit={200}
        onSubmit={(text) => {
          setSent(text);
        }}
      />
      <p className="text-sm text-fg-muted" aria-live="polite">
        {sent === null ? 'Nothing sent yet.' : `Sent: ${sent}`}
      </p>
    </div>
  );
}
