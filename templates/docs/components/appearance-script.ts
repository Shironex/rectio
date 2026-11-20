/**
 * The look of the app: a mode (light, dark or the system's). It lives on <html> as `data-mode` (no
 * `data-mode` follows the system) and is kept in local storage. The theme is fixed by
 * `data-theme="default"` on <html>. This module has no React in it, so the root layout can inline
 * the script.
 */
export const APPEARANCE_STORAGE_KEY = 'halyard-docs-appearance';

export type ModeId = 'system' | 'light' | 'dark';

export const MODES: readonly { value: ModeId; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

/** Applies the remembered mode before the first paint, so a dark user never sees a flash. */
export const APPEARANCE_SCRIPT = `try{var a=JSON.parse(localStorage.getItem('${APPEARANCE_STORAGE_KEY}')||'{}'),r=document.documentElement;if(a.mode==='light'||a.mode==='dark')r.dataset.mode=a.mode}catch(e){}`;
