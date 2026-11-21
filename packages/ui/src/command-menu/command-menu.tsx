'use client';

import { Autocomplete } from '@base-ui/react/autocomplete';
import { Dialog as BaseDialog } from '@base-ui/react/dialog';
import { MagnifyingGlassIcon } from '@phosphor-icons/react';
import {
  createContext,
  use,
  useId,
  useMemo,
  useState,
  type ComponentProps,
  type ReactElement,
  type ReactNode,
} from 'react';

import { Kbd, KbdShortcut } from '../kbd/kbd';
import { ariaKeyShortcut } from '../kbd/shortcut';
import { useIsMac, useShortcut } from '../kbd/use-shortcut';
import { cn } from '../lib/cn';
import { usePortalContainer } from '../theme-scope/theme-scope';
import { fuzzyScore } from './fuzzy';
import { useScrollEdges } from './scroll-edges';

export interface CommandItem {
  /** Unique across the whole menu. */
  id: string;
  /** What the command does or where it goes: "New invoice", "Go to Payables". */
  label: string;
  /** Other words that should find it: synonyms, codes, the old name. Matched but not shown. */
  keywords?: readonly string[];
  /** A 16px icon before the label. */
  icon?: ReactNode;
  /** Secondary text at the end, such as the section a page lives in or a record number. */
  hint?: ReactNode;
  /** The command's own shortcut, such as `mod+shift+i`, shown as keycaps. The app binds it. */
  shortcut?: string;
  disabled?: boolean;
  /** Runs after the menu closes. */
  onSelect: () => void;
}

export interface CommandGroup {
  /** Names the group: drawn above it and announced with it. */
  label: string;
  items: readonly CommandItem[];
}

export interface CommandMenuProps {
  groups: readonly CommandGroup[];
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /**
   * Opens and closes the menu from anywhere on the page. Default `mod+k` (Command K on a Mac,
   * Control K elsewhere); null to bind nothing.
   */
  shortcut?: string | null;
  /** Accessible name of the dialog and the search field. */
  label?: string;
  placeholder?: string;
  /** What to show when nothing matches. Receives the query. */
  emptyState?: (query: string) => ReactNode;
  /** Shows the keyboard hints under the list on screens with a pointer. Default true. */
  showHints?: boolean;
  /** The keyboard hints in words, read with the search field. */
  hintsLabel?: string;
  /** Name of the close button, shown on touch screens. Default "Close". */
  closeLabel?: string;
  /** What is announced as the results change. Default "1 result", "3 results", "No results". */
  formatCount?: (count: number) => string;
  /** A `CommandMenuTrigger`, or anything rendered inside the dialog's root. */
  children?: ReactNode;
  className?: string;
}

interface Ranked {
  item: CommandItem;
  indices: number[];
}

/** The groups and items that match, best first within each group; groups keep their order. */
export function filterCommands(
  groups: readonly CommandGroup[],
  query: string,
): { label: string; items: Ranked[] }[] {
  const trimmed = query.trim();
  return groups
    .map((group) => {
      if (trimmed === '') {
        return { label: group.label, items: group.items.map((item) => ({ item, indices: [] })) };
      }
      const ranked = group.items
        .map((item) => ({ item, match: fuzzyScore(trimmed, item.label, item.keywords) }))
        .filter(
          (entry): entry is { item: CommandItem; match: NonNullable<typeof entry.match> } =>
            entry.match !== null,
        )
        .sort((a, b) => b.match.score - a.match.score)
        .map(({ item, match }) => ({ item, indices: match.indices }));
      return { label: group.label, items: ranked };
    })
    .filter((group) => group.items.length > 0);
}

