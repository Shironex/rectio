import {
  BankIcon,
  ChartLineUpIcon,
  FileTextIcon,
  GearSixIcon,
  HouseIcon,
  NotePencilIcon,
  SparkleIcon,
  WalletIcon,
} from '@phosphor-icons/react';
import * as plainBlocks from '@rectio/blocks';
import * as plainAi from '@rectio/blocks/ai';
import type { AiChatStatus, AiChatSummary, AiChatTurn } from '@rectio/blocks/ai';
import * as movingAi from '@rectio/blocks/ai/motion';
import * as movingBlocks from '@rectio/blocks/motion';
import type { FileUploadEntry } from '@rectio/ui';
import {
  AppShell,
  AppShellHeader,
  Breadcrumb,
  Button,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarItem,
  ThemeScope,
} from '@rectio/ui';
import { useEffect, useRef, useState, type ReactNode } from 'react';

import * as data from '../blocks/data';
import { CONVERSATION, NOW, OVERDUE_REPLY, REMINDER_REPLY, SUGGESTIONS } from '../chat/chat-data';
import { fakeStream } from '../chat/fake-stream';
import { usePageCanvas } from '../page-canvas';
import type { Mode, ThemeId } from '../themes';
import { CHATS, COMMANDS, MODELS } from './ai-blocks-data';

type State =
  'workspace' | 'workspace-empty' | 'workspace-loading' | 'sidebar' | 'sidebar-closed' | 'composer';

const STATES: readonly State[] = [
  'workspace-empty',
  'workspace-loading',
  'sidebar',
  'sidebar-closed',
  'composer',
];

function readState(): State {
  const state = new URLSearchParams(window.location.search).get('state');
  return STATES.find((s) => s === state) ?? 'workspace';
}

let nextId = 0;
const newId = (prefix: string) => {
  nextId += 1;
  return `${prefix}-${String(nextId)}`;
};

/**
 * A conversation fed through the kit's stream contract: the fake source sends text in bursts and
 * each burst becomes a `text` event folded in with `applyStreamEvent`, the way an app maps its
 * provider's stream.
 */
function useFakeAssistant(initial: AiChatTurn[]) {
  const [turns, setTurns] = useState(initial);
  const [status, setStatus] = useState<AiChatStatus>('idle');
  const stop = useRef<(() => void) | null>(null);
  const wait = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const streaming = useRef<string | null>(null);
  useEffect(
    () => () => {
      stop.current?.();
      clearTimeout(wait.current);
    },
    [],
  );

  const reply = (text: string) => {
    setStatus('submitting');
    wait.current = setTimeout(() => {
      const id = newId('a');
      streaming.current = id;
      setStatus('streaming');
      setTurns((all) =>
        plainAi.applyStreamEvent(all, { type: 'start', id, createdAt: new Date() }),
      );
      let sent = 0;
      stop.current = fakeStream(text, {
        onChunk: (received) => {
          const delta = received.slice(sent);
          sent = received.length;
          setTurns((all) => plainAi.applyStreamEvent(all, { type: 'text', id, delta }));
        },
        onDone: () => {
          setTurns((all) => plainAi.applyStreamEvent(all, { type: 'done', id }));
          setStatus('idle');
          stop.current = null;
          streaming.current = null;
        },
      });
    }, 700);
  };

  return {
    turns,
    setTurns,
    status,
    send: (text: string) => {
      setTurns((all) => [
        ...all,
        { id: newId('u'), role: 'user', content: text, createdAt: new Date() },
      ]);
      reply(turns.length === 0 ? OVERDUE_REPLY : REMINDER_REPLY);
    },
    stop: () => {
      stop.current?.();
      stop.current = null;
      clearTimeout(wait.current);
      const id = streaming.current;
      if (id !== null) setTurns((all) => plainAi.applyStreamEvent(all, { type: 'stopped', id }));
      streaming.current = null;
      setStatus('idle');
    },
    regenerate: (turn: AiChatTurn) => {
      setTurns((all) => all.filter((t) => t.id !== turn.id));
      reply(turn.content);
    },
    rate: (turn: AiChatTurn, value: 'good' | 'bad' | null) => {
      setTurns((all) => all.map((t) => (t.id === turn.id ? { ...t, feedback: value } : t)));
    },
  };
}

const avatar = (
  <span
    aria-hidden
    className="grid size-7 place-items-center rounded-full bg-accent-subtle text-accent-strong"
  >
    <SparkleIcon weight="fill" className="size-3.5" />
  </span>
);

