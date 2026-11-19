'use client';

import { useSyncExternalStore } from 'react';

/**
 * A localStorage value as React state that is safe to render on the server: `undefined` until the
 * browser has read it (and on the server), then the stored string or null. Writes through
 * `writeStored` reach every reader on the page, and other tabs through the storage event. When
 * storage is blocked, writes are kept in memory, so a choice still holds for this page view.
 */

const EVENT = 'rostra-storage';

/** Writes that storage refused, kept for this page view. */
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
  try {
    if (!memory.has(key)) return localStorage.getItem(key);
  } catch {
    // Storage blocked: fall back to what this page wrote.
  }
  return memory.get(key) ?? null;
}

/** Writes a value, or removes the key when given null, and tells every reader. */
export function writeStored(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
    memory.delete(key);
  } catch {
    // Storage blocked: the in-memory copy keeps the choice for this page view.
    memory.set(key, value);
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
