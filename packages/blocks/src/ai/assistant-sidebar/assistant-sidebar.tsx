'use client';

import { SparkleIcon, XIcon } from '@phosphor-icons/react';
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  ariaKeyShortcut,
  cn,
  isModalDialogOpen,
  touchHitArea,
  useIsMac,
  useIsMobileLayout,
  useShortcut,
} from '@rectio/ui';
import {
  createContext,
  use,
  useCallback,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
  type RefObject,
} from 'react';

import { useAiParts } from '../lib/parts';
import {
  ASSISTANT_SIDEBAR_MESSAGES,
  type AssistantSidebarMessages,
} from './assistant-sidebar-messages';
import { assistantSizes, shortcutAction } from './assistant-sidebar.logic';

interface AssistantState {
  /** Whether the panel shows: docked on a wide screen, the sheet on a phone. */
  open: boolean;
  /** Opens the panel and puts the focus in it, remembering where the reader was. */
  show: () => void;
  /** Closes the panel and returns the focus to where the reader was before it opened. */
  hide: () => void;
  toggle: () => void;
  shortcut: string | null;
  panelId: string;
  panelRef: RefObject<HTMLElement | null>;
  railRef: RefObject<HTMLButtonElement | null>;
  /** What the next render does with the focus, once the panel or the rail is on the page. */
  requestRef: RefObject<'panel' | 'return' | null>;
  returnToRef: RefObject<HTMLElement | null>;
}

const AssistantContext = createContext<AssistantState | null>(null);

/** The assistant's state, inside an AssistantSidebar or an AssistantSidebarProvider. */
export function useAssistantSidebar(): AssistantState {
  const state = use(AssistantContext);
  if (state === null) {
    throw new Error('useAssistantSidebar must be used inside an AssistantSidebar');
  }
  return state;
}

export interface AssistantSidebarProviderProps {
  /** Controlled: whether the panel is open. */
  open?: boolean | undefined;
  /**
   * Where the panel starts when uncontrolled; read it from a saved preference. Open at load docks
   * it on a wide screen; on a phone the sheet stays closed until the reader opens it.
   */
  defaultOpen?: boolean | undefined;
  onOpenChange?: ((open: boolean) => void) | undefined;
  /**
   * Opens the panel from anywhere, moves the focus into an open one, and closes it from inside.
   * Default `mod+j` (Command J on a Mac, Control J elsewhere); null binds nothing.
   */
  shortcut?: string | null | undefined;
  children: ReactNode;
}

/**
 * Holds the assistant's open state above the sidebar, so a trigger outside it (in the app
 * shell's header, say) can open it. The AssistantSidebar inside uses it; without one, the sidebar
 * keeps its own.
 */
export function AssistantSidebarProvider({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  shortcut = 'mod+j',
  children,
}: AssistantSidebarProviderProps) {
  const [openState, setOpenState] = useState(defaultOpen);
  const open = openProp ?? openState;
  // Open at load with nobody having asked (a saved `defaultOpen`, say) docks the panel on a wide
  // screen, but on a phone the sheet would cover the page, so there it waits for the first show.
  const [openedAtLoad, setOpenedAtLoad] = useState(open);
  if (openedAtLoad && !open) setOpenedAtLoad(false);
  const mobile = useIsMobileLayout();
  const visible = open && !(mobile && openedAtLoad);
  const panelId = useId();
  const panel = useRef<HTMLElement | null>(null);
  const rail = useRef<HTMLButtonElement | null>(null);
  const request = useRef<'panel' | 'return' | null>(null);
  const returnTo = useRef<HTMLElement | null>(null);
  const latest = useRef({ open, visible, openProp, onOpenChange });
  useLayoutEffect(() => {
    latest.current = { open, visible, openProp, onOpenChange };
  });

  const set = useCallback((next: boolean) => {
    if (latest.current.openProp === undefined) setOpenState(next);
    latest.current.onOpenChange?.(next);
  }, []);

  const remember = useCallback(() => {
    const active = document.activeElement;
    if (active instanceof HTMLElement && panel.current?.contains(active) !== true) {
      returnTo.current = active;
    }
  }, []);

  const value = useMemo<AssistantState>(() => {
    const show = () => {
      remember();
      request.current = 'panel';
      if (latest.current.visible) {
        // Already showing: nothing renders, so the focus moves now.
        panelField(panel.current)?.focus();
        request.current = null;
      } else if (latest.current.open) {
        // Open but held on a phone since the load: let the sheet show.
        setOpenedAtLoad(false);
      } else set(true);
    };
    const hide = () => {
      request.current = 'return';
      set(false);
    };
    return {
      open: visible,
      show,
      hide,
      toggle: () => {
        if (latest.current.visible) hide();
        else show();
      },
      shortcut,
      panelId,
      panelRef: panel,
      railRef: rail,
      requestRef: request,
      returnToRef: returnTo,
    };
  }, [visible, shortcut, panelId, set, remember]);

  useShortcut(
    shortcut,
    () => {
      // Never behind a dialog the reader is in: the delete confirm, a sheet, the app's own.
      if (isModalDialogOpen()) return;
      const inside = panel.current?.contains(document.activeElement) === true;
      const action = shortcutAction(latest.current.visible, inside);
      if (action === 'close') value.hide();
      else value.show();
    },
    // A toggle: holding the keys must not open and close it over and over.
    { allowInFields: true, repeat: false },
  );

  return <AssistantContext value={value}>{children}</AssistantContext>;
}

