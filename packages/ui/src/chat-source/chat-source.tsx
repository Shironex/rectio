import { Collapsible as BaseCollapsible } from '@base-ui/react/collapsible';
import { CaretRightIcon } from '@phosphor-icons/react';
import type { ComponentProps, ReactNode } from 'react';

import { disclosureCaret, disclosurePanelMotion } from '../accordion/accordion';
import { cn } from '../lib/cn';
import { safeUrl } from '../markdown/markdown';

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
}

export const CHAT_SOURCE_MESSAGES: ChatSourceMessages = {
  count: (count) => `${String(count)} ${count === 1 ? 'source' : 'sources'}`,
  cite: (index, title) => `Source ${String(index)}: ${title}`,
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

const linkFocus = 'outline-offset-2 focus-visible:outline-2 focus-visible:outline-focus';

export interface ChatSourceChipProps extends Omit<ComponentProps<'a'>, 'href' | 'children'> {
  /** The citation's number, as it appears in the reply. */
  index: number;
  source: ChatSourceItem;
  messages?: Partial<ChatSourceMessages> | undefined;
}

/**
 * A citation inside a reply: the source's number and site in a small chip that links to it. Its
 * accessible name says the number and the title, so a screen reader hears what is cited.
 */
export function ChatSourceChip({
  index,
  source,
  messages,
  className,
  ...props
}: ChatSourceChipProps) {
  const m = { ...CHAT_SOURCE_MESSAGES, ...messages };
  const href = source.url === undefined ? null : safeUrl(source.url);
  const site = source.site ?? sourceSite(source.url ?? undefined);
  const classes = cn(
    'mx-0.5 inline-flex h-5 max-w-48 items-center gap-1 rounded-badge border border-line bg-surface-sunken px-1.5 align-baseline',
    'text-xs font-medium text-fg-muted numeric',
    href !== null && cn('hover:border-line-strong hover:text-fg', linkFocus),
    className,
  );
  const content = (
    <>
      <span className="text-fg">{index}</span>
      {site !== null && <span className="truncate max-sm:hidden">{site}</span>}
    </>
  );
  if (href === null) {
    return (
      <span
        data-slot="chat-source-chip"
        aria-label={m.cite(index, source.title)}
        role="note"
        className={classes}
      >
        {content}
      </span>
    );
  }
  return (
    <a
      data-slot="chat-source-chip"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={m.cite(index, source.title)}
      title={source.title}
      className={classes}
      {...props}
    >
      {content}
    </a>
  );
}

export interface ChatSourcesProps extends Omit<
  ComponentProps<typeof BaseCollapsible.Root>,
  'className' | 'children'
> {
  sources: readonly ChatSourceItem[];
  /** Words for the summary and the citations. */
  messages?: Partial<ChatSourceMessages> | undefined;
  className?: string | undefined;
}

/**
 * The sources behind a reply, folded under a quiet "3 sources" trigger. Open, each shows its
 * number (matching the chips in the text), title, site and the passage used. Links open in a new
 * tab so the conversation stays where it was.
 */
export function ChatSources({ sources, messages, className, ...props }: ChatSourcesProps) {
  const m = { ...CHAT_SOURCE_MESSAGES, ...messages };
  if (sources.length === 0) return null;
  return (
    <BaseCollapsible.Root
      data-slot="chat-sources"
      className={cn('flex flex-col gap-2', className)}
      {...props}
    >
      <BaseCollapsible.Trigger
        className={cn(
          'group/trigger inline-flex w-fit cursor-pointer items-center gap-1.5 rounded-control py-1 text-sm font-medium text-fg-muted',
          'pointer-coarse:min-h-(--rx-control-height-touch) hover:text-fg',
          linkFocus,
        )}
      >
        <CaretRightIcon
          aria-hidden
          weight="bold"
          className={cn(
            disclosureCaret,
            'size-3.5 group-data-panel-open/trigger:rotate-90 rtl:-scale-x-100',
          )}
        />
        {m.count(sources.length)}
      </BaseCollapsible.Trigger>
      <BaseCollapsible.Panel className={disclosurePanelMotion}>
        <ol
          role="list"
          className="flex flex-col divide-y divide-line rounded-panel border border-line"
        >
          {sources.map((source, index) => {
            const href = source.url === undefined ? null : safeUrl(source.url);
            const site = source.site ?? sourceSite(source.url);
            return (
              <li key={source.id} className="flex gap-3 px-3 py-2.5">
                <span
                  aria-hidden
                  className="w-4 shrink-0 text-end text-sm font-medium text-fg-subtle numeric"
                >
                  {index + 1}
                </span>
                <div className="flex min-w-0 flex-col gap-0.5">
                  {href === null ? (
                    <span className="text-sm font-medium text-fg">{source.title}</span>
                  ) : (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        'w-fit rounded-control text-sm font-medium text-fg underline decoration-line-strong underline-offset-4 hover:decoration-fg',
                        linkFocus,
                      )}
                    >
                      {source.title}
                    </a>
                  )}
                  {site !== null && <span className="text-xs text-fg-subtle">{site}</span>}
                  {source.excerpt !== undefined && (
                    <p className="mt-1 line-clamp-2 text-sm text-fg-muted text-pretty">
                      {source.excerpt}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </BaseCollapsible.Panel>
    </BaseCollapsible.Root>
  );
}
