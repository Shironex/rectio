const DAY = 24 * 60 * 60 * 1000;

/** Midnight of a date's local day. */
export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Words the thread says, for apps that translate or reword them. */
export interface ChatThreadMessages {
  /** Names the conversation. */
  label: string;
  /** The button that returns to the newest message. */
  jumpToLatest: string;
}

export const CHAT_THREAD_MESSAGES: ChatThreadMessages = {
  label: 'Conversation',
  jumpToLatest: 'Jump to latest',
};

/** True when two times fall on the same calendar day, in the browser's time zone. */
export function isSameDay(a: Date, b: Date): boolean {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}

/**
 * The words for a day in a conversation: "Today", "Yesterday", the weekday within the last week,
 * then the date, with the year only when it is not this year.
 */
export function chatDayLabel(
  date: Date,
  { now = new Date(), locale }: { now?: Date | undefined; locale?: string | undefined } = {},
): string {
  const days = Math.round((startOfDay(now).getTime() - startOfDay(date).getTime()) / DAY);
  if (days >= 0 && days <= 1) {
    return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
      .format(-days, 'day')
      .replace(/^\p{Ll}/u, (letter) => letter.toLocaleUpperCase(locale));
  }
  if (days > 1 && days < 7)
    return new Intl.DateTimeFormat(locale, { weekday: 'long' }).format(date);
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    ...(date.getFullYear() === now.getFullYear() ? {} : { year: 'numeric' }),
  }).format(date);
}

/** What the announcer says, for apps that translate or reword it. */
export interface ChatAnnouncerMessages {
  /** Said once when a reply starts. */
  writing: (author: string) => string;
  /** Said once when a reply is complete. */
  done: (author: string, text: string) => string;
  /** Said when a reply stops with an error. */
  failed: (author: string) => string;
}

export const CHAT_ANNOUNCER_MESSAGES: ChatAnnouncerMessages = {
  writing: (author) => `${author} is writing a reply.`,
  done: (author, text) => `${author} said: ${text}`,
  failed: (author) => `${author} could not finish the reply.`,
};
