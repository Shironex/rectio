'use client';

import { useSyncExternalStore } from 'react';

/**
 * A localStorage value as React state that is safe to render on the server: `undefined` until the
 * browser has read it (and on the server), then the stored string or null. Writes through
 * `writeStored` reach every reader on the page, and other tabs through the storage event.
 */

const EVENT = 'rostra-storage';

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
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStored(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage blocked: readers keep the old value for this page view.
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
