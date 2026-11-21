'use client';

import {
  createContext,
  use,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ComponentProps,
  type KeyboardEvent,
  type PointerEvent,
} from 'react';

import { cn } from '../lib/cn';

export type ResizableDirection = 'horizontal' | 'vertical';

interface PanelLimits {
  defaultSize: number | undefined;
  minSize: number;
  maxSize: number;
}

interface GroupState {
  direction: ResizableDirection;
  /** Sizes the user set (or a saved layout), in percent by panel id. Empty until then. */
  sizes: Readonly<Record<string, number>>;
  /** Each panel's default share, by panel id, once the panels have mounted. */
  fallback: Readonly<Record<string, number>>;
  /** Every panel's size in percent now, measured when the user has not set them yet. */
  snapshot: () => Record<string, number>;
  register: (id: string, limits: PanelLimits) => () => void;
  limits: (id: string) => PanelLimits | undefined;
  /** The panels on either side of a handle, in order. */
  neighbours: (handle: HTMLElement) => [string, string] | null;
  /** Moves the edge between two panels by `delta` percent of the group, within both panels' limits. */
  shift: (
    before: string,
    after: string,
    delta: number,
    from?: Readonly<Record<string, number>>,
  ) => void;
  /** Gives a panel an exact size, taking the difference from the panel after it. */
  resizeTo: (before: string, after: string, size: number) => void;
  reset: () => void;
  root: () => HTMLElement | null;
  setDragging: (dragging: boolean) => void;
}

const GroupContext = createContext<GroupState | null>(null);

function useGroup(part: string): GroupState {
  const group = use(GroupContext);
  if (group === null) throw new Error(`${part} must be used inside a ResizablePanelGroup`);
  return group;
}

const FREE: PanelLimits = { defaultSize: undefined, minSize: 0, maxSize: 100 };
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const storageName = (key: string) => `rectio:resizable:${key}`;

/** The layout saved under `key`, as stored, or null. A string, so the store snapshot is stable. */
function readSaved(key: string | undefined): string | null {
  if (key === undefined || typeof localStorage === 'undefined') return null;
  try {
    return localStorage.getItem(storageName(key));
  } catch {
    // Storage blocked: the default sizes apply.
    return null;
  }
}

/** Another tab saved a layout: the store reads it again. */
function subscribeSaved(listener: () => void): () => void {
  window.addEventListener('storage', listener);
  return () => {
    window.removeEventListener('storage', listener);
  };
}

/** A saved layout as each panel's size by panel id, pulled inside the limits of the panels known. */
function parseSaved(
  saved: string | null,
  panels: ReadonlyMap<string, PanelLimits>,
): Record<string, number> {
  if (saved === null) return {};
  try {
    const parsed: unknown = JSON.parse(saved);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return {};
    return Object.fromEntries(
      Object.entries(parsed)
        .filter(
          (entry): entry is [string, number] =>
            typeof entry[1] === 'number' && Number.isFinite(entry[1]),
        )
        .map(([id, size]) => {
          const limits = panels.get(id);
          return [id, limits === undefined ? size : clamp(size, limits.minSize, limits.maxSize)];
        }),
    );
  } catch {
    // A value from another version: the default sizes apply.
    return {};
  }
}

/** Default sizes for panels in order: given ones kept, the rest share what is left, all clamped. */
function defaultSizes(limits: readonly PanelLimits[]): number[] {
  const given = limits.reduce((sum, panel) => sum + (panel.defaultSize ?? 0), 0);
  const open = limits.filter((panel) => panel.defaultSize === undefined).length;
  const share = open === 0 ? 0 : Math.max(0, 100 - given) / open;
  const sizes = limits.map((panel) =>
    clamp(panel.defaultSize ?? share, panel.minSize, panel.maxSize),
  );
  const total = sizes.reduce((sum, size) => sum + size, 0);
  return total === 0 ? sizes : sizes.map((size) => (size / total) * 100);
}

/** The panels that registered, in mount order, as a small store the group and panels read. */
interface PanelStore {
  subscribe: (listener: () => void) => () => void;
  get: () => ReadonlyMap<string, PanelLimits>;
  set: (id: string, limits: PanelLimits) => void;
  remove: (id: string) => void;
}

function createPanelStore(): PanelStore {
  let panels: ReadonlyMap<string, PanelLimits> = new Map();
  const listeners = new Set<() => void>();
  const change = (next: Map<string, PanelLimits>) => {
    panels = next;
    for (const listener of listeners) listener();
  };
  return {
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    get: () => panels,
    set: (id, limits) => {
      change(new Map(panels).set(id, limits));
    },
    remove: (id) => {
      const next = new Map(panels);
      next.delete(id);
      change(next);
    },
  };
}

