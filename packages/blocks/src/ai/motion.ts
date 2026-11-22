/**
 * rectio AI blocks, motion variant: the same names and props as `@rectio/blocks/ai`, built on
 * `@rectio/motion/chat`. New messages rise into place, typing dots fade up, replies reveal at an
 * even pace, the command list rises in and the assistant panel slides in as it opens; reduced
 * motion renders the plain blocks.
 */
export * from './index';
export { AiChatThread } from './chat-thread/chat-thread.motion';
export { PromptComposer } from './prompt-composer/prompt-composer.motion';
export { ChatWorkspace } from './chat-workspace/chat-workspace.motion';
export { AssistantSidebar } from './assistant-sidebar/assistant-sidebar.motion';
export { AiMotionParts, MOTION_AI_PARTS } from './lib/motion-parts';
