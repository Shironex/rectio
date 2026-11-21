import { CaretRightIcon, CircleNotchIcon, WarningCircleIcon } from '@phosphor-icons/react';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react';

import { cn } from '../lib/cn';
import { ScrollArea } from '../scroll-area/scroll-area';

export interface TreeNode<Data = unknown> {
  /** Unique in the whole tree. */
  id: string;
  label: ReactNode;
  /** The plain text of the label, for type-ahead when the label is not a string. */
  textValue?: string;
  /** Drawn before the label, such as a folder or a file icon. */
  icon?: ReactNode;
  /** Drawn at the end of the row, such as a count. Read after the label. */
  meta?: ReactNode;
  children?: readonly TreeNode<Data>[];
  /** The node has children that are not loaded yet: Tree asks `loadChildren` when it opens. */
  hasChildren?: boolean;
  /** Can be focused but not selected or acted on. */
  disabled?: boolean;
  data?: Data;
}

type LoadState<Data> =
  | { status: 'loading' }
  | { status: 'loaded'; children: readonly TreeNode<Data>[] }
  | { status: 'error'; error: unknown };

export interface TreeLoader<Data = unknown> {
  /** What is known about a node's loaded children. */
  get: (id: string) => LoadState<Data> | undefined;
  /** Loads a node's children once; a second call while it loads does nothing. */
  load: (node: TreeNode<Data>) => void;
  /** Forgets a node's children and loads them again, such as after an error or a refresh. */
  reload: (node: TreeNode<Data>) => void;
}

/**
 * Loads children on demand for a Tree, and remembers them: pass the result as the Tree's `loader`
 * when the app needs to reload a branch itself. A Tree given only `loadChildren` makes its own.
 */
export function useTreeChildren<Data = unknown>(
  loadChildren: (node: TreeNode<Data>) => Promise<readonly TreeNode<Data>[]>,
): TreeLoader<Data> {
  const [states, setStates] = useState<ReadonlyMap<string, LoadState<Data>>>(() => new Map());
  const latest = useRef(loadChildren);
  useEffect(() => {
    latest.current = loadChildren;
  });
  const running = useRef(new Set<string>());

  const set = useCallback((id: string, state: LoadState<Data>) => {
    setStates((current) => new Map(current).set(id, state));
  }, []);

  const start = useCallback(
    (node: TreeNode<Data>) => {
      running.current.add(node.id);
      set(node.id, { status: 'loading' });
      latest.current(node).then(
        (children) => {
          running.current.delete(node.id);
          set(node.id, { status: 'loaded', children });
        },
        (error: unknown) => {
          running.current.delete(node.id);
          set(node.id, { status: 'error', error });
        },
      );
    },
    [set],
  );

  return useMemo(
    () => ({
      get: (id) => states.get(id),
      load: (node) => {
        if (running.current.has(node.id) || states.get(node.id)?.status === 'loaded') return;
        start(node);
      },
      reload: (node) => {
        if (!running.current.has(node.id)) start(node);
      },
    }),
    [states, start],
  );
}

/** A row in the flattened, visible tree. */
interface Row<Data> {
  /** The node, or the parent whose children failed to load for an error row. */
  node: TreeNode<Data>;
  id: string;
  kind: 'node' | 'error';
  level: number;
  position: number;
  setSize: number;
  parentId: string | null;
  expandable: boolean;
  expanded: boolean;
  loading: boolean;
}

const NEVER_LOAD = () => Promise.resolve([]);

export interface TreeProps<Data = unknown> {
  items: readonly TreeNode<Data>[];
  /** Names the tree, such as "Folders". Or pass `aria-labelledby`. */
  'aria-label'?: string;
  'aria-labelledby'?: string;
  /** Ids of the open nodes. */
  expanded?: readonly string[];
  defaultExpanded?: readonly string[];
  onExpandedChange?: (expanded: string[]) => void;
  /** `single` (default) or `multiple`; `none` for a tree that only opens and closes. */
  selectionMode?: 'single' | 'multiple' | 'none';
  selected?: readonly string[];
  defaultSelected?: readonly string[];
  onSelectedChange?: (selected: string[]) => void;
  /** Enter or a double click on a node, such as opening a file. */
  onAction?: (node: TreeNode<Data>) => void;
  /** Loads the children of a node marked `hasChildren` the first time it opens. */
  loadChildren?: (node: TreeNode<Data>) => Promise<readonly TreeNode<Data>[]>;
  /** A loader from useTreeChildren, for an app that reloads branches itself. */
  loader?: TreeLoader<Data>;
  /** The row shown when a branch fails to load. Enter or a press on it tries again. */
  errorLabel?: string;
  /** The action drawn at the end of the error row. Default "Try again". */
  retryLabel?: string;
  /** The tree scrolls inside this box: give it a height, such as `h-80`. */
  className?: string;
}