/** The place to type in a panel, else its first focusable control, else the panel itself. */
function panelField(panel: HTMLElement | null): HTMLElement | null {
  if (panel === null) return null;
  return (
    panel.querySelector<HTMLElement>('textarea:not([disabled])') ??
    panel.querySelector<HTMLElement>('[data-part="assistant-title"]')
  );
}

export interface AssistantSidebarTriggerProps extends Omit<ComponentProps<'button'>, 'children'> {
  /** What the button shows; the sparkle icon by default, named by the open and close words. */
  children?: ReactNode;
  messages?: Partial<AssistantSidebarMessages> | undefined;
}

/**
 * Opens and closes the assistant from anywhere inside the provider: a header button. Says
 * whether the panel is open and shows the shortcut in its tooltip.
 */
export function AssistantSidebarTrigger({
  children,
  messages: overrides,
  className,
  onClick,
  ...props
}: AssistantSidebarTriggerProps) {
  const m = { ...ASSISTANT_SIDEBAR_MESSAGES, ...overrides };
  const { open, toggle, shortcut, panelId } = useAssistantSidebar();
  const mac = useIsMac();
  const label = open ? m.close : m.open;
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            aria-label={children === undefined ? label : undefined}
            aria-expanded={open}
            aria-controls={open ? panelId : undefined}
            aria-keyshortcuts={shortcut === null ? undefined : ariaKeyShortcut(shortcut, mac)}
            data-slot="assistant-sidebar-trigger"
            className={cn(
              'relative inline-flex h-(--rx-button-height-md) min-w-(--rx-button-height-md) shrink-0 cursor-pointer items-center justify-center gap-2 rounded-(--rx-button-radius) px-2',
              'text-sm font-medium text-fg-muted hover:bg-surface-hover hover:text-fg aria-expanded:text-accent-strong',
              'transition-colors duration-fast ease-standard',
              'outline-offset-2 focus-visible:outline-2 focus-visible:outline-focus',
              touchHitArea,
              className,
            )}
            onClick={(event) => {
              onClick?.(event);
              if (!event.defaultPrevented) toggle();
            }}
            {...props}
          />
        }
      >
        {children ?? <SparkleIcon aria-hidden weight="fill" className="size-4" />}
      </TooltipTrigger>
      <TooltipContent side="bottom" {...(shortcut === null ? {} : { shortcut })}>
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

export interface AssistantSidebarProps extends Omit<AssistantSidebarProviderProps, 'children'> {
  /** The app: the page the assistant docks beside. It scrolls inside its own column. */
  children: ReactNode;
  /** The assistant itself, usually an AiChatThread. It fills the panel below the title bar. */
  panel: ReactNode;
  /** The panel's title; the label words by default. */
  title?: ReactNode;
  /** The icon in the title bar and on the rail. */
  icon?: ReactNode;
  /** In the title bar, before the close button: a new chat button, a history menu. */
  headerActions?: ReactNode;
  /**
   * `rail` (default): closing folds the panel to a narrow strip with the open button. `hidden`:
   * it goes away entirely, for apps that open it from a trigger of their own.
   */
  collapsed?: 'rail' | 'hidden' | undefined;
  /** The panel's starting width in percent of the row. Default 32. */
  defaultSize?: number | undefined;
  /** Default 22. */
  minSize?: number | undefined;
  /** Default 50. */
  maxSize?: number | undefined;
  /**
   * Remembers the width the reader dragged to, in this browser, under this key. It also names the
   * panels, so keep it unique on the page.
   */
  storageKey?: string | undefined;
  /**
   * On a phone the panel is a sheet. True (default) adds a floating button to open it; pass false
   * when an AssistantSidebarTrigger is already on the page.
   */
  phoneTrigger?: boolean | undefined;
  messages?: Partial<AssistantSidebarMessages> | undefined;
  className?: string | undefined;
  /** Class names for the app's column. */
  contentClassName?: string | undefined;
}

