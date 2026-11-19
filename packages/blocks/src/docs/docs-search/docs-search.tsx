import { Autocomplete } from '@base-ui/react/autocomplete';
import { Dialog as BaseDialog } from '@base-ui/react/dialog';
import {
  ClockCounterClockwiseIcon,
  FileTextIcon,
  HashIcon,
  MagnifyingGlassIcon,
} from '@phosphor-icons/react';
import {
  Kbd,
  KbdShortcut,
  Spinner,
  ariaKeyShortcut,
  cn,
  useIsMac,
  usePortalContainer,
  useShortcut,
} from '@rectio/ui';
import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';

import {
  groupResults,
  matchRanges,
  pushRecent,
  readRecent,
  writeRecent,
  type DocsSearchProvider,
  type DocsSearchResult,
} from './docs-search.logic';

export interface DocsSearchProps {
  /** Finds results for a query: the local index, Algolia, Orama, a server route. */
  search: DocsSearchProvider;
  /** Goes to a result. Default a full page load; pass your router's push. */
  onNavigate?: ((href: string) => void) | undefined;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Opens the search from anywhere. Default `mod+k`; null to bind nothing. */
  shortcut?: string | null;
  /** Remembers the last few results the reader opened. Default on; null to keep none. */
  recentKey?: string | null;
  /** Shown before the reader types and when there is nothing recent, such as popular pages. */
  suggestions?: readonly DocsSearchResult[] | undefined;
  /** Wait before searching, in milliseconds, so a remote provider is not called per key. */
  debounce?: number;
  label?: string;
  placeholder?: string;
  /** The words in the trigger. Default "Search docs". */
  triggerLabel?: string;
  /** Draws the trigger. Pass false to open the search only with the shortcut or `open`. */
  trigger?: boolean;
  triggerClassName?: string;
  className?: string;
}

type Status = 'idle' | 'loading' | 'done' | 'error';

/** The text with the query's words marked, so the reader sees why a result came up. */
function Marked({ text, query }: { text: string; query: string }) {
  const ranges = matchRanges(text, query);
  if (ranges.length === 0) return text;
  const parts: ReactNode[] = [];
  let at = 0;
  for (const [start, end] of ranges) {
    if (start > at) parts.push(text.slice(at, start));
    parts.push(
      <mark key={start} className="bg-transparent font-strong text-accent-strong">
        {text.slice(start, end)}
      </mark>,
    );
    at = end;
  }
  if (at < text.length) parts.push(text.slice(at));
  return parts;
}

/**
 * Docs search in a dialog, opened by its field-shaped trigger or the shortcut. Results come from
 * the provider you pass, grouped by section, with the query's words marked in titles and excerpts.
 * Before typing it lists recent searches (kept in this browser) or your suggestions. Arrow keys
 * move, Enter opens, Escape closes. Like a command menu it opens without an entrance: it is used
 * many times a session and the field is ready the moment the shortcut is pressed.
 */
