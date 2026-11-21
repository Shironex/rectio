import { NotePencilIcon, SparkleIcon } from '@phosphor-icons/react';
import {
  AiChatThread as PlainAiChatThread,
  type AiChatStatus,
  type AiChatTurn,
} from '@rectio/blocks/ai';
import { AiChatThread as MotionAiChatThread } from '@rectio/blocks/ai/motion';
import { Badge, Button, ThemeScope } from '@rectio/ui';
import { useEffect, useRef, useState } from 'react';

import { usePageCanvas } from '../page-canvas';
import type { Mode, ThemeId } from '../themes';
import { CONVERSATION, NOW, OVERDUE_REPLY, REMINDER_REPLY, SUGGESTIONS } from './chat-data';
import { ChatParts } from './chat-parts';
import { fakeStream } from './fake-stream';

type ChatState = 'conversation' | 'empty' | 'streaming' | 'error' | 'parts';

function readState(): ChatState {
  const state = new URLSearchParams(window.location.search).get('state');
  return (
    (['empty', 'streaming', 'error', 'parts'] as const).find((s) => s === state) ?? 'conversation'
  );
}

/** The conversation each state opens with. */
function opening(state: ChatState): AiChatTurn[] {
  if (state === 'empty') return [];
  if (state === 'streaming') {
    const reply = CONVERSATION.at(-1);
    if (reply === undefined) return CONVERSATION;
    // Cut mid reply, inside the table, the way a shot would catch a stream.
    const cut = OVERDUE_REPLY.indexOf('| Fabrikam');
    return [
      ...CONVERSATION.slice(0, -1),
      { ...reply, content: OVERDUE_REPLY.slice(0, cut), status: 'streaming', sources: undefined },
    ];
  }
  if (state === 'error') {
    return [
      ...CONVERSATION,
      {
        id: 'u2',
        role: 'user',
        content: 'Draft a reminder to Northwind with the late fee terms attached.',
        createdAt: new Date(2026, 10, 21, 15, 18),
        status: 'error',
        error: 'You are offline. The message will not send until you reconnect.',
      },
    ];
  }
  return CONVERSATION;
}

let nextId = 0;
const newId = (prefix: string) => {
  nextId += 1;
  return `${prefix}-${String(nextId)}`;
};

/**
 * A conversation driven by a fake streaming source: what an app does with its own model client.
 * Sending adds the user's turn, waits a beat, then streams the reply in bursts; Stop keeps what
 * arrived and marks it stopped.
 */
function useFakeChat(initial: AiChatTurn[]) {
  const [turns, setTurns] = useState(initial);
  const [status, setStatus] = useState<AiChatStatus>(
    initial.at(-1)?.status === 'streaming' ? 'streaming' : 'idle',
  );
  const stop = useRef<(() => void) | null>(null);
  const wait = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
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
      setStatus('streaming');
      setTurns((all) => [
        ...all,
        {
          id,
          role: 'assistant',
          content: '',
          status: 'streaming',
          createdAt: new Date(),
          feedback: null,
        },
      ]);
      stop.current = fakeStream(text, {
        onChunk: (received) => {
          setTurns((all) => all.map((t) => (t.id === id ? { ...t, content: received } : t)));
        },
        onDone: () => {
          setTurns((all) => all.map((t) => (t.id === id ? { ...t, status: undefined } : t)));
          setStatus('idle');
          stop.current = null;
        },
      });
    }, 700);
  };

  return {
    turns,
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
      setTurns((all) =>
        all.map((t) => (t.status === 'streaming' ? { ...t, status: 'stopped' } : t)),
      );
      setStatus('idle');
    },
    retry: (turn: AiChatTurn) => {
      setTurns((all) =>
        all.map((t) => (t.id === turn.id ? { ...t, status: undefined, error: undefined } : t)),
      );
      reply(REMINDER_REPLY);
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

export function ChatPage({ theme, mode, motion }: { theme: ThemeId; mode: Mode; motion: boolean }) {
  const canvas = usePageCanvas(theme, mode);
  const state = readState();
  const chat = useFakeChat(opening(state));
  const AiChatThread = motion ? MotionAiChatThread : PlainAiChatThread;

  if (state === 'parts') {
    return (
      <ThemeScope ref={canvas} theme={theme} mode={mode} className="min-h-dvh bg-surface-canvas">
        <ChatParts />
      </ThemeScope>
    );
  }

  return (
    <ThemeScope ref={canvas} theme={theme} mode={mode} className="h-dvh bg-surface">
      <AiChatThread
        className="h-dvh"
        conversation={chat.turns}
        status={chat.status}
        now={NOW}
        locale="en-US"
        onSend={(text) => {
          chat.send(text);
        }}
        onStop={chat.stop}
        onRetry={chat.retry}
        onRegenerate={chat.regenerate}
        onFeedback={chat.rate}
        suggestions={SUGGESTIONS}
        messages={{
          assistant: 'Ledger assistant',
          emptyDescription: 'I can read your invoices, bills, bank feeds and the close checklist.',
        }}
        avatar={
          <span
            aria-hidden
            className="grid size-7 place-items-center rounded-full bg-accent-subtle text-accent-strong"
          >
            <SparkleIcon weight="fill" className="size-3.5" />
          </span>
        }
        composer={{
          placeholder:
            state === 'error'
              ? 'Offline. Reconnect to send'
              : 'Ask about invoices, cash or the close',
          maxLength: 4000,
          onAttach: () => undefined,
          hint: 'Check figures before you send them on.',
          disabled: state === 'error',
        }}
        header={
          <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-line px-4">
            <div className="flex min-w-0 items-center gap-2">
              <h1 className="truncate text-sm font-heading text-fg">Ledger assistant</h1>
              <Badge>Beta</Badge>
            </div>
            <Button variant="ghost" size="sm">
              <NotePencilIcon aria-hidden weight="bold" className="size-4" />
              New chat
            </Button>
          </header>
        }
      />
    </ThemeScope>
  );
}