/**
 * An assistant docked beside the app: the page on one side, the assistant on the other, with a
 * handle to resize between them. Closing folds it to a rail (or hides it); a shortcut opens it
 * from anywhere, moves the focus in, and closes it from inside, and the focus goes back to where
 * the reader was. Below the medium breakpoint the panel opens as a sheet instead. Works inside an
 * AppShell: give it the height below the header.
 */
export function AssistantSidebar(props: AssistantSidebarProps) {
  const outer = use(AssistantContext);
  const body = <AssistantBody {...props} />;
  if (outer !== null) return body;
  return <AssistantSidebarProvider {...props}>{body}</AssistantSidebarProvider>;
}

function AssistantBody({
  children,
  panel: body,
  title,
  icon,
  headerActions,
  collapsed = 'rail',
  defaultSize = 32,
  minSize = 22,
  maxSize = 50,
  storageKey,
  phoneTrigger = true,
  messages: overrides,
  className,
  contentClassName,
}: AssistantSidebarProps) {
  const m = { ...ASSISTANT_SIDEBAR_MESSAGES, ...overrides };
  const state = useAssistantSidebar();
  const { open, panelRef, railRef, requestRef, returnToRef, panelId, shortcut } = state;
  // The saved width is kept by panel id, so with a storage key the ids are fixed: a generated id
  // changes whenever the tree above changes, and the width the reader dragged to would be lost.
  const panelKey = storageKey === undefined ? panelId : `rx-assistant-${storageKey}`;
  const { Enter } = useAiParts();
  const mobile = useIsMobileLayout();
  const mac = useIsMac();
  const sizes = assistantSizes(defaultSize, minSize, maxSize);
  const glyph = icon ?? <SparkleIcon aria-hidden weight="fill" className="size-4" />;
  const keys = shortcut === null ? undefined : ariaKeyShortcut(shortcut, mac);

  // Carries out the focus move asked for by show or hide, once the panel or rail is drawn.
  useLayoutEffect(() => {
    const want = requestRef.current;
    if (want === null) return;
    if (mobile) {
      // The sheet moves the focus in and back itself; a request left over from the docked layout
      // must not fire later, when the layout turns wide again.
      requestRef.current = null;
      return;
    }
    requestRef.current = null;
    if (want === 'panel') {
      panelField(panelRef.current)?.focus();
      return;
    }
    const back = returnToRef.current;
    returnToRef.current = null;
    if (back?.isConnected === true && panelRef.current?.contains(back) !== true) back.focus();
    else railRef.current?.focus();
  });

  const header = (
    <div className="flex h-(--rx-app-shell-header-height) shrink-0 items-center gap-2 border-b border-line ps-4 pe-2">
      <span aria-hidden className="flex shrink-0 text-accent-strong">
        {glyph}
      </span>
      <h2
        data-part="assistant-title"
        tabIndex={-1}
        className="min-w-0 flex-1 truncate text-sm font-heading text-fg outline-none"
      >
        {title ?? m.label}
      </h2>
      <div className="flex shrink-0 items-center gap-1 pointer-coarse:gap-touch-gap">
        {headerActions}
        <Tooltip>
          <TooltipTrigger
            render={
              <button
                type="button"
                aria-label={m.close}
                aria-keyshortcuts={keys}
                data-part="assistant-close"
                onClick={state.hide}
                className={cn(
                  'relative inline-flex size-(--rx-button-height-md) cursor-pointer items-center justify-center rounded-(--rx-button-radius) text-fg-muted',
                  'transition-colors duration-fast ease-standard hover:bg-surface-hover hover:text-fg',
                  'outline-offset-2 focus-visible:outline-2 focus-visible:outline-focus',
                  touchHitArea,
                )}
              >
                <XIcon aria-hidden weight="bold" className="size-4" />
              </button>
            }
          />
          <TooltipContent side="bottom" {...(shortcut === null ? {} : { shortcut })}>
            {m.close}
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );

  if (mobile) {
    return (
      <div data-slot="assistant-sidebar" className={cn('relative flex min-h-0', className)}>
        <div className={cn('min-h-0 min-w-0 flex-1 overflow-auto', contentClassName)}>
          {children}
        </div>
        {phoneTrigger && !open && (
          <button
            type="button"
            aria-label={m.open}
            aria-haspopup="dialog"
            aria-expanded={false}
            data-part="assistant-fab"
            // Clears the home indicator on phones: the inset comes from the device.
            style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
            onClick={state.show}
            className={cn(
              'fixed end-4 bottom-4 z-40 inline-flex size-(--rx-control-height-touch) cursor-pointer items-center justify-center rounded-full',
              'bg-accent text-accent-contrast shadow-overlay hover:bg-accent-hover',
              'transition-[background-color,scale] duration-fast ease-standard active:scale-97',
              'outline-offset-2 focus-visible:outline-2 focus-visible:outline-focus',
            )}
          >
            <SparkleIcon aria-hidden weight="fill" className="size-5" />
          </button>
        )}
        <Drawer
          open={open}
          onOpenChange={(next) => {
            if (next) state.show();
            else state.hide();
          }}
        >
          <DrawerContent
            height="full"
            size="md"
            // The header carries the close button, beside its own actions.
            showClose={false}
            initialFocus={() => panelField(panelRef.current) ?? true}
          >
            <DrawerTitle className="sr-only">{title ?? m.label}</DrawerTitle>
            <aside
              ref={panelRef}
              id={panelId}
              aria-label={m.label}
              className="flex min-h-0 flex-1 flex-col"
            >
              {header}
              <div className="flex min-h-0 flex-1 flex-col">{body}</div>
            </aside>
          </DrawerContent>
        </Drawer>
      </div>
    );
  }

  return (
    <div data-slot="assistant-sidebar" className={cn('flex min-h-0 min-w-0', className)}>
      <ResizablePanelGroup className="flex-1" {...(storageKey === undefined ? {} : { storageKey })}>
        <ResizablePanel
          id={`${panelKey}-content`}
          minSize={100 - sizes.maxSize}
          maxSize={100}
          className={contentClassName}
        >
          {children}
        </ResizablePanel>
        {open && <ResizableHandle label={m.resize} />}
        {open && (
          <ResizablePanel
            id={`${panelKey}-assistant`}
            defaultSize={sizes.defaultSize}
            minSize={sizes.minSize}
            maxSize={sizes.maxSize}
            className="flex min-w-72 flex-col overflow-hidden"
          >
            <Enter from="end" className="flex min-h-0 flex-1 flex-col">
              <aside
                ref={panelRef}
                id={panelId}
                aria-label={m.label}
                data-part="assistant-panel"
                className="flex min-h-0 flex-1 flex-col bg-surface"
              >
                {header}
                <div className="flex min-h-0 flex-1 flex-col">{body}</div>
              </aside>
            </Enter>
          </ResizablePanel>
        )}
      </ResizablePanelGroup>
      {!open && collapsed === 'rail' && (
        <aside
          aria-label={m.label}
          data-part="assistant-rail"
          className="flex w-14 shrink-0 flex-col items-center border-s border-line bg-(--rx-sidebar-background) py-2"
        >
          <Tooltip>
            <TooltipTrigger
              render={
                <button
                  ref={railRef}
                  type="button"
                  aria-label={m.open}
                  aria-expanded={false}
                  aria-keyshortcuts={keys}
                  onClick={state.show}
                  className={cn(
                    'relative inline-flex size-(--rx-button-height-md) cursor-pointer items-center justify-center rounded-(--rx-button-radius) text-fg-muted',
                    'transition-colors duration-fast ease-standard hover:bg-surface-hover hover:text-fg',
                    'outline-offset-2 focus-visible:outline-2 focus-visible:outline-focus',
                    touchHitArea,
                  )}
                >
                  {glyph}
                </button>
              }
            />
            <TooltipContent side="inline-start" {...(shortcut === null ? {} : { shortcut })}>
              {m.open}
            </TooltipContent>
          </Tooltip>
        </aside>
      )}
    </div>
  );
}
