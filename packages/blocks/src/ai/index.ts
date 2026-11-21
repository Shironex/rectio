/**
 * rectio AI blocks, plain variant: whole conversations built from the chat components in
 * `@rectio/ui`. Provider agnostic: the conversation is a prop and every action is a callback, so
 * any model and any streaming source feed them. The motioned twins have the same names and props
 * in `@rectio/blocks/ai/motion`.
 */
export {
  AI_CHAT_THREAD_MESSAGES,
  AiChatThread,
  announcedTurn,
  awaitingReply,
  chatRows,
  type AiChatRow,
  type AiChatStatus,
  type AiChatSuggestion,
  type AiChatThreadMessages,
  type AiChatThreadProps,
  type AiChatToolCall,
  type AiChatTurn,
} from './chat-thread/chat-thread';
export { AiPartsProvider, PLAIN_AI_PARTS, useAiParts, type AiParts } from './lib/parts';