/** The label with the matched characters marked, so the user sees why a command came up. */
function Highlighted({ text, indices }: { text: string; indices: number[] }) {
  if (indices.length === 0) return text;
  const marks = new Set(indices);
  const parts: ReactNode[] = [];
  let run = '';
  let marked = marks.has(0);
  const flush = (index: number) => {
    if (run === '') return;
    parts.push(
      marked ? (
        <mark key={index} className="bg-transparent font-strong text-fg">
          {run}
        </mark>
      ) : (
        run
      ),
    );
    run = '';
  };
  for (let i = 0; i < text.length; i += 1) {
    const isMark = marks.has(i);
    if (isMark !== marked) {
      flush(i);
      marked = isMark;
    }
    run += text.charAt(i);
  }
  flush(text.length);
  return parts;
}

type Handle = ReturnType<typeof BaseDialog.createHandle>;
const HandleContext = createContext<Handle | null>(null);

const defaultCount = (count: number) =>
  count === 0 ? 'No results' : count === 1 ? '1 result' : `${String(count)} results`;

/**
 * A command palette: one field to jump anywhere or run any action. Type to filter (fuzzy, so
 * `nwinv` finds "New invoice"), ArrowUp and ArrowDown move, Enter runs, Escape closes. It opens
 * without an entrance on purpose: it is used dozens of times a day, and the field is ready the
 * moment the shortcut is pressed.
 */