function Workspace({ state, motion }: { state: State; motion: boolean }) {
  const ai = motion ? movingAi : plainAi;
  const empty = state === 'workspace-empty';
  const loading = state === 'workspace-loading';
  const [chats, setChats] = useState<AiChatSummary[]>(empty ? [] : CHATS);
  const [activeId, setActiveId] = useState<string | null>(empty ? null : 'c-overdue');
  const chat = useFakeAssistant(empty ? [] : CONVERSATION);
  const [model, setModel] = useState('ledger-pro');
  const [files, setFiles] = useState<FileUploadEntry[]>([]);

  return (
    <ai.ChatWorkspace
      className="h-dvh"
      chats={chats}
      activeId={activeId}
      now={NOW}
      locale="en-US"
      chatsLoading={loading}
      threadLoading={loading}
      onSelect={(picked) => {
        setActiveId(picked.id);
      }}
      onNewChat={() => {
        const id = newId('c');
        setChats((all) => [{ id, title: '', updatedAt: new Date() }, ...all]);
        setActiveId(id);
        chat.setTurns([]);
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
      conversation={chat.turns}
      status={chat.status}
      onSend={(text) => {
        chat.send(text);
      }}
      onStop={chat.stop}
      onRegenerate={chat.regenerate}
      onFeedback={chat.rate}
      suggestions={SUGGESTIONS}
      avatar={avatar}
      threadMessages={{
        assistant: 'Ledger assistant',
        emptyDescription: 'I can read your invoices, bills, bank feeds and the close checklist.',
      }}
      renderComposer={(slot) => (
        <ai.PromptComposer
          {...slot}
          disabled={loading}
          placeholder="Ask about invoices, cash or the close"
          models={MODELS}
          model={model}
          onModelChange={setModel}
          commands={COMMANDS}
          count="tokens"
          limit={8000}
          locale="en-US"
          attachments={files}
          onAttach={(added) => {
            setFiles((all) => [
              ...all,
              ...added.map((file): FileUploadEntry => ({
                id: newId('f'),
                name: file.name,
                size: file.size,
                type: file.type,
                file,
                status: 'done',
              })),
            ]);
          }}
          onRemoveAttachment={(entry) => {
            setFiles((all) => all.filter((f) => f.id !== entry.id));
          }}
          hint="Check figures before you send them on."
        />
      )}
    />
  );
}

function AssistantPanel({ motion }: { motion: boolean }) {
  const ai = motion ? movingAi : plainAi;
  const chat = useFakeAssistant(CONVERSATION.slice(2));
  return (
    <ai.AiChatThread
      className="min-h-0 flex-1"
      conversation={chat.turns}
      status={chat.status}
      now={NOW}
      locale="en-US"
      onSend={(text) => {
        chat.send(text);
      }}
      onStop={chat.stop}
      onRegenerate={chat.regenerate}
      onFeedback={chat.rate}
      suggestions={SUGGESTIONS.slice(0, 2)}
      messages={{ assistant: 'Ledger assistant' }}
      renderComposer={(slot) => (
        <ai.PromptComposer
          {...slot}
          placeholder="Ask about this page"
          commands={COMMANDS}
          models={MODELS}
          defaultModel="ledger-pro"
        />
      )}
    />
  );
}

const icon = (Icon: typeof HouseIcon) => <Icon aria-hidden weight="bold" />;

function Docked({ state, motion }: { state: State; motion: boolean }) {
  const ai = motion ? movingAi : plainAi;
  const blocks = motion ? movingBlocks : plainBlocks;
  const locale = data.LOCALES['en-GB'];
  const sidebar = (
    <Sidebar label="Main">
      <SidebarHeader>
        <span
          aria-hidden
          className="flex size-7 shrink-0 items-center justify-center rounded-control bg-accent text-sm font-strong text-accent-contrast"
        >
          F
        </span>
        <span className="min-w-0 flex-1 truncate text-sm font-medium in-data-collapsed:sr-only">
          Fernhill Systems
        </span>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarItem href="#overview" icon={icon(HouseIcon)}>
            Overview
          </SidebarItem>
          <SidebarItem href="#invoices" icon={icon(FileTextIcon)} active>
            Invoices
          </SidebarItem>
          <SidebarItem href="#banking" icon={icon(BankIcon)}>
            Banking
          </SidebarItem>
          <SidebarItem href="#payables" icon={icon(WalletIcon)}>
            Payables
          </SidebarItem>
          <SidebarItem href="#reports" icon={icon(ChartLineUpIcon)}>
            Reports
          </SidebarItem>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarItem href="#settings" icon={icon(GearSixIcon)}>
          Settings
        </SidebarItem>
      </SidebarFooter>
    </Sidebar>
  );
  return (
    <ai.AssistantSidebarProvider defaultOpen={state === 'sidebar'}>
      <AppShell
        sidebar={sidebar}
        header={
          <AppShellHeader
            title={
              <Breadcrumb
                items={[{ label: 'Fernhill Systems', href: '#overview' }, { label: 'Invoices' }]}
              />
            }
            actions={<ai.AssistantSidebarTrigger />}
          />
        }
      >
        <ai.AssistantSidebar
          className="h-[calc(100dvh-var(--rx-app-shell-header-height))]"
          contentClassName="flex flex-col gap-6 px-4 py-6 sm:px-8"
          storageKey="playground-assistant"
          phoneTrigger={false}
          title="Ledger assistant"
          headerActions={
            <Button variant="ghost" iconOnly aria-label="New chat" className="relative">
              <NotePencilIcon aria-hidden weight="bold" className="size-4" />
            </Button>
          }
          panel={<AssistantPanel motion={motion} />}
        >
          <div className="flex flex-col gap-1">
            <h1 className="font-display text-3xl font-heading tracking-tight">Invoices</h1>
            <p className="text-sm text-fg-muted">March 2026, 42 invoices</p>
          </div>
          <blocks.KpiRow
            currency={locale.currency}
            locale={locale.locale}
            kpis={data.kpis()}
            comparison="vs February"
            label="Key figures, March 2026"
          />
          <blocks.InvoiceList
            currency={locale.currency}
            locale={locale.locale}
            invoices={data.invoices()}
            today={data.TODAY}
          />
        </ai.AssistantSidebar>
      </AppShell>
    </ai.AssistantSidebarProvider>
  );
}

function ComposerCase({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-heading text-fg">{title}</h2>
      {children}
    </section>
  );
}

const ATTACHED: FileUploadEntry[] = [
  {
    id: 'f1',
    name: 'aging-report-nov.csv',
    size: 48_000,
    type: 'text/csv',
    status: 'done',
  },
  {
    id: 'f2',
    name: 'northwind-statement.pdf',
    size: 220_000,
    type: 'application/pdf',
    status: 'uploading',
    progress: 60,
  },
];

function Composers({ motion }: { motion: boolean }) {
  const ai = motion ? movingAi : plainAi;
  const shared = { onSubmit: () => undefined, models: MODELS, commands: COMMANDS, locale: 'en-US' };
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-10 px-4 pt-80 pb-16">
      <h1 className="font-display text-2xl font-heading tracking-tight">Prompt composer</h1>
      <ComposerCase title="Slash commands">
        <ai.PromptComposer {...shared} defaultValue="Please /" data-case="commands" />
      </ComposerCase>
      <ComposerCase title="Attachments and a token count">
        <ai.PromptComposer
          {...shared}
          defaultValue="Compare these two against the ledger and list what does not match."
          attachments={ATTACHED}
          onAttach={() => undefined}
          count="tokens"
          limit={8000}
        />
      </ComposerCase>
      <ComposerCase title="Over the limit">
        <ai.PromptComposer
          {...shared}
          defaultValue="Summarise every vendor contract we signed this year, with the renewal date, notice period and price."
          count="characters"
          limit={90}
        />
      </ComposerCase>
      <ComposerCase title="Streaming">
        <ai.PromptComposer
          {...shared}
          status="streaming"
          onStop={() => undefined}
          defaultValue="Next, draft the reminder"
        />
      </ComposerCase>
    </main>
  );
}

/**
 * The AI blocks: `?view=ai-blocks&state=` workspace (default), workspace-empty,
 * workspace-loading, sidebar (open in an app shell), sidebar-closed (the rail) and composer.
 * Replies come from a fake stream through the kit's stream contract.
 */
export function AiBlocksPage({
  theme,
  mode,
  motion,
}: {
  theme: ThemeId;
  mode: Mode;
  motion: boolean;
}) {
  const canvas = usePageCanvas(theme, mode);
  const state = readState();
  return (
    <ThemeScope ref={canvas} theme={theme} mode={mode} className="min-h-dvh bg-surface-canvas">
      {state.startsWith('workspace') ? (
        <Workspace state={state} motion={motion} />
      ) : state === 'composer' ? (
        <Composers motion={motion} />
      ) : (
        <Docked state={state} motion={motion} />
      )}
    </ThemeScope>
  );
}
