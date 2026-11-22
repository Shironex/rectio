import { cn } from '../lib/cn';

/** Names the renderer gives its scrolling regions, for apps that translate them. */
export interface MarkdownMessages {
  /** Names a code block: "ts code", or "Code" without a language. */
  code: (lang: string | undefined) => string;
  table: string;
}

export const MARKDOWN_MESSAGES: MarkdownMessages = {
  code: (lang) => (lang === undefined ? 'Code' : `${lang} code`),
  table: 'Table',
};

/**
 * The caret at the end of text that is still arriving, as classes for an `::after`: a short accent
 * bar that breathes. Breathing is a fade, so it stays under reduced motion.
 */
export const streamingCaret = cn(
  'after:ms-0.5 after:inline-block after:h-4 after:w-0.5 after:translate-y-0.5',
  'after:rounded-badge after:bg-accent after:animate-breathe',
);
