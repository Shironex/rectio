/**
 * Keyboard shortcuts written once, shown and matched per platform. A shortcut is a `+`-joined
 * string such as `mod+k`, `shift+mod+p` or `g` (case does not matter). `mod` is Command on Apple
 * platforms and Control elsewhere, so one string works for every user.
 */
export interface Shortcut {
  key: string;
  mod: boolean;
  shift: boolean;
  alt: boolean;
  ctrl: boolean;
}

const MODIFIERS = new Set(['mod', 'shift', 'alt', 'ctrl']);

export function parseShortcut(shortcut: string): Shortcut {
  const parts = shortcut
    .toLowerCase()
    .split('+')
    .map((part) => part.trim())
    .filter((part) => part !== '');
  const key = parts.find((part) => !MODIFIERS.has(part)) ?? '';
  return {
    key,
    mod: parts.includes('mod'),
    shift: parts.includes('shift'),
    alt: parts.includes('alt'),
    ctrl: parts.includes('ctrl'),
  };
}

const KEY_NAMES: Record<string, { mac: string; other: string; spoken: string }> = {
  enter: { mac: '↵', other: 'Enter', spoken: 'Enter' },
  escape: { mac: 'esc', other: 'Esc', spoken: 'Escape' },
  backspace: { mac: '⌫', other: 'Backspace', spoken: 'Backspace' },
  arrowup: { mac: '↑', other: '↑', spoken: 'Up arrow' },
  arrowdown: { mac: '↓', other: '↓', spoken: 'Down arrow' },
  arrowleft: { mac: '←', other: '←', spoken: 'Left arrow' },
  arrowright: { mac: '→', other: '→', spoken: 'Right arrow' },
  tab: { mac: '⇥', other: 'Tab', spoken: 'Tab' },
  space: { mac: 'Space', other: 'Space', spoken: 'Space' },
};

function keyLabel(key: string, mac: boolean): string {
  const named = KEY_NAMES[key];
  if (named !== undefined) return mac ? named.mac : named.other;
  return key.length === 1 ? key.toUpperCase() : key.charAt(0).toUpperCase() + key.slice(1);
}

/** The keys to draw, in platform order: `['⌘', 'K']` on a Mac, `['Ctrl', 'K']` elsewhere. */
export function shortcutKeys(shortcut: string, mac: boolean): string[] {
  const s = parseShortcut(shortcut);
  const keys: string[] = [];
  if (mac) {
    if (s.ctrl) keys.push('⌃');
    if (s.alt) keys.push('⌥');
    if (s.shift) keys.push('⇧');
    if (s.mod) keys.push('⌘');
  } else {
    if (s.mod || s.ctrl) keys.push('Ctrl');
    if (s.alt) keys.push('Alt');
    if (s.shift) keys.push('Shift');
  }
  keys.push(keyLabel(s.key, mac));
  return keys;
}

/** The shortcut in words, for an accessible name: `Command K` or `Control K`. */
export function shortcutLabel(shortcut: string, mac: boolean): string {
  const s = parseShortcut(shortcut);
  const words: string[] = [];
  if (s.ctrl || (s.mod && !mac)) words.push('Control');
  if (s.alt) words.push(mac ? 'Option' : 'Alt');
  if (s.shift) words.push('Shift');
  if (s.mod && mac) words.push('Command');
  words.push(KEY_NAMES[s.key]?.spoken ?? keyLabel(s.key, false));
  return words.join(' ');
}

/** The value for `aria-keyshortcuts`: `Meta+K` on a Mac, `Control+K` elsewhere. */
export function ariaKeyShortcut(shortcut: string, mac: boolean): string {
  const s = parseShortcut(shortcut);
  const parts: string[] = [];
  if (s.ctrl || (s.mod && !mac)) parts.push('Control');
  if (s.alt) parts.push('Alt');
  if (s.shift) parts.push('Shift');
  if (s.mod && mac) parts.push('Meta');
  parts.push(s.key.length === 1 ? s.key.toUpperCase() : keyLabel(s.key, false));
  return parts.join('+');
}

type KeyEventLike = Pick<KeyboardEvent, 'key' | 'metaKey' | 'ctrlKey' | 'shiftKey' | 'altKey'> &
  Partial<Pick<KeyboardEvent, 'code'>>;

/**
 * The key as a Latin letter or digit. On a layout that types other letters (Cyrillic, Greek)
 * `key` is that letter, so the physical key in `code` (`KeyK`, `Digit1`) stands in.
 */
function latinKey(event: KeyEventLike): string {
  const key = event.key.toLowerCase();
  if (key.length !== 1 || key <= '~' || event.code === undefined) return key;
  const physical = /^(?:Key([A-Z])|Digit([0-9]))$/.exec(event.code);
  return physical === null ? key : (physical[1] ?? physical[2] ?? key).toLowerCase();
}

export function matchesShortcut(event: KeyEventLike, shortcut: string, mac: boolean): boolean {
  const s = parseShortcut(shortcut);
  const wantMeta = s.mod && mac;
  const wantCtrl = s.ctrl || (s.mod && !mac);
  const key = latinKey(event);
  const target = s.key === 'space' ? ' ' : s.key;
  return (
    key === target &&
    event.metaKey === wantMeta &&
    event.ctrlKey === wantCtrl &&
    event.shiftKey === s.shift &&
    event.altKey === s.alt
  );
}

export function detectMac(): boolean {
  if (typeof navigator === 'undefined') return false;
  const platform =
    (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData?.platform ??
    navigator.platform;
  return /mac|iphone|ipad|ipod/i.test(platform);
}
