import type { ReactNode } from 'react';

/** One document, page or record a reply drew on. */
export interface ChatSourceItem {
  id: string;
  title: string;
  /** Where it lives. Unsafe protocols are dropped and the source shows without a link. */
  url?: string | undefined;
  /** The site or system it came from. Derived from `url` when omitted. */
  site?: string | undefined;
  /** The passage the reply used, a sentence or two. */
  excerpt?: ReactNode;
}

/** Words the sources say, for apps that translate or reword them. */
export interface ChatSourceMessages {
  /** The summary of the list: "3 sources". */
  count: (count: number) => string;
  /** The accessible name of a citation chip. */
  cite: (index: number, title: string) => string;
  /** Said after a source that opens in a new tab. */
  newTab: string;
}

export const CHAT_SOURCE_MESSAGES: ChatSourceMessages = {
  count: (count) => `${String(count)} ${count === 1 ? 'source' : 'sources'}`,
  cite: (index, title) => `Source ${String(index)}: ${title}`,
  newTab: '(opens in a new tab)',
};

/** `https://www.example.com/a` to `example.com`; null for an address that is not one. */
export function sourceSite(url: string | undefined): string | null {
  if (url === undefined) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}