export type ResizablePanelGroupProps = Omit<ComponentProps<'div'>, 'dir'> & {
  /** `horizontal` (default): panels side by side. `vertical`: stacked. */
  direction?: ResizableDirection;
  /**
   * Remembers the sizes in this browser under this key, so the layout survives a reload. Give
   * each panel an `id` too, so a saved size finds its panel after the page changes.
   */
  storageKey?: string;
  /** After the user resizes, with every panel's size in percent, in order. */
  onLayout?: (sizes: number[]) => void;
};

/**
 * Panels that share a box and can be resized against each other, such as a list beside a detail
 * view. Sizes are percentages of the group. Put a ResizableHandle between each pair of panels.
 */
export function ResizablePanelGroup({
  direction = 'horizontal',
  storageKey,
  onLayout,
  className,
  children,
  ref,
  ...props
}: ResizablePanelGroupProps) {
  const node = useRef<HTMLDivElement | null>(null);
  const [store] = useState(createPanelStore);
  const registered = useSyncExternalStore(store.subscribe, store.get, store.get);
  // Panels without a default size share what the others leave, as soon as they have all mounted.
  const fallback = useMemo(() => {
    const ids = [...registered.keys()];
    const next = defaultSizes(ids.map((id) => registered.get(id) ?? FREE));
    return Object.fromEntries(ids.map((id, index) => [id, next[index] ?? 0]));
  }, [registered]);
  // The server has no saved layout, so it draws the defaults and hydration matches; the browser
  // then applies the saved layout before it paints. A layout the user makes here wins over both.
  const saved = useSyncExternalStore(
    subscribeSaved,
    () => readSaved(storageKey),
    () => null,
  );
  const [made, setSizes] = useState<Readonly<Record<string, number>> | null>(null);
  const sizes = useMemo(() => made ?? parseSaved(saved, registered), [made, saved, registered]);
  const [dragging, setDragging] = useState(false);
  const latest = useRef({ onLayout, storageKey });
  useEffect(() => {
    latest.current = { onLayout, storageKey };
  });

  /** The panels in order, read from the page. */
  const panels = useCallback(
    () =>
      [
        ...(node.current?.querySelectorAll<HTMLElement>(':scope > [data-slot="resizable-panel"]') ??
          []),
      ].filter((panel) => panel.dataset.panelId !== undefined),
    [],
  );

  /**
   * Every panel's size in percent: the layout the user made when it covers every panel, else
   * measured from the page, so the first drag starts from what is drawn.
   */
  const current = useCallback((): Record<string, number> => {
    const list = panels();
    if (list.every((panel) => sizes[panel.dataset.panelId ?? ''] !== undefined))
      return { ...sizes };
    const lengths = list.map((panel) => {
      const rect = panel.getBoundingClientRect();
      return direction === 'horizontal' ? rect.width : rect.height;
    });
    const total = lengths.reduce((sum, length) => sum + length, 0);
    return Object.fromEntries(
      list.map((panel, index) => [
        panel.dataset.panelId ?? '',
        total === 0 ? 100 / list.length : ((lengths[index] ?? 0) / total) * 100,
      ]),
    );
  }, [panels, sizes, direction]);

  /** Applies, saves and reports a layout the user made. */
  const commit = useCallback(
    (next: Record<string, number>) => {
      setSizes(next);
      const { onLayout: report, storageKey: key } = latest.current;
      if (key !== undefined) {
        try {
          localStorage.setItem(storageName(key), JSON.stringify(next));
        } catch {
          // Storage full or blocked: the layout still applies for this visit.
        }
      }
      report?.(panels().map((panel) => next[panel.dataset.panelId ?? ''] ?? 0));
    },
    [panels],
  );

  // Stable, so a panel registers once and not again on every resize.
  const register = useCallback<GroupState['register']>(
    (id, limits) => {
      store.set(id, limits);
      return () => {
        store.remove(id);
      };
    },
    [store],
  );

  const state = useMemo<GroupState>(() => {
    const shift: GroupState['shift'] = (before, after, delta, from) => {
      const base = from ?? current();
      const a = base[before];
      const b = base[after];
      const limitsA = store.get().get(before);
      const limitsB = store.get().get(after);
      if (a === undefined || b === undefined || limitsA === undefined || limitsB === undefined) {
        return;
      }
      const pair = a + b;
      // Within the first panel's limits, then the second's, which may pull the first back.
      let nextA = clamp(a + delta, limitsA.minSize, limitsA.maxSize);
      const nextB = clamp(pair - nextA, limitsB.minSize, limitsB.maxSize);
      nextA = pair - nextB;
      if (sizes[before] !== undefined && Math.abs(nextA - sizes[before]) < 0.01) return;
      commit({ ...base, [before]: nextA, [after]: nextB });
    };
    return {
      direction,
      sizes,
      fallback,
      register,
      limits: (id) => store.get().get(id),
      neighbours: (handle) => {
        const before = handle.previousElementSibling;
        const after = handle.nextElementSibling;
        if (!(before instanceof HTMLElement) || !(after instanceof HTMLElement)) return null;
        const a = before.dataset.panelId;
        const b = after.dataset.panelId;
        return a === undefined || b === undefined ? null : [a, b];
      },
      snapshot: current,
      shift,
      resizeTo: (before, after, size) => {
        const base = current();
        const now = base[before];
        if (now !== undefined) shift(before, after, size - now, base);
      },
      reset: () => {
        const ids = panels().map((panel) => panel.dataset.panelId ?? '');
        const limits = ids.map((id) => store.get().get(id) ?? FREE);
        const next = defaultSizes(limits);
        commit(Object.fromEntries(ids.map((id, index) => [id, next[index] ?? 0])));
      },
      root: () => node.current,
      setDragging,
    };
  }, [direction, sizes, fallback, store, register, commit, current, panels]);

  return (
    <GroupContext value={state}>
      <div
        ref={(element) => {
          node.current = element;
          if (typeof ref === 'function') return ref(element);
          if (ref) ref.current = element;
          return undefined;
        }}
        data-slot="resizable-group"
        data-direction={direction}
        data-dragging={dragging || undefined}
        className={cn(
          'flex size-full min-h-0 min-w-0 overflow-hidden',
          direction === 'vertical' && 'flex-col',
          // While dragging, text under the pointer is not selected and the cursor stays the resize one.
          'data-dragging:select-none',
          direction === 'horizontal'
            ? 'data-dragging:cursor-col-resize'
            : 'data-dragging:cursor-row-resize',
          className,
        )}
        {...props}
      >
        {children}
      </div>
    </GroupContext>
  );
}

