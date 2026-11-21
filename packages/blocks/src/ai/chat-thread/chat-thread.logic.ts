import type {
  ChatMessageStatus,
  ChatSourceItem,
  ReasoningStatus,
  ToolCallStatus,
} from '@rectio/ui';

/** A tool the assistant called while writing a reply. */
export interface AiChatToolCall {
  id: string;
  name: string;
  /** A sentence for the summary, such as "Searched unpaid invoices". */
  title?: string | undefined;
  status: ToolCallStatus;
  args?: unknown;
  result?: unknown;
  error?: string | undefined;
  duration?: string | undefined;
}

/** One turn of the conversation, as the app's own state holds it. */
export interface AiChatTurn {
  id: string;
  role: 'user' | 'assistant' | 'system';
  /** The words: Markdown for the assistant, plain text for the user and system. */
  content: string;
  createdAt?: Date | undefined;
  /**
   * `sending` while a user turn is on its way, `streaming` while an assistant turn is arriving,
   * `stopped` when the reader stopped it, `error` when it failed.
   */
  status?: ChatMessageStatus | undefined;
  error?: string | undefined;
  /** The model's reasoning before the reply. */
  reasoning?: { text: string; status: ReasoningStatus; duration?: number | undefined } | undefined;
  tools?: readonly AiChatToolCall[] | undefined;
  sources?: readonly ChatSourceItem[] | undefined;
  /** The reader's rating of an assistant turn. */
  feedback?: 'good' | 'bad' | null | undefined;
}

/** A starting point offered on the empty thread. */
export interface AiChatSuggestion {
  id: string;
  /** The words on the chip. */
  label: string;
  /** What is sent; the label when omitted. */
  prompt?: string | undefined;
}

export type AiChatRow =
  | { kind: 'day'; key: string; date: Date }
  | { kind: 'turn'; key: string; turn: AiChatTurn; latest: boolean };

function dayKey(date: Date): string {
  return `${String(date.getFullYear())}-${String(date.getMonth())}-${String(date.getDate())}`;
}

/**
 * The rows the thread draws: each turn, with a day separator before the first turn of each
 * calendar day. Turns without a time never start a new day. `latest` marks the last assistant
 * turn, the only one that offers Regenerate.
 */
export function chatRows(turns: readonly AiChatTurn[]): AiChatRow[] {
  const latestAssistant = turns.findLast((turn) => turn.role === 'assistant')?.id;
  const rows: AiChatRow[] = [];
  let day: string | null = null;
  for (const turn of turns) {
    if (turn.createdAt !== undefined) {
      const key = dayKey(turn.createdAt);
      if (key !== day) {
        rows.push({ kind: 'day', key: `day-${key}`, date: turn.createdAt });
        day = key;
      }
    }
    rows.push({ kind: 'turn', key: turn.id, turn, latest: turn.id === latestAssistant });
  }
  return rows;
}

/**
 * Whether to show the typing dots in the reply's place: after the reader sent and before the
 * first words arrive, or while a streaming reply is still empty with nothing else to show.
 */
export function awaitingReply(turns: readonly AiChatTurn[], status: AiChatStatus): boolean {
  if (status === 'idle') return false;
  const last = turns.at(-1);
  if (last === undefined) return status === 'submitting';
  if (last.role === 'user') return true;
  return (
    last.role === 'assistant' &&
    last.content === '' &&
    last.reasoning === undefined &&
    (last.tools?.length ?? 0) === 0
  );
}

export type AiChatStatus = 'idle' | 'submitting' | 'streaming';

/** The turn the live announcer follows: the last assistant turn. */
export function announcedTurn(turns: readonly AiChatTurn[]): AiChatTurn | undefined {
  return turns.findLast((turn) => turn.role === 'assistant');
}
