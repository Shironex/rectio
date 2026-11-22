/** Every word the message actions say, for apps that translate or reword them. */
export interface MessageActionsMessages {
  /** Names the toolbar. */
  toolbar: string;
  copy: string;
  copied: string;
  regenerate: string;
  edit: string;
  good: string;
  bad: string;
}

export const MESSAGE_ACTIONS_MESSAGES: MessageActionsMessages = {
  toolbar: 'Message actions',
  copy: 'Copy',
  copied: 'Copied',
  regenerate: 'Regenerate',
  edit: 'Edit',
  good: 'Good response',
  bad: 'Bad response',
};
