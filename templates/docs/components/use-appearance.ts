'use client';

import { useSyncExternalStore } from 'react';

import { APPEARANCE_STORAGE_KEY, MODES, type ModeId } from './appearance-script';

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-mode'],
  });
  return () => {
    observer.disconnect();
  };
}

const read = () => document.documentElement.dataset.mode ?? 'system';

export interface Appearance {
  mode: ModeId;
}

/** The look the app shows right now, in step with `data-mode` on <html>. */
export function useAppearance(): Appearance {
  const mode = useSyncExternalStore(subscribe, read, () => 'system');
  return { mode: MODES.find((m) => m.value === mode)?.value ?? 'system' };
}

/** Changes the mode, applies it to <html> and remembers it. */
export function setAppearance(look: Appearance) {
  const root = document.documentElement;
  if (look.mode === 'system') delete root.dataset.mode;
  else root.dataset.mode = look.mode;
  try {
    localStorage.setItem(APPEARANCE_STORAGE_KEY, JSON.stringify(look));
  } catch {
    // Private windows may refuse storage; the change still holds for this visit.
  }
}