export function DocsSearch({
  search,
  onNavigate,
  open: openProp,
  onOpenChange,
  shortcut = 'mod+k',
  recentKey = 'rectio-docs-recent-searches',
  suggestions,
  debounce = 120,
  label = 'Search the docs',
  placeholder = 'Search the docs',
  triggerLabel = 'Search docs',
  trigger = true,
  triggerClassName,
  className,
}: DocsSearchProps) {
  const [openState, setOpenState] = useState(false);
  const open = openProp ?? openState;
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<readonly DocsSearchResult[]>([]);
  const [status, setStatus] = useState<Status>('idle');
  const [recent, setRecent] = useState<DocsSearchResult[]>([]);
  const container = usePortalContainer();
  const mac = useIsMac();
  const hintsId = useId();
  const key = recentKey ?? undefined;
  const latest = useRef(search);
  useEffect(() => {
    latest.current = search;
  });

  const setOpen = (next: boolean) => {
    if (openProp === undefined) setOpenState(next);
    onOpenChange?.(next);
    if (next) setRecent(readRecent(key));
    else setQuery('');
  };

  useShortcut(shortcut, () => {
    if (!open && document.querySelector('[role="dialog"][aria-modal="true"]') !== null) return;
    setOpen(!open);
  });

  const changeQuery = (next: string) => {
    setQuery(next);
    // Loading starts with the keystroke, so the field never shows the last results as current.
    setStatus(next.trim() === '' ? 'idle' : 'loading');
  };

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed === '') return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      Promise.resolve(latest.current(trimmed, controller.signal))
        .then((found) => {
          if (controller.signal.aborted) return;
          setResults(found);
          setStatus('done');
        })
        .catch(() => {
          if (!controller.signal.aborted) setStatus('error');
        });
    }, debounce);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, debounce]);

  const showingRecent = query.trim() === '';
  const groups = useMemo(() => {
    if (!showingRecent) return status === 'done' ? groupResults(results) : [];
    if (recent.length > 0) return [{ label: 'Recent', items: recent }];
    if (suggestions !== undefined && suggestions.length > 0) {
      return [{ label: 'Suggested', items: [...suggestions] }];
    }
    return [];
  }, [showingRecent, status, results, recent, suggestions]);
  const count = groups.reduce((sum, group) => sum + group.items.length, 0);

  const go = (result: DocsSearchResult) => {
    const next = pushRecent(readRecent(key), result);
    writeRecent(key, next);
    setRecent(next);
    setOpen(false);
    if (onNavigate === undefined) window.location.assign(result.href);
    else onNavigate(result.href);
  };

  return (
    <BaseDialog.Root
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
      }}
    >
      {trigger && (
        <BaseDialog.Trigger
          data-slot="docs-search-trigger"
          aria-keyshortcuts={shortcut === null ? undefined : ariaKeyShortcut(shortcut, mac)}
          className={cn(
            'relative inline-flex h-(--rx-button-height-md) cursor-pointer items-center gap-2 rounded-(--rx-field-radius) px-2.5',
            'border border-line bg-surface text-sm text-fg-subtle',
            'transition-colors duration-fast ease-standard hover:border-line-strong hover:text-fg-muted',
            'outline-offset-2 focus-visible:outline-2 focus-visible:outline-focus',
            'pointer-coarse:h-(--rx-button-height-touch)',
            'max-sm:size-(--rx-button-height-md) max-sm:justify-center max-sm:border-transparent max-sm:bg-transparent max-sm:px-0 max-sm:text-fg-muted max-sm:hover:bg-surface-hover pointer-coarse:max-sm:size-(--rx-button-height-touch)',
            triggerClassName,
          )}
        >
          <MagnifyingGlassIcon aria-hidden weight="bold" className="size-4 shrink-0" />
          <span className="max-sm:sr-only sm:min-w-36 sm:text-start">{triggerLabel}</span>
          {shortcut !== null && (
            <KbdShortcut shortcut={shortcut} className="ms-auto max-sm:hidden" />
          )}
        </BaseDialog.Trigger>
      )}
      <BaseDialog.Portal container={container}>
        <BaseDialog.Backdrop className="fixed inset-0 z-50 bg-scrim" />
        <BaseDialog.Viewport className="fixed inset-0 z-50 flex items-start justify-center p-2 pt-4 sm:p-4 sm:pt-24">
          <BaseDialog.Popup
            aria-label={label}
            data-slot="docs-search"
            className={cn(
              'flex max-h-full w-(--rx-command-width) max-w-full flex-col overflow-hidden',
              'rounded-(--rx-dialog-radius) border border-line bg-surface-overlay text-fg shadow-(--rx-dialog-shadow)',
              'outline-none',
              className,
            )}
          >
            <Autocomplete.Root
              open
              inline
              items={groups}
              filter={null}
              itemToStringValue={(item: DocsSearchResult) => item.title}
              value={query}
              onValueChange={changeQuery}
              autoHighlight="always"
              keepHighlight
            >
              <div className="flex items-center gap-2 border-b border-line px-4">
                {status === 'loading' ? (
                  <Spinner size="sm" label="Searching" className="shrink-0" />
                ) : (
                  <MagnifyingGlassIcon
                    aria-hidden
                    weight="bold"
                    className="size-4 shrink-0 text-fg-subtle"
                  />
                )}
                <Autocomplete.Input
                  aria-label={label}
                  aria-describedby={hintsId}
                  placeholder={placeholder}
                  data-slot="docs-search-input"
                  className={cn(
                    'h-12 w-full min-w-0 bg-transparent text-base text-fg outline-none',
                    'placeholder:text-fg-subtle pointer-coarse:text-lg',
                  )}
                />
                <BaseDialog.Close
                  tabIndex={-1}
                  className={cn(
                    'sr-only pointer-coarse:not-sr-only pointer-coarse:-me-2 pointer-coarse:inline-flex',
                    'pointer-coarse:h-(--rx-control-height-touch) pointer-coarse:shrink-0 pointer-coarse:items-center pointer-coarse:px-2',
                    'pointer-coarse:text-base pointer-coarse:font-medium pointer-coarse:text-accent-strong',
                  )}
                >
                  Close
                </BaseDialog.Close>
              </div>

              <div className="max-h-(--rx-command-list-height) min-h-0 overflow-y-auto overscroll-contain">
                <Autocomplete.Status className="sr-only">
                  {showingRecent
                    ? null
                    : status === 'loading'
                      ? 'Searching'
                      : status === 'error'
                        ? 'Search failed'
                        : count === 0
                          ? 'No results'
                          : count === 1
                            ? '1 result'
                            : `${String(count)} results`}
                </Autocomplete.Status>
                {status === 'error' ? (
                  <Note title="Search is not available right now">
                    Check your connection and try again, or browse the navigation.
                  </Note>
                ) : (
                  <Autocomplete.Empty>
                    {showingRecent ? (
                      <Note title="Search the docs">
                        Pages, sections and API names. Results you open show up here next time.
                      </Note>
                    ) : status === 'done' ? (
                      <Note title={`No results for “${query.trim()}”`}>
                        Try fewer words, or the name of a function or option.
                      </Note>
                    ) : null}
                  </Autocomplete.Empty>
                )}
                <Autocomplete.List className="p-1 empty:p-0">
                  {(group: { label: string; items: DocsSearchResult[] }) => (
                    <Autocomplete.Group
                      key={group.label}
                      items={group.items}
                      className="not-first:mt-1"
                    >
                      <div className="flex items-center justify-between px-3 pt-2 pb-1">
                        <Autocomplete.GroupLabel className="text-xs font-medium tracking-caps text-fg-subtle uppercase select-none">
                          {group.label}
                        </Autocomplete.GroupLabel>
                        {group.label === 'Recent' && showingRecent && (
                          <button
                            type="button"
                            onClick={() => {
                              writeRecent(key, []);
                              setRecent([]);
                            }}
                            className="rounded-control text-xs text-fg-muted underline-offset-4 outline-offset-2 hover:text-fg hover:underline focus-visible:outline-2 focus-visible:outline-focus"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                      <Autocomplete.Collection>
                        {(item: DocsSearchResult) => (
                          <ResultRow
                            key={item.id}
                            item={item}
                            query={query}
                            recent={showingRecent && group.label === 'Recent'}
                            onOpen={go}
                          />
                        )}
                      </Autocomplete.Collection>
                    </Autocomplete.Group>
                  )}
                </Autocomplete.List>
              </div>

              <p id={hintsId} className="sr-only">
                Arrow keys move through the results, Enter opens one, Escape closes.
              </p>
              <div
                aria-hidden
                className="flex items-center gap-4 border-t border-line bg-(--rx-dialog-footer-background) px-4 py-2 text-xs text-fg-muted pointer-coarse:hidden"
              >
                <span className="flex items-center gap-1.5">
                  <span className="flex gap-0.5">
                    <Kbd>↑</Kbd>
                    <Kbd>↓</Kbd>
                  </span>
                  <span>to move</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Kbd>↵</Kbd>
                  <span>to open</span>
                </span>
                <span className="ms-auto flex items-center gap-1.5">
                  <Kbd>esc</Kbd>
                  <span>to close</span>
                </span>
              </div>
            </Autocomplete.Root>
          </BaseDialog.Popup>
        </BaseDialog.Viewport>
      </BaseDialog.Portal>
    </BaseDialog.Root>
  );
}

