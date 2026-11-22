/**
 * rectio AI blocks, plain variant: whole conversations built from the chat components in
 * `@rectio/ui`. Provider agnostic: the conversation is a prop and every action is a callback, so
 * any model and any streaming source feed them; `applyStreamEvent` folds a stream into the
 * conversation. The motioned twins have the same names and props in `@rectio/blocks/ai/motion`.
 *
 * Logic, stream helpers and words come from their server-safe modules, so a server component can
 * import them; the components are client modules.
 */
export {
  AiChatThread,
  type AiChatComposerSlot,
  type AiChatThreadMessages,
  type AiChatThreadProps,
} from './chat-thread/chat-thread';
export { AI_CHAT_THREAD_MESSAGES } from './chat-thread/chat-thread-messages';
export {
  announcedTurn,
  awaitingReply,
  chatRows,
  type AiChatRow,
  type AiChatStatus,
  type AiChatSuggestion,
  type AiChatToolCall,
  type AiChatTurn,
} from './chat-thread/chat-thread.logic';
export { applyStreamEvent, streamStatus, type AiStreamEvent } from './lib/stream';
export {
  AiPartsProvider,
  PLAIN_AI_PARTS,
  useAiParts,
  type AiEnterFrom,
  type AiEnterProps,
  type AiParts,
} from './lib/parts';
export { PromptComposer, type PromptComposerProps } from './prompt-composer/prompt-composer';
export {
  PROMPT_COMPOSER_MESSAGES,
  type PromptComposerMessages,
} from './prompt-composer/prompt-composer-messages';
export {
  countTone,
  estimateTokens,
  insertCommand,
  matchCommands,
  slashQuery,
  type AiComposerCommand,
  type AiComposerModel,
  type ComposerCountTone,
  type SlashQuery,
} from './prompt-composer/prompt-composer.logic';
export {
  AiChatList,
  ChatWorkspace,
  type AiChatListProps,
  type ChatWorkspaceProps,
} from './chat-workspace/chat-workspace';
export {
  CHAT_WORKSPACE_MESSAGES,
  type ChatWorkspaceMessages,
} from './chat-workspace/chat-workspace-messages';
export {
  MAX_CHAT_TITLE,
  cleanTitle,
  filterChats,
  focusAfterRemoval,
  groupChats,
  type AiChatGroup,
  type AiChatGroupKey,
  type AiChatSummary,
} from './chat-workspace/chat-workspace.logic';
export {
  AssistantSidebar,
  AssistantSidebarProvider,
  AssistantSidebarTrigger,
  useAssistantSidebar,
  type AssistantSidebarProps,
  type AssistantSidebarProviderProps,
  type AssistantSidebarTriggerProps,
} from './assistant-sidebar/assistant-sidebar';
export {
  ASSISTANT_SIDEBAR_MESSAGES,
  type AssistantSidebarMessages,
} from './assistant-sidebar/assistant-sidebar-messages';
export {
  assistantSizes,
  shortcutAction,
  type AssistantShortcutAction,
  type AssistantSizes,
} from './assistant-sidebar/assistant-sidebar.logic';