export type ResizablePanelProps = ComponentProps<'div'> & {
  /** Starting size in percent of the group. Panels without one share what is left. */
  defaultSize?: number;
  /** Smallest size in percent. Default 10. */
  minSize?: number;
  /** Largest size in percent. Default 90. */
  maxSize?: number;
};

/** One resizable region. Its content scrolls inside it when it overflows. */
export function ResizablePanel({
  defaultSize,
  minSize = 10,
  maxSize = 90,
  id: idProp,
  className,
  style,
  ...props
}: ResizablePanelProps) {
  const group = useGroup('ResizablePanel');
  const generated = useId();
  const id = idProp ?? generated;
  const { register } = group;
  useLayoutEffect(
    () => register(id, { defaultSize, minSize, maxSize }),
    [register, id, defaultSize, minSize, maxSize],
  );
  const size = group.sizes[id] ?? group.fallback[id] ?? defaultSize;
  return (
    <div
      id={id}
      data-slot="resizable-panel"
      data-panel-id={id}
      // The share of the group: flex-grow in percent. Before the group has measured, a panel
      // with no default takes an even share.
      style={{ flex: `${String(size ?? 1)} 1 0px`, ...style }}
      className={cn('min-h-0 min-w-0 overflow-auto', className)}
      {...props}
    />
  );
}

export type ResizableHandleProps = Omit<ComponentProps<'div'>, 'children'> & {
  /** Names the handle, such as "Resize the invoice list". Default "Resize". */
  label?: string;
  /** How far an arrow key moves the edge, in percent. Default 5. */
  keyboardStep?: number;
  /** Draws a grip in the middle of the line, so the handle is easy to find. */
  withGrip?: boolean;
};

/**
 * The edge between two panels: drag it, or focus it and use the arrow keys (Home and End go to
 * the limits). A double click puts every panel back to its default size. Screen readers hear a
 * separator with the size of the panel before it.
 */
