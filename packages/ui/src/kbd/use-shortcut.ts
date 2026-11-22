'use client';

import { useEffect, useRef, useSyncExternalStore } from 'react';

import { detectMac, matchesShortcut, parseShortcut } from './shortcut';

const noSubscribe = () => () => undefined;

/**
 * True on Apple platforms. False on the server and during hydration, then corrected, so a
 * server-rendered shortcut reads `Ctrl K` for a moment on a Mac rather than mismatching.
 */
export function useIsMac(): boolean {
  return useSyncExternalStore(noSubscribe, detectMac, () => false);
}

function isEditable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.tagName === 'SELECT'
  );
}

export interface UseShortcutOptions {
  /** Default true. Pass false to stop listening, for instance while a form has unsaved edits. */
  enabled?: boolean;
  /**
   * Whether the shortcut fires while focus is in a text field or editor. Default: yes for a
   * shortcut with Command, Control or Alt, no for a bare key. Set false for a shortcut that a text
   * editor also uses, such as `mod+b` for bold.
   */
  allowInFields?: boolean;
  /**
   * Whether a held key fires again as it repeats. Default true; pass false for a shortcut that
   * toggles something, so holding it does not open and close it over and over.
   */
  repeat?: boolean;
}

/**
 * Calls `handler` when the shortcut is pressed anywhere on the page. A shortcut without a modifier
 * (`g`, `?`) is ignored while the user types in a field, so it never eats a letter (see
 * `allowInFields`). Pass null to register nothing.
 */
export function useShortcut(
  shortcut: string | null | undefined,
  handler: (event: KeyboardEvent) => void,
  { enabled = true, allowInFields, repeat = true }: UseShortcutOptions = {},
): void {
  const latest = useRef(handler);
  useEffect(() => {
    latest.current = handler;
  });
  useEffect(() => {
    if (shortcut === null || shortcut === undefined || !enabled) return;
    const mac = detectMac();
    const parsed = parseShortcut(shortcut);
    const inFields = allowInFields ?? (parsed.mod || parsed.ctrl || parsed.alt);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.isComposing) return;
      if (!repeat && event.repeat) {
        // Still the shortcut's key: keep the browser from acting on it while it is held.
        if (matchesShortcut(event, shortcut, mac)) event.preventDefault();
        return;
      }
      if (!inFields && isEditable(event.target)) return;
      if (!matchesShortcut(event, shortcut, mac)) return;
      event.preventDefault();
      latest.current(event);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [shortcut, enabled, allowInFields, repeat]);
}
