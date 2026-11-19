'use client';

import { useSyncExternalStore } from 'react';

/**
 * A localStorage value as React state that is safe to render on the server: `undefined` until the
 * browser has read it (and on the server), then the stored string or null. Writes through
 * `writeStored` reach every reader on the page, and other tabs through the storage event. When
 * storage is blocked, writes are kept in memory, so a choice still holds for this page view.
 */

const EVENT = 'quarry-storage';

/** Writes made on this page, read first: the fallback when storage is blocked. */
const memory = new Map<string, string | null>();

function subscribe(onChange: () => void) {
  window.addEventListener('storage', onChange);
  window.addEventListener(EVENT, onChange);
  return () => {
    window.removeEventListener('storage', onChange);
    window.removeEventListener(EVENT, onChange);
  };
}

export function readStored(key: string): string | null {
  if (memory.has(key)) return memory.get(key) ?? null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** Writes a value, or removes the key when given null, and tells every reader. */
export function writeStored(key: string, value: string | null) {
  memory.set(key, value);
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    // Storage blocked: the in-memory copy keeps the choice for this page view.
  }
  window.dispatchEvent(new Event(EVENT));
}

export function useStored(key: string): string | null | undefined {
  return useSyncExternalStore(
    subscribe,
    () => readStored(key),
    () => undefined,
  );
}