export function CommandMenu({
  groups,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  shortcut = 'mod+k',
  label = 'Command menu',
  placeholder = 'Search pages and actions',
  emptyState,
  showHints = true,
  closeLabel = 'Close',
  hintsLabel = 'Arrow keys move through the results, Enter runs one, Escape closes.',
  formatCount = defaultCount,
  children,
  className,
}: CommandMenuProps) {
  const [openState, setOpenState] = useState(defaultOpen);
  const open = openProp ?? openState;
  const [query, setQuery] = useState('');
  const container = usePortalContainer();
  const hintsId = useId();
  // The trigger links to the dialog through a handle, so the app inside `children` is not inside
  // the dialog's root: a root wrapped around the app would count every dialog and sheet in it as
  // nested, and Base UI draws no backdrop for a nested one.
  const [handle] = useState(() => BaseDialog.createHandle());
  const [listRef, edges] = useScrollEdges();

  const setOpen = (next: boolean) => {
    if (openProp === undefined) setOpenState(next);
    onOpenChange?.(next);
    if (!next) setQuery('');
  };

  useShortcut(shortcut, () => {
    // Never stack the menu over another dialog or sheet the user is in.
    if (!open && document.querySelector('[role="dialog"][aria-modal="true"]') !== null) return;
    setOpen(!open);
  });

  const results = useMemo(() => filterCommands(groups, query), [groups, query]);
  const resultCount = results.reduce((sum, group) => sum + group.items.length, 0);
  const indicesById = useMemo(
    () => new Map(results.flatMap((group) => group.items.map((r) => [r.item.id, r.indices]))),
    [results],
  );
  const filteredItems = useMemo(
    () => results.map((group) => ({ label: group.label, items: group.items.map((r) => r.item) })),
    [results],
  );

  const run = (item: CommandItem) => {
    if (item.disabled === true) return;
    setOpen(false);
    item.onSelect();
  };

  return (
    <HandleContext value={handle}>
      {children}
      <BaseDialog.Root
        handle={handle}
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
        }}
      >
        <BaseDialog.Portal container={container}>
          <BaseDialog.Backdrop className="fixed inset-0 z-50 bg-scrim" />
          <BaseDialog.Viewport className="fixed inset-0 z-50 flex items-start justify-center p-2 pt-4 sm:p-4 sm:pt-24">
            <BaseDialog.Popup
              aria-label={label}
              data-slot="command-menu"
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
                items={groups as CommandGroup[]}
                filteredItems={filteredItems}
                filter={null}
                itemToStringValue={(item: CommandItem) => item.label}
                value={query}
                onValueChange={setQuery}
                autoHighlight="always"
                keepHighlight
              >
                <div className="flex items-center gap-2 border-b border-line px-4">
                  <MagnifyingGlassIcon
                    aria-hidden
                    weight="bold"
                    className="size-4 shrink-0 text-fg-subtle"
                  />
                  <Autocomplete.Input
                    aria-label={label}
                    aria-describedby={showHints ? hintsId : undefined}
                    placeholder={placeholder}
                    data-slot="command-menu-input"
                    className={cn(
                      'h-12 w-full min-w-0 bg-transparent text-base text-fg outline-none',
                      'placeholder:text-fg-subtle pointer-coarse:text-lg',
                    )}
                  />
                  {/* Tab skips it: Escape and the backdrop close. On touch, with no Escape key, it shows. */}
                  <BaseDialog.Close
                    tabIndex={-1}
                    className={cn(
                      'sr-only pointer-coarse:not-sr-only pointer-coarse:-me-2 pointer-coarse:inline-flex',
                      'pointer-coarse:h-(--rx-control-height-touch) pointer-coarse:shrink-0 pointer-coarse:items-center pointer-coarse:px-2',
                      'pointer-coarse:text-base pointer-coarse:font-medium pointer-coarse:text-accent-strong',
                    )}
                  >
                    {closeLabel}
                  </BaseDialog.Close>
                </div>

                {/* The ends fade while rows hide past them, so a long list reads as one that scrolls. */}
                <div
                  ref={listRef}
                  data-slot="command-list"
                  data-overflow-start={edges.start ? '' : undefined}
                  data-overflow-end={edges.end ? '' : undefined}
                  className={cn(
                    'max-h-(--rx-command-list-height) min-h-0 overflow-y-auto overscroll-contain',
                    'data-overflow-start:mask-t-from-85% data-overflow-end:mask-b-from-85%',
                  )}
                >
                  <Autocomplete.Status className="sr-only">
                    {query.trim() === '' ? null : formatCount(resultCount)}
                  </Autocomplete.Status>
                  <Autocomplete.Empty>
                    <div className="flex flex-col items-center gap-1 px-4 py-10 text-center">
                      {emptyState === undefined ? (
                        <>
                          <p className="text-sm font-medium text-fg">
                            No results for “{query.trim()}”
                          </p>
                          <p className="text-sm text-fg-muted">
                            Try a shorter word, or the name of a page.
                          </p>
                        </>
                      ) : (
                        emptyState(query.trim())
                      )}
                    </div>
                  </Autocomplete.Empty>
                  <Autocomplete.List className="p-1 empty:p-0">
                    {(group: CommandGroup) => (
                      <Autocomplete.Group
                        key={group.label}
                        items={group.items as CommandItem[]}
                        className="not-first:mt-1"
                      >
                        <Autocomplete.GroupLabel className="px-3 pt-2 pb-1 text-xs font-medium tracking-caps text-fg-subtle uppercase select-none">
                          {group.label}
                        </Autocomplete.GroupLabel>
                        <Autocomplete.Collection>
                          {(item: CommandItem) => (
                            <CommandRow
                              key={item.id}
                              item={item}
                              indices={indicesById.get(item.id) ?? []}
                              onRun={run}
                            />
                          )}
                        </Autocomplete.Collection>
                      </Autocomplete.Group>
                    )}
                  </Autocomplete.List>
                </div>

                {showHints && (
                  <p id={hintsId} className="sr-only">
                    {hintsLabel}
                  </p>
                )}
                {showHints && (
                  <div
                    aria-hidden
                    className="flex items-center gap-4 border-t border-line bg-(--rx-dialog-footer-background) px-4 py-2 text-xs text-fg-muted pointer-coarse:hidden"
                  >
                    <span className="flex items-center gap-1.5">
                      <span className="flex gap-0.5" aria-hidden>
                        <Kbd>↑</Kbd>
                        <Kbd>↓</Kbd>
                      </span>
                      <span>to move</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Kbd aria-hidden>↵</Kbd>
                      <span>to run</span>
                    </span>
                    <span className="ms-auto flex items-center gap-1.5">
                      <Kbd aria-hidden>esc</Kbd>
                      <span>to close</span>
                    </span>
                  </div>
                )}
              </Autocomplete.Root>
            </BaseDialog.Popup>
          </BaseDialog.Viewport>
        </BaseDialog.Portal>
      </BaseDialog.Root>
    </HandleContext>
  );
}

