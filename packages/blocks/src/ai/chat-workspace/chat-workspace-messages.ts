import type { AiChatGroupKey } from './chat-workspace.logic';

/** Every word the chat workspace says, for apps that translate or reword them. */
export interface ChatWorkspaceMessages {
  /** Names the list of chats, a navigation landmark. */
  chats: string;
  newChat: string;
  search: string;
  /** Names each date group. */
  groups: Record<AiChatGroupKey, string>;
  /** A chat with an empty title. */
  untitled: string;
  /** Names the menu button on a row. */
  more: (title: string) => string;
  rename: string;
  /** Names the field that edits a title. */
  renameField: string;
  pin: string;
  unpin: string;
  delete: string;
  deleteTitle: string;
  deleteDescription: (title: string) => string;
  deleteConfirm: string;
  cancel: string;
  emptyTitle: string;
  emptyDescription: string;
  noMatches: (query: string) => string;
  clearSearch: string;
  /** Said when a search settles. */
  results: (count: number) => string;
  /** The phone button that opens the list. */
  openChats: string;
  closeChats: string;
  loadingChats: string;
  loadingThread: string;
}

export const CHAT_WORKSPACE_MESSAGES: ChatWorkspaceMessages = {
  chats: 'Chats',
  newChat: 'New chat',
  search: 'Search chats',
  groups: {
    pinned: 'Pinned',
    today: 'Today',
    yesterday: 'Yesterday',
    week: 'Previous 7 days',
    older: 'Older',
  },
  untitled: 'Untitled chat',
  more: (title) => `More for ${title}`,
  rename: 'Rename',
  renameField: 'Chat title',
  pin: 'Pin',
  unpin: 'Unpin',
  delete: 'Delete',
  deleteTitle: 'Delete this chat?',
  deleteDescription: (title) =>
    `${title} and every message in it will be deleted. This cannot be undone.`,
  deleteConfirm: 'Delete chat',
  cancel: 'Cancel',
  emptyTitle: 'No chats yet',
  emptyDescription: 'Start a chat and it will be kept here.',
  noMatches: (query) => `No chats match ${query}`,
  clearSearch: 'Clear search',
  results: (count) => `${String(count)} ${count === 1 ? 'chat' : 'chats'} found`,
  openChats: 'Chats',
  closeChats: 'Close chats',
  loadingChats: 'Loading chats',
  loadingThread: 'Loading conversation',
};
