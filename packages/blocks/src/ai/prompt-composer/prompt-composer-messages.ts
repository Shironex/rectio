import { PROMPT_INPUT_MESSAGES, type PromptInputMessages } from '@rectio/ui';

/** Every word the prompt composer says, the prompt input's words included. */
export interface PromptComposerMessages extends PromptInputMessages {
  /** Names the model picker. */
  model: string;
  /** Names the list of slash commands. */
  commands: string;
  /** Said once when the command list opens or its matches change. */
  commandsFound: (count: number) => string;
  /** Shown in the list when nothing matches. */
  noCommands: string;
  /** The running count, such as `1,204 / 8,000 tokens`. */
  count: (count: string, limit: string | undefined, unit: 'tokens' | 'characters') => string;
  /** Said near and past the limit. */
  countLeft: (left: string, unit: 'tokens' | 'characters') => string;
  countOver: (over: string, unit: 'tokens' | 'characters') => string;
  /** Said when the text comes back under the limit. */
  countFits: string;
  /** Shown beside the count past the limit, such as `10 over`. */
  overBy: (over: string) => string;
}

export const PROMPT_COMPOSER_MESSAGES: PromptComposerMessages = {
  ...PROMPT_INPUT_MESSAGES,
  model: 'Model',
  commands: 'Commands',
  commandsFound: (count) =>
    count === 0
      ? 'No commands match'
      : `${String(count)} ${count === 1 ? 'command' : 'commands'}, up and down to choose, Enter to use`,
  noCommands: 'No commands match',
  count: (count, limit, unit) =>
    limit === undefined ? `${count} ${unit}` : `${count} / ${limit} ${unit}`,
  countLeft: (left, unit) => `${left} ${unit} left`,
  countOver: (over, unit) => `${over} ${unit} over the limit, shorten to send`,
  countFits: 'Within the limit again',
  overBy: (over) => `${over} over`,
};