export function ResizableHandle({
  label = 'Resize',
  keyboardStep = 5,
  withGrip = false,
  className,
  ...props
}: ResizableHandleProps) {
  const group = useGroup('ResizableHandle');
  const node = useRef<HTMLDivElement | null>(null);
  const [pair, setPair] = useState<[string, string] | null>(null);
  const drag = useRef<{
    pointer: number;
    start: number;
    length: number;
    sizes: Readonly<Record<string, number>>;
    sign: number;
  } | null>(null);
  const horizontal = group.direction === 'horizontal';

  useLayoutEffect(() => {
    if (node.current !== null) setPair(group.neighbours(node.current));
  }, [group]);

  const before = pair?.[0];
  const limits = before === undefined ? undefined : group.limits(before);
  // The size drawn now: the user's layout, else the panel's default share.
  const size =
    before === undefined
      ? undefined
      : (group.sizes[before] ?? group.fallback[before] ?? limits?.defaultSize);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (pair === null || limits === undefined) return;
    const rtl = horizontal && getComputedStyle(event.currentTarget).direction === 'rtl';
    const forward = horizontal ? (rtl ? 'ArrowLeft' : 'ArrowRight') : 'ArrowDown';
    const back = horizontal ? (rtl ? 'ArrowRight' : 'ArrowLeft') : 'ArrowUp';
    if (event.key === forward) group.shift(pair[0], pair[1], keyboardStep);
    else if (event.key === back) group.shift(pair[0], pair[1], -keyboardStep);
    else if (event.key === 'Home') group.resizeTo(pair[0], pair[1], limits.minSize);
    else if (event.key === 'End') group.resizeTo(pair[0], pair[1], limits.maxSize);
    else return;
    event.preventDefault();
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    // One pointer at a time, and the main button only.
    if (drag.current !== null || event.button !== 0 || pair === null) return;
    const root = group.root();
    if (root === null) return;
    const rect = root.getBoundingClientRect();
    const rtl = horizontal && getComputedStyle(root).direction === 'rtl';
    drag.current = {
      pointer: event.pointerId,
      start: horizontal ? event.clientX : event.clientY,
      length: horizontal ? rect.width : rect.height,
      sizes: group.snapshot(),
      sign: rtl ? -1 : 1,
    };
    // Keeps the drag going when the pointer leaves the thin handle.
    event.currentTarget.setPointerCapture(event.pointerId);
    event.currentTarget.focus();
    group.setDragging(true);
    event.preventDefault();
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const state = drag.current;
    if (state?.pointer !== event.pointerId || pair === null || state.length === 0) return;
    const moved = (horizontal ? event.clientX : event.clientY) - state.start;
    group.shift(pair[0], pair[1], ((moved * state.sign) / state.length) * 100, state.sizes);
  };

  const end = (event: PointerEvent<HTMLDivElement>) => {
    if (drag.current?.pointer !== event.pointerId) return;
    drag.current = null;
    group.setDragging(false);
  };

  return (
    <div
      ref={node}
      role="separator"
      tabIndex={0}
      aria-label={label}
      aria-orientation={horizontal ? 'vertical' : 'horizontal'}
      {...(before === undefined ? {} : { 'aria-controls': before })}
      {...(size === undefined ? {} : { 'aria-valuenow': Math.round(size) })}
      {...(limits === undefined
        ? {}
        : { 'aria-valuemin': limits.minSize, 'aria-valuemax': limits.maxSize })}
      data-slot="resizable-handle"
      onKeyDown={onKeyDown}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={end}
      onPointerCancel={end}
      onDoubleClick={() => {
        group.reset();
      }}
      className={cn(
        'group/handle relative flex shrink-0 touch-none items-center justify-center bg-line outline-none',
        'transition-[background-color] duration-fast ease-standard',
        'hover:bg-line-strong focus-visible:bg-focus in-data-dragging:bg-focus',
        horizontal ? 'w-px cursor-col-resize' : 'h-px cursor-row-resize',
        // A hit area wider than the line, the touch height across on touch screens.
        'after:absolute',
        horizontal
          ? 'after:inset-y-0 after:-inset-x-1.5 pointer-coarse:after:-inset-x-5'
          : 'after:inset-x-0 after:-inset-y-1.5 pointer-coarse:after:-inset-y-5',
        className,
      )}
      {...props}
    >
      {withGrip && (
        <span
          aria-hidden
          data-part="grip"
          className={cn(
            'z-10 flex items-center justify-center gap-0.5 rounded-full border border-line-strong bg-surface-raised shadow-raised',
            'group-hover/handle:border-line-strong group-focus-visible/handle:border-focus',
            horizontal ? 'h-6 w-2.5 flex-col' : 'h-2.5 w-6',
          )}
        >
          {[0, 1, 2].map((dot) => (
            <span key={dot} className="size-1 rounded-full bg-fg-muted" />
          ))}
        </span>
      )}
    </div>
  );
}
