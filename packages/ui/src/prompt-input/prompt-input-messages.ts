/** Every word the prompt input says, for apps that translate or reword them. */
export interface PromptInputMessages {
  /** Names the text field. */
  label: string;
  placeholder: string;
  send: string;
  stop: string;
  attach: string;
  /** Names the list of attached files. */
  attachments: string;
  /** Shown while attachments are still uploading, when Send waits for them. */
  waitingForUploads: string;
  /** The count near the limit. */
  left: (count: number) => string;
  over: (count: number) => string;
}

export const PROMPT_INPUT_MESSAGES: PromptInputMessages = {
  label: 'Message',
  placeholder: 'Ask anything',
  send: 'Send',
  stop: 'Stop',
  attach: 'Attach files',
  attachments: 'Attached files',
  waitingForUploads: 'Waiting for uploads',
  left: (count) => `${String(count)} ${count === 1 ? 'character' : 'characters'} left`,
  over: (count) => `${String(count)} over the limit`,
};
