/**
 * The look of the app: a theme (default or ledger) and a mode (light, dark or the system's). Both
 * live on <html> as `data-theme` and `data-mode` (no `data-mode` follows the system) and are kept
 * in local storage. This module has no React in it, so the root layout can inline the script.
 */
export const APPEARANCE_STORAGE_KEY = 'lindwell-appearance';

export type ThemeId = 'default' | 'ledger';
export type ModeId = 'system' | 'light' | 'dark';

export const THEMES: readonly { value: ThemeId; label: string; description: string }[] = [
  { value: 'default', label: 'Default', description: 'Warm neutrals and a cobalt accent.' },
  {
    value: 'ledger',
    label: 'Ledger',
    description: 'Green-black ink, a citron accent, sharper corners.',
  },
];

export const MODES: readonly { value: ModeId; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

/** Applies the remembered look before the first paint, so a dark or ledger user never sees a flash. */
export const APPEARANCE_SCRIPT = `try{var a=JSON.parse(localStorage.getItem('${APPEARANCE_STORAGE_KEY}')||'{}'),r=document.documentElement;if(a.theme==='ledger'||a.theme==='default')r.dataset.theme=a.theme;if(a.mode==='light'||a.mode==='dark')r.dataset.mode=a.mode}catch(e){}`;