function CommandRow({
  item,
  indices,
  onRun,
}: {
  item: CommandItem;
  indices: number[];
  onRun: (item: CommandItem) => void;
}) {
  const mac = useIsMac();
  return (
    <Autocomplete.Item
      value={item}
      disabled={item.disabled}
      onClick={() => {
        onRun(item);
      }}
      aria-keyshortcuts={
        item.shortcut === undefined ? undefined : ariaKeyShortcut(item.shortcut, mac)
      }
      data-slot="command-menu-item"
      className={cn(
        'flex cursor-pointer scroll-my-1 items-center gap-3 rounded-(--rx-field-radius) px-3 py-2 text-base text-fg outline-none select-none',
        'pointer-coarse:min-h-(--rx-field-height-touch)',
        'data-highlighted:bg-accent-subtle data-disabled:cursor-default data-disabled:text-fg-disabled',
      )}
    >
      {item.icon !== undefined && (
        <span
          aria-hidden
          className="flex size-4 shrink-0 items-center justify-center text-fg-subtle in-data-highlighted:text-fg-muted"
        >
          {item.icon}
        </span>
      )}
      <span className="min-w-0 flex-1 truncate">
        <Highlighted text={item.label} indices={indices} />
      </span>
      {item.hint !== undefined && (
        <span className="shrink-0 text-sm text-fg-subtle in-data-highlighted:text-fg-muted">
          {item.hint}
        </span>
      )}
      {item.shortcut !== undefined && (
        <KbdShortcut shortcut={item.shortcut} className="shrink-0 pointer-coarse:hidden" />
      )}
    </Autocomplete.Item>
  );
}

export type CommandMenuTriggerProps = Omit<
  ComponentProps<typeof BaseDialog.Trigger>,
  'className' | 'children'
> & {
  className?: string;
  /** The words in the field. Default "Search". */
  children?: ReactNode;
  /** The shortcut to show, matching the menu's. Default `mod+k`; null to hide it. */
  shortcut?: string | null;
};

/**
 * A field-shaped button that opens the menu, with its shortcut, for the header of an app. Put it
 * inside `CommandMenu`. Below the small breakpoint it shrinks to the icon.
 */
export function CommandMenuTrigger({
  className,
  children = 'Search',
  shortcut = 'mod+k',
  ...props
}: CommandMenuTriggerProps): ReactElement {
  const mac = useIsMac();
  const handle = use(HandleContext);
  return (
    <BaseDialog.Trigger
      {...(handle === null ? {} : { handle })}
      data-slot="command-menu-trigger"
      aria-keyshortcuts={shortcut === null ? undefined : ariaKeyShortcut(shortcut, mac)}
      className={cn(
        'relative inline-flex h-(--rx-button-height-md) cursor-pointer items-center gap-2 rounded-(--rx-field-radius) px-2.5',
        'border border-line bg-surface text-sm text-fg-subtle',
        'transition-colors duration-fast ease-standard hover:border-line-strong hover:text-fg-muted',
        'outline-offset-2 focus-visible:outline-2 focus-visible:outline-focus',
        'pointer-coarse:h-(--rx-button-height-touch)',
        // On a phone it is one more icon button in the header, drawn like its neighbours.
        'max-sm:size-(--rx-button-height-md) max-sm:justify-center max-sm:border-transparent max-sm:bg-transparent max-sm:px-0 max-sm:text-fg-muted max-sm:hover:bg-surface-hover pointer-coarse:max-sm:size-(--rx-button-height-touch)',
        className,
      )}
      {...props}
    >
      <MagnifyingGlassIcon aria-hidden weight="bold" className="size-4 shrink-0" />
      <span className="max-sm:sr-only sm:min-w-28 sm:text-start">{children}</span>
      {shortcut !== null && <KbdShortcut shortcut={shortcut} className="ms-auto max-sm:hidden" />}
    </BaseDialog.Trigger>
  );
}
