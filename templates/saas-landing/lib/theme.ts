'use client';

import { useSyncExternalStore } from 'react';

import { STORAGE } from '@/data/site';

/**
 * The visitor's theme and colour mode, kept on <html> as `data-theme` and `data-mode` (no
 * `data-mode` follows the system) and remembered in localStorage. The tokens read the attributes,
 * so every page, popup and overlay follows without a provider.
 */

export const THEMES = [
  { id: 'default', label: 'Default' },
  { id: 'ledger', label: 'Ledger' },
] as const;
export type ThemeId = (typeof THEMES)[number]['id'];

export const MODES = ['system', 'light', 'dark'] as const;
export type ModePreference = (typeof MODES)[number];

export interface ThemeChoice {
  theme: ThemeId;
  mode: ModePreference;
}

const isTheme = (value: unknown): value is ThemeId => THEMES.some((t) => t.id === value);
const isMode = (value: unknown): value is ModePreference => MODES.some((mode) => mode === value);

function read(): string {
  const root = document.documentElement;
  const theme = isTheme(root.dataset.theme) ? root.dataset.theme : 'default';
  const mode = isMode(root.dataset.mode) ? root.dataset.mode : 'system';
  return `${theme}:${mode}`;
}

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme', 'data-mode'],
  });
  return () => {
    observer.disconnect();
  };
}

export function useThemeChoice(): ThemeChoice {
  const snapshot = useSyncExternalStore(subscribe, read, () => 'default:system');
  const [theme, mode] = snapshot.split(':');
  return { theme: isTheme(theme) ? theme : 'default', mode: isMode(mode) ? mode : 'system' };
}

export function setThemeChoice(next: ThemeChoice) {
  const root = document.documentElement;
  root.dataset.theme = next.theme;
  if (next.mode === 'system') delete root.dataset.mode;
  else root.dataset.mode = next.mode;
  try {
    localStorage.setItem(STORAGE.theme, JSON.stringify(next));
  } catch {
    // Storage blocked: the choice holds for this page view.
  }
}