function Note({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-1 px-6 py-10 text-center">
      <p className="text-sm font-medium text-fg">{title}</p>
      <p className="max-w-xs text-sm text-pretty text-fg-muted">{children}</p>
    </div>
  );
}

function ResultRow({
  item,
  query,
  recent,
  onOpen,
}: {
  item: DocsSearchResult;
  query: string;
  recent: boolean;
  onOpen: (item: DocsSearchResult) => void;
}) {
  const Icon = recent
    ? ClockCounterClockwiseIcon
    : item.page === undefined
      ? FileTextIcon
      : HashIcon;
  return (
    <Autocomplete.Item
      value={item}
      onClick={() => {
        onOpen(item);
      }}
      data-slot="docs-search-result"
      className={cn(
        'flex cursor-pointer scroll-my-1 items-start gap-3 rounded-(--rx-field-radius) px-3 py-2 text-fg outline-none select-none',
        'pointer-coarse:min-h-(--rx-field-height-touch)',
        'data-highlighted:bg-surface-hover',
      )}
    >
      <Icon
        aria-hidden
        weight="bold"
        className="mt-0.5 size-4 shrink-0 text-fg-subtle in-data-highlighted:text-accent-strong"
      />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex min-w-0 items-baseline gap-2 text-base">
          <span className="truncate">
            <Marked text={item.title} query={query} />
          </span>
          {item.page !== undefined && (
            <span className="shrink-0 truncate text-sm text-fg-subtle in-data-highlighted:text-fg-muted">
              {item.page}
            </span>
          )}
        </span>
        {item.excerpt !== undefined && item.excerpt !== '' && (
          <span className="line-clamp-2 text-sm text-fg-muted">
            <Marked text={item.excerpt} query={query} />
          </span>
        )}
      </span>
    </Autocomplete.Item>
  );
}
