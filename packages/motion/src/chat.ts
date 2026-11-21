/**
 * The motion add-on for chat, a third entry point so an app that never shows a conversation
 * never loads it:
 *
 *   import { ChatSources, Markdown, PromptInput } from '@rectio/ui';
 *   import { ChatLoader, ChatMessage, ChatThread, StreamingText } from '@rectio/motion/chat';
 *
 * Each export has the same name and props as its plain twin. New messages rise into place (the
 * ones a thread opens with stay still), typing dots fade up, and streamed text reveals at an even
 * pace instead of in bursts. No Motion library code: every effect is a Web Animations call or a
 * frame loop, and reduced motion renders the plain components.
 */
export { MotionPreferenceProvider, usePlainMotion, type MotionPreference } from './lib/mode';
export {
  ChatLoader,
  ChatMessage,
  ChatThread,
  StreamingText,
  useSmoothText,
  type ChatLoaderProps,
  type ChatMessageProps,
  type ChatThreadProps,
  type StreamingTextProps,
} from './chat/chat';
