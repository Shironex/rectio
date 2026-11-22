export type ReasoningStatus = 'thinking' | 'done' | 'failed';

/** Words the reasoning disclosure says, for apps that translate or reword them. */
export interface ReasoningMessages {
  thinking: string;
  /** The summary once done; `seconds` is undefined when no duration is known. */
  done: (seconds: number | undefined) => string;
  failed: string;
}

export const REASONING_MESSAGES: ReasoningMessages = {
  thinking: 'Thinking',
  done: (seconds) =>
    seconds === undefined
      ? 'Reasoning'
      : `Thought for ${String(Math.max(1, Math.round(seconds)))} ${Math.round(seconds) === 1 ? 'second' : 'seconds'}`,
  failed: 'Stopped thinking',
};