const isPrintable = (key: string) => key.length === 1 && key !== ' ' && key !== '*';

const textOf = (node: TreeNode) =>
  (node.textValue ?? (typeof node.label === 'string' ? node.label : '')).toLowerCase();

/**
 * A hierarchy to browse and pick from: folders, accounts in a chart of accounts, an org's teams.
 * Follows the tree pattern: arrow keys move, Right opens or steps in, Left closes or steps out,
 * Home and End jump, `*` opens a level, and typing jumps to a matching name. Selection is single,
 * multiple (Space toggles, Shift with an arrow extends) or off. Branches can load their children
 * when they first open. Scrolls in its own area when given a height.
 */
export function Tree<Data = unknown>({
  items,
  expanded: expandedProp,
  defaultExpanded = [],
  onExpandedChange,
  selectionMode = 'single',
  selected: selectedProp,
  defaultSelected = [],
  onSelectedChange,
  onAction,
  loadChildren,
  loader: loaderProp,
  errorLabel = 'Could not load.',
  retryLabel = 'Try again',
  className,
  ...labelling
}: TreeProps<Data>) {
  const ownLoader = useTreeChildren<Data>(loadChildren ?? NEVER_LOAD);
  const loader = loaderProp ?? ownLoader;

  const [expandedState, setExpandedState] = useState<readonly string[]>(defaultExpanded);
  const expanded = useMemo(
    () => new Set(expandedProp ?? expandedState),
    [expandedProp, expandedState],
  );
  const [selectedState, setSelectedState] = useState<readonly string[]>(defaultSelected);
  const selected = useMemo(
    () => new Set(selectedProp ?? selectedState),
    [selectedProp, selectedState],
  );

  const childrenOf = useCallback(
    (node: TreeNode<Data>): readonly TreeNode<Data>[] | undefined => {
      if (node.children !== undefined) return node.children;
      const state = loader.get(node.id);
      return state?.status === 'loaded' ? state.children : undefined;
    },
    [loader],
  );

  const rows = useMemo(() => {
    const out: Row<Data>[] = [];
    const walk = (nodes: readonly TreeNode<Data>[], level: number, parentId: string | null) => {
      nodes.forEach((node, index) => {
        const children = childrenOf(node);
        const expandable =
          (children !== undefined && children.length > 0) || node.hasChildren === true;
        const open = expandable && expanded.has(node.id);
        const state = loader.get(node.id);
        out.push({
          node,
          id: node.id,
          kind: 'node',
          level,
          position: index + 1,
          setSize: nodes.length,
          parentId,
          expandable,
          expanded: open,
          loading: open && state?.status === 'loading',
        });
        if (!open) return;
        if (children !== undefined) walk(children, level + 1, node.id);
        else if (state?.status === 'error') {
          out.push({
            node,
            id: `${node.id}\u0000error`,
            kind: 'error',
            level: level + 1,
            position: 1,
            setSize: 1,
            parentId: node.id,
            expandable: false,
            expanded: false,
            loading: false,
          });
        }
      });
    };
    walk(items, 1, null);
    return out;
  }, [items, expanded, childrenOf, loader]);

  // Open nodes whose children are not loaded yet, such as ones opened by default, load now.
  useEffect(() => {
    for (const row of rows) {
      if (row.kind === 'node' && row.expanded && childrenOf(row.node) === undefined) {
        if (loader.get(row.id) === undefined) loader.load(row.node);
      }
    }
  }, [rows, childrenOf, loader]);

  const [focusedId, setFocusedId] = useState<string | null>(null);
  // The row that takes the Tab stop: the focused one while it is visible, else the first chosen
  // visible row, else the first row.
  const tabStop =
    rows.find((row) => row.id === focusedId)?.id ??
    rows.find((row) => selected.has(row.id))?.id ??
    rows[0]?.id ??
    null;

  const elements = useRef(new Map<string, HTMLElement>());
  const anchor = useRef<string | null>(null);
  const typed = useRef({ text: '', at: 0 });

  const focusRow = (id: string | undefined) => {
    if (id === undefined) return;
    setFocusedId(id);
    elements.current.get(id)?.focus();
  };

  const setExpanded = (next: Set<string>) => {
    const list = [...next];
    setExpandedState(list);
    onExpandedChange?.(list);
  };

  const toggle = (row: Row<Data>, open = !row.expanded) => {
    if (!row.expandable || open === row.expanded) return;
    const next = new Set(expanded);
    if (open) {
      next.add(row.id);
      if (childrenOf(row.node) === undefined) loader.load(row.node);
    } else next.delete(row.id);
    setExpanded(next);
  };

  const setSelected = (next: Set<string>) => {
    const list = [...next];
    setSelectedState(list);
    onSelectedChange?.(list);
  };

  const select = (row: Row<Data>, mode: 'replace' | 'toggle' | 'add') => {
    if (selectionMode === 'none' || row.kind === 'error' || row.node.disabled === true) return;
    if (selectionMode === 'single' || mode === 'replace') {
      setSelected(new Set([row.id]));
    } else {
      const next = new Set(selected);
      if (mode === 'toggle' && next.has(row.id)) next.delete(row.id);
      else next.add(row.id);
      setSelected(next);
    }
    anchor.current = row.id;
  };

  const act = (row: Row<Data>) => {
    if (row.kind === 'error') {
      loader.reload(row.node);
      return;
    }
    if (row.node.disabled === true) return;
    if (selectionMode === 'single') select(row, 'replace');
    if (onAction !== undefined) onAction(row.node);
    else if (selectionMode === 'none') toggle(row);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>, row: Row<Data>) => {
    const index = rows.indexOf(row);
    const move = (to: Row<Data> | undefined) => {
      if (to === undefined) return;
      focusRow(to.id);
      // Shift with an arrow extends a multiple selection to the row it lands on.
      if (event.shiftKey && selectionMode === 'multiple') select(to, 'add');
    };
    switch (event.key) {
      case 'ArrowDown':
        move(rows[index + 1]);
        break;
      case 'ArrowUp':
        move(rows[index - 1]);
        break;
      case 'Home':
        move(rows[0]);
        break;
      case 'End':
        move(rows.at(-1));
        break;
      case 'ArrowRight':
        if (row.expandable && !row.expanded) toggle(row, true);
        else if (row.expanded) {
          const child = rows[index + 1];
          if (child?.parentId === row.id) focusRow(child.id);
        }
        break;
      case 'ArrowLeft':
        if (row.expanded) toggle(row, false);
        else if (row.parentId !== null) focusRow(row.parentId);
        break;
      case 'Enter':
        act(row);
        break;
      case ' ':
        if (row.kind === 'error') loader.reload(row.node);
        else select(row, 'toggle');
        break;
      case '*': {
        // Opens every closed sibling that can open, the pattern's "expand this level".
        const next = new Set(expanded);
        for (const sibling of rows) {
          if (sibling.parentId === row.parentId && sibling.expandable && sibling.kind === 'node') {
            next.add(sibling.id);
            if (childrenOf(sibling.node) === undefined) loader.load(sibling.node);
          }
        }
        setExpanded(next);
        break;
      }
      case 'a':
        if ((event.metaKey || event.ctrlKey) && selectionMode === 'multiple') {
          setSelected(
            new Set(
              rows.filter((r) => r.kind === 'node' && r.node.disabled !== true).map((r) => r.id),
            ),
          );
          break;
        }
        typeAhead(event.key, index, event.timeStamp);
        break;
      default:
        if (isPrintable(event.key) && !event.metaKey && !event.ctrlKey && !event.altKey) {
          typeAhead(event.key, index, event.timeStamp);
          break;
        }
        return;
    }
    event.preventDefault();
  };

  /** Jumps to the next visible row whose name starts with what was typed in the last moment. */
  const typeAhead = (key: string, from: number, now: number) => {
    const text =
      now - typed.current.at < 700 ? typed.current.text + key.toLowerCase() : key.toLowerCase();
    typed.current = { text, at: now };
    const order = [...rows.slice(from + 1), ...rows.slice(0, from + 1)];
    // A repeated first letter cycles through the matches; a longer prefix stays on the first.
    const current = rows[from];
    const start = text.length > 1 && current !== undefined ? [current, ...order] : order;
    const hit = start.find((r) => r.kind === 'node' && textOf(r.node).startsWith(text));
    if (hit !== undefined) focusRow(hit.id);
  };

  return (
    <ScrollArea
      data-slot="tree-scroll"
      focusableViewport={false}
      className={cn('w-full', className)}
    >
      <div
        role="tree"
        data-slot="tree"
        {...labelling}
        {...(selectionMode === 'multiple' ? { 'aria-multiselectable': true } : {})}
        className="flex flex-col gap-px p-1"
      >
        {rows.map((row) => {
          const isSelected = selectionMode !== 'none' && selected.has(row.id);
          const disabled = row.kind === 'node' && row.node.disabled === true;
          return (
            <div
              key={row.id}
              ref={(node) => {
                if (node === null) elements.current.delete(row.id);
                else elements.current.set(row.id, node);
              }}
              role="treeitem"
              data-slot="tree-item"
              aria-level={row.level}
              aria-setsize={row.setSize}
              aria-posinset={row.position}
              {...(row.expandable ? { 'aria-expanded': row.expanded } : {})}
              {...(selectionMode === 'none' || row.kind === 'error'
                ? {}
                : { 'aria-selected': isSelected })}
              {...(disabled ? { 'aria-disabled': true } : {})}
              {...(row.loading ? { 'aria-busy': true } : {})}
              data-selected={isSelected || undefined}
              data-kind={row.kind}
              tabIndex={row.id === tabStop ? 0 : -1}
              onFocus={() => {
                setFocusedId(row.id);
              }}
              onKeyDown={(event) => {
                onKeyDown(event, row);
              }}
              onClick={(event) => {
                setFocusedId(row.id);
                if (row.kind === 'error') {
                  loader.reload(row.node);
                  return;
                }
                if (selectionMode === 'none') toggle(row);
                else if (selectionMode === 'multiple' && (event.metaKey || event.ctrlKey))
                  select(row, 'toggle');
                else select(row, 'replace');
              }}
              onDoubleClick={() => {
                if (row.kind === 'node' && onAction !== undefined && !disabled) onAction(row.node);
              }}
              // Each level is inset by the token; the guides below line up with the chevrons.
              style={{
                paddingInlineStart: `calc(${String(row.level - 1)} * var(--rx-tree-indent))`,
              }}
              className={cn(
                'group/row relative flex min-h-(--rx-tree-row-height) cursor-pointer scroll-my-8 items-center gap-1.5 pe-2',
                'pointer-coarse:min-h-(--rx-tree-row-height-touch)',
                'rounded-control text-sm text-fg outline-none select-none',
                'transition-[background-color] duration-fast ease-standard',
                'hover:bg-surface-hover',
                'data-selected:bg-surface-selected data-selected:font-medium',
                'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-solid focus-visible:outline-focus',
                'aria-disabled:cursor-not-allowed aria-disabled:text-fg-disabled aria-disabled:hover:bg-transparent',
                row.kind === 'error' && 'text-negative-strong',
              )}
            >
              {Array.from({ length: row.level - 1 }, (_, depth) => (
                <span
                  key={depth}
                  aria-hidden
                  className="pointer-events-none absolute inset-y-0 w-px bg-line"
                  style={{
                    insetInlineStart: `calc((${String(depth)} + 0.5) * var(--rx-tree-indent))`,
                  }}
                />
              ))}
              <span
                aria-hidden
                data-part="chevron"
                className="inline-flex w-(--rx-tree-indent) shrink-0 items-center justify-center self-stretch text-fg-subtle"
                onClick={(event) => {
                  if (!row.expandable) return;
                  // The chevron opens and closes without changing the selection.
                  event.stopPropagation();
                  setFocusedId(row.id);
                  elements.current.get(row.id)?.focus();
                  toggle(row);
                }}
              >
                {row.loading ? (
                  <CircleNotchIcon
                    weight="bold"
                    className="size-3.5 animate-spin motion-reduce:animate-breathe"
                  />
                ) : row.kind === 'error' ? (
                  <WarningCircleIcon weight="bold" className="size-3.5" />
                ) : row.expandable ? (
                  <CaretRightIcon
                    weight="bold"
                    className={cn(
                      'size-3 transition-[rotate] duration-fast ease-standard motion-reduce:transition-none rtl:-scale-x-100',
                      row.expanded && 'rotate-90 rtl:-rotate-90',
                    )}
                  />
                ) : null}
              </span>
              {row.kind === 'error' ? (
                <>
                  <span className="min-w-0 flex-1 truncate">{errorLabel}</span>
                  {/* The whole row retries on Enter or a press; this names the action. */}
                  <span className="shrink-0 text-xs font-medium text-fg underline underline-offset-2">
                    {retryLabel}
                  </span>
                </>
              ) : (
                <>
                  {row.node.icon !== undefined && (
                    <span aria-hidden className="inline-flex shrink-0 text-fg-muted [&_svg]:size-4">
                      {row.node.icon}
                    </span>
                  )}
                  <span className="min-w-0 flex-1 truncate">{row.node.label}</span>
                  {row.node.meta !== undefined && (
                    <span className="shrink-0 text-xs text-fg-subtle numeric">{row.node.meta}</span>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
