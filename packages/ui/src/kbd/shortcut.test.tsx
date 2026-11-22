import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { KbdShortcut } from './kbd';
import {
  ariaKeyShortcut,
  matchesShortcut,
  parseShortcut,
  shortcutKeys,
  shortcutLabel,
} from './shortcut';
import { useShortcut } from './use-shortcut';

const press = (init: Partial<KeyboardEvent>) => ({
  key: 'k',
  metaKey: false,
  ctrlKey: false,
  shiftKey: false,
  altKey: false,
  ...init,
});

describe('shortcuts', () => {
  it('parse modifiers in any order and case', () => {
    expect(parseShortcut('Shift+Mod+P')).toEqual({
      key: 'p',
      mod: true,
      shift: true,
      alt: false,
      ctrl: false,
    });
  });

  it('draw Command on a Mac and Control elsewhere', () => {
    expect(shortcutKeys('mod+k', true)).toEqual(['⌘', 'K']);
    expect(shortcutKeys('mod+k', false)).toEqual(['Ctrl', 'K']);
    expect(shortcutKeys('shift+mod+enter', true)).toEqual(['⇧', '⌘', '↵']);
  });

  it('are spoken in words and declared for aria-keyshortcuts', () => {
    expect(shortcutLabel('mod+k', true)).toBe('Command K');
    expect(shortcutLabel('mod+k', false)).toBe('Control K');
    expect(ariaKeyShortcut('mod+b', true)).toBe('Meta+B');
    expect(ariaKeyShortcut('mod+b', false)).toBe('Control+B');
  });

  it('match only the exact combination for the platform', () => {
    expect(matchesShortcut(press({ metaKey: true }), 'mod+k', true)).toBe(true);
    expect(matchesShortcut(press({ ctrlKey: true }), 'mod+k', true)).toBe(false);
    expect(matchesShortcut(press({ ctrlKey: true }), 'mod+k', false)).toBe(true);
    expect(matchesShortcut(press({ ctrlKey: true, shiftKey: true }), 'mod+k', false)).toBe(false);
    expect(matchesShortcut(press({ key: 'K', metaKey: true }), 'mod+k', true)).toBe(true);
  });
});

function Listener({
  shortcut,
  onPress,
  repeat,
}: {
  shortcut: string;
  onPress: () => void;
  repeat?: boolean;
}) {
  useShortcut(shortcut, onPress, repeat === undefined ? {} : { repeat });
  return <input aria-label="Memo" />;
}

describe('useShortcut', () => {
  it('fires on the page and ignores a bare key while typing', async () => {
    const onPress = vi.fn();
    render(<Listener shortcut="g" onPress={onPress} />);
    await userEvent.keyboard('g');
    expect(onPress).toHaveBeenCalledTimes(1);
    await userEvent.type(screen.getByRole('textbox', { name: 'Memo' }), 'g');
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('fires a modified shortcut even from a field', async () => {
    const onPress = vi.fn();
    render(<Listener shortcut="mod+k" onPress={onPress} />);
    screen.getByRole('textbox', { name: 'Memo' }).focus();
    // jsdom reports no platform, so mod is Control here.
    await userEvent.keyboard('{Control>}k{/Control}');
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('fires on a held key unless told not to repeat', () => {
    const held = { key: 'k', code: 'KeyK', ctrlKey: true };
    const onRepeat = vi.fn();
    const { unmount } = render(<Listener shortcut="mod+k" onPress={onRepeat} />);
    fireEvent.keyDown(document, held);
    fireEvent.keyDown(document, { ...held, repeat: true });
    expect(onRepeat).toHaveBeenCalledTimes(2);
    unmount();
    const onToggle = vi.fn();
    render(<Listener shortcut="mod+k" onPress={onToggle} repeat={false} />);
    fireEvent.keyDown(document, held);
    const repeated = fireEvent.keyDown(document, { ...held, repeat: true });
    expect(onToggle).toHaveBeenCalledTimes(1);
    // The held key stays the shortcut's: the browser does not act on it either.
    expect(repeated).toBe(false);
  });
});

describe('KbdShortcut', () => {
  it('draws keycaps and reads as words', () => {
    render(<KbdShortcut shortcut="mod+k" />);
    expect(screen.getByText('Control K')).toHaveClass('sr-only');
    expect(screen.getByText('Ctrl')).toHaveAttribute('aria-hidden', 'true');
  });
});

describe('shortcuts on other layouts', () => {
  it('match by the physical key when the layout types another letter', () => {
    expect(matchesShortcut(press({ key: 'л', code: 'KeyK', ctrlKey: true }), 'mod+k', false)).toBe(
      true,
    );
    expect(matchesShortcut(press({ key: 'л', code: 'KeyK', ctrlKey: true }), 'mod+b', false)).toBe(
      false,
    );
  });
});
