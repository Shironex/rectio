'use client';

import { Collapsible as BaseCollapsible } from '@base-ui/react/collapsible';
import { CaretRightIcon } from '@phosphor-icons/react';
import type { ComponentProps } from 'react';

import { disclosureCaret, disclosurePanelMotion } from '../accordion/accordion';
import { cn } from '../lib/cn';
import { isExternalHref } from '../link/href';
import { Anchor } from '../link/link';
import { safeUrl } from '../markdown/markdown-parse';
import {
  type ChatSourceItem,
  type ChatSourceMessages,
  CHAT_SOURCE_MESSAGES,
  sourceSite,
} from './chat-source-messages';

const linkFocus = 'outline-offset-2 focus-visible:outline-2 focus-visible:outline-focus';

export interface ChatSourceChipProps extends Omit<ComponentProps<'a'>, 'href' | 'children'> {
  /** The citation's number, as it appears in the reply. */
  index: number;
  source: ChatSourceItem;
  messages?: Partial<ChatSourceMessages> | undefined;
}

/**
 * A citation inside a reply: the source's number in a small chip that links to it. Its
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
  const classes = cn(
    'relative ms-0.5 inline-flex h-6 min-w-6 items-center justify-center rounded-badge bg-accent-subtle px-1.5 align-baseline pointer-coarse:before:absolute pointer-coarse:before:-inset-2.5',
    'text-xs font-medium text-accent-strong numeric',
    href !== null && cn('hover:text-fg', linkFocus),
    className,
  );
  const content = <span>{index}</span>;
  if (href === null) {
    return (
      <span data-slot="chat-source-chip" className={classes}>
        <span aria-hidden>{index}</span>
        <span className="sr-only">{m.cite(index, source.title)}</span>
      </span>
    );
  }
  return (
    <Anchor
      data-slot="chat-source-chip"
      href={href}
      external={isExternalHref(href)}
      newTabHint=""
      aria-label={m.cite(index, source.title)}
      title={source.title}
      className={classes}
      {...props}
    >
      {content}
    </Anchor>
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
          'relative pointer-coarse:before:absolute pointer-coarse:before:inset-x-0 pointer-coarse:before:-inset-y-2 hover:text-fg',
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
                    <Anchor
                      href={href}
                      external={isExternalHref(href)}
                      newTabHint={` ${m.newTab}`}
                      className={cn(
                        'w-fit rounded-control text-sm font-medium text-fg underline decoration-line-strong underline-offset-4 hover:decoration-fg',
                        linkFocus,
                      )}
                    >
                      {source.title}
                    </Anchor>
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

export {
  type ChatSourceItem,
  type ChatSourceMessages,
  CHAT_SOURCE_MESSAGES,
  sourceSite,
} from './chat-source-messages';
