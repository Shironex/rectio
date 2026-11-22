/** Every sentence a chat message says, for apps that translate or reword them. */
export interface ChatMessageMessages {
  /** The name read for the user's own messages when `author` is not given. */
  you: string;
  /** The name read for the assistant's messages when `author` is not given. */
  assistant: string;
  sending: string;
  /** Beside the name while a reply streams. */
  writing: string;
  stopped: string;
  /** Shown with `status: 'error'` when `error` is not given. */
  failed: string;
  retry: string;
  save: string;
  cancel: string;
  /** Names the edit field. */
  editLabel: string;
}

export const CHAT_MESSAGE_MESSAGES: ChatMessageMessages = {
  you: 'You',
  assistant: 'Assistant',
  sending: 'Sending',
  writing: 'Writing',
  stopped: 'Stopped',
  failed: 'The message could not be sent.',
  retry: 'Retry',
  save: 'Save and send',
  cancel: 'Cancel',
  editLabel: 'Edit message',
};
