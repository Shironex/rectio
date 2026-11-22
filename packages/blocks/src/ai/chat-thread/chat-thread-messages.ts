/** Every word the chat thread block says, for apps that translate or reword them. */
export interface AiChatThreadMessages {
  /** Names the conversation for assistive technology. */
  label: string;
  /** The assistant's name, on its replies and in announcements. */
  assistant: string;
  emptyTitle: string;
  emptyDescription: string;
  /** Names the group of suggestion chips. */
  suggestions: string;
  /** Said by the typing dots before the first words of a reply. */
  typing: (assistant: string) => string;
}

export const AI_CHAT_THREAD_MESSAGES: AiChatThreadMessages = {
  label: 'Conversation',
  assistant: 'Assistant',
  emptyTitle: 'What can I help with?',
  emptyDescription: 'Ask a question, or start from one of these.',
  suggestions: 'Suggestions',
  typing: (assistant) => `${assistant} is typing`,
};
