import type { ChatSourceItem } from '@rectio/ui';

import type { AiChatStatus, AiChatToolCall, AiChatTurn } from '../chat-thread/chat-thread.logic';

/**
 * What a model client reports while a reply arrives, in words the AI blocks understand. Map your
 * provider's own stream onto these (each SDK names them differently) and fold every event into the
 * conversation with `applyStreamEvent`. Every event names the assistant turn it belongs to.
 */
export type AiStreamEvent =
  /** A reply begins: an empty assistant turn joins the conversation, streaming. */
  | { type: 'start'; id: string; createdAt?: Date | undefined }
  /** More words of the reply. */
  | { type: 'text'; id: string; delta: string }
  /** More of the model's reasoning, before or between the words. */
  | { type: 'reasoning'; id: string; delta: string }
  /** The reasoning is over, after `duration` seconds when known. */
  | { type: 'reasoning-end'; id: string; duration?: number | undefined }
  /** A tool call began or changed: matched by its own id, added when new. */
  | { type: 'tool'; id: string; tool: AiChatToolCall }
  /** A source the reply draws on, matched by its id. */
  | { type: 'source'; id: string; source: ChatSourceItem }
  /** The reply arrived in full. */
  | { type: 'done'; id: string }
  /** The reader stopped it: what arrived stays. */
  | { type: 'stopped'; id: string }
  /** It failed, with the reason to show beside Retry. */
  | { type: 'error'; id: string; error: string };

function patch(
  turns: readonly AiChatTurn[],
  id: string,
  change: (turn: AiChatTurn) => AiChatTurn,
): AiChatTurn[] {
  return turns.map((turn) => (turn.id === id ? change(turn) : turn));
}

/** A reasoning still running ends when the words start, the reply ends or it fails. */
function settleReasoning(turn: AiChatTurn, status: 'done' | 'failed' = 'done'): AiChatTurn {
  if (turn.reasoning?.status !== 'thinking') return turn;
  return { ...turn, reasoning: { ...turn.reasoning, status } };
}

/** Tool calls still running when a reply stops or fails are not left spinning. */
function settleTools(turn: AiChatTurn): AiChatTurn {
  if (turn.tools?.some((tool) => tool.status === 'running') !== true) return turn;
  return {
    ...turn,
    tools: turn.tools.map((tool) =>
      tool.status === 'running' ? { ...tool, status: 'failed' as const } : tool,
    ),
  };
}

/**
 * The conversation with one stream event folded in. Pure: it never changes the array it gets, and
 * returns that same array when the event changes nothing, so it fits a `setState` updater or a
 * reducer. Only a reply that is still streaming takes events: once it is done, stopped or failed,
 * a late event for it changes nothing, and so does an event for a turn that is not there or that
 * the reader wrote. A second `start` for the same id is ignored, so a retried connection cannot
 * add a reply twice.
 */
export function applyStreamEvent(turns: readonly AiChatTurn[], event: AiStreamEvent): AiChatTurn[] {
  // Never changed in place: when an event changes nothing, the same array comes back, so React
  // skips the render.
  const unchanged = turns as AiChatTurn[];
  const target = turns.find((turn) => turn.id === event.id);
  if (event.type === 'start') {
    if (target !== undefined) return unchanged;
    return [
      ...turns,
      {
        id: event.id,
        role: 'assistant',
        content: '',
        status: 'streaming',
        createdAt: event.createdAt,
        feedback: null,
      },
    ];
  }
  // Only a reply still arriving takes events. A late chunk after it stopped, failed, finished or
  // was deleted, or an event that names one of the reader's own turns, changes nothing.
  if (target?.role !== 'assistant' || target.status !== 'streaming') return unchanged;
  switch (event.type) {
    case 'text':
      return patch(turns, event.id, (turn) => ({
        ...settleReasoning(turn),
        content: turn.content + event.delta,
      }));
    case 'reasoning':
      return patch(turns, event.id, (turn) => ({
        ...turn,
        reasoning: {
          text: (turn.reasoning?.text ?? '') + event.delta,
          status: 'thinking',
          duration: turn.reasoning?.duration,
        },
      }));
    case 'reasoning-end':
      return patch(turns, event.id, (turn) =>
        turn.reasoning === undefined
          ? turn
          : { ...turn, reasoning: { ...turn.reasoning, status: 'done', duration: event.duration } },
      );
    case 'tool':
      return patch(turns, event.id, (turn) => {
        const tools = turn.tools ?? [];
        const known = tools.some((tool) => tool.id === event.tool.id);
        return {
          ...turn,
          tools: known
            ? tools.map((tool) => (tool.id === event.tool.id ? { ...tool, ...event.tool } : tool))
            : [...tools, event.tool],
        };
      });
    case 'source':
      return patch(turns, event.id, (turn) => {
        const sources = turn.sources ?? [];
        return sources.some((source) => source.id === event.source.id)
          ? turn
          : { ...turn, sources: [...sources, event.source] };
      });
    case 'done':
      return patch(turns, event.id, (turn) => ({ ...settleReasoning(turn), status: undefined }));
    case 'stopped':
      return patch(turns, event.id, (turn) => ({
        ...settleTools(settleReasoning(turn)),
        status: 'stopped',
      }));
    case 'error':
      return patch(turns, event.id, (turn) => ({
        ...settleTools(settleReasoning(turn, 'failed')),
        status: 'error',
        error: event.error,
      }));
  }
}

/** The status a thread shows for this conversation: `streaming` while any reply is arriving. */
export function streamStatus(turns: readonly AiChatTurn[]): AiChatStatus {
  return turns.some((turn) => turn.role === 'assistant' && turn.status === 'streaming')
    ? 'streaming'
    : 'idle';
}
