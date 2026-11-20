import {
  InfoIcon,
  LightbulbIcon,
  WarningCircleIcon,
  WarningIcon,
  type Icon,
} from '@phosphor-icons/react';
import { cn } from '@rectio/ui';
import type { ReactNode } from 'react';

import { mergeMessages } from '../lib/messages';

export type CalloutType = 'note' | 'tip' | 'warning' | 'danger';

const STYLE: Record<CalloutType, { icon: Icon; frame: string; icon_: string }> = {
  note: {
    icon: InfoIcon,
    frame: 'border-info-strong/25 bg-info-subtle/40',
    icon_: 'text-info-strong',
  },
  tip: {
    icon: LightbulbIcon,
    frame: 'border-positive-strong/25 bg-positive-subtle/40',
    icon_: 'text-positive-strong',
  },
  warning: {
    icon: WarningIcon,
    frame: 'border-warning-strong/30 bg-warning-subtle/40',
    icon_: 'text-warning-strong',
  },
  danger: {
    icon: WarningCircleIcon,
    frame: 'border-negative-strong/25 bg-negative-subtle/40',
    icon_: 'text-negative-strong',
  },
};

export interface CalloutProps {
  /** `note` adds context, `tip` a better way, `warning` a pitfall, `danger` data loss or security. */
  type?: CalloutType;
  /** A short title. Without one, the type's word (Note, Tip...) is the title. */
  title?: ReactNode;
  children: ReactNode;
  /** The block's words; pass the keys you change. See `CALLOUT_MESSAGES`. */
  messages?: Partial<CalloutMessages>;
  className?: string;
}

export interface CalloutMessages {
  /** The word of each type, used as the title when none is given. */
  types: Record<CalloutType, string>;
}

export const CALLOUT_MESSAGES: CalloutMessages = {
  types: { note: 'Note', tip: 'Tip', warning: 'Warning', danger: 'Danger' },
};

/**
 * A note set apart from the text. The icon and the title say what kind it is, so the tint is never
 * the only signal; the body takes paragraphs, lists, links and inline code.
 */
export function Callout({ type = 'note', title, children, messages, className }: CalloutProps) {
  const m = mergeMessages(CALLOUT_MESSAGES, messages);
  const word = m.types[type];
  const style = STYLE[type];
  const Glyph = style.icon;
  return (
    <aside
      // A note within the page's flow, not a landmark: pages hold many callouts.
      role="note"
      data-slot="callout"
      data-type={type}
      aria-label={typeof title === 'string' ? title : word}
      className={cn(
        'flex gap-3 rounded-panel border px-4 py-3.5 text-base text-fg',
        style.frame,
        className,
      )}
    >
      <Glyph aria-hidden weight="fill" className={cn('mt-0.5 size-5 shrink-0', style.icon_)} />
      <div className="flex min-w-0 flex-col gap-1">
        <p className="font-strong text-fg">{title ?? word}</p>
        <div className="text-pretty text-fg-muted [&_a]:font-medium [&_a]:underline [&_a]:underline-offset-4 [&>*+*]:mt-2">
          {children}
        </div>
      </div>
    </aside>
  );
}
