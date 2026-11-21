'use client';

import { Fragment, type ComponentProps, type ReactNode } from 'react';

import { cn } from '../lib/cn';
import { shortcutKeys, shortcutLabel } from './shortcut';
import { useIsMac } from './use-shortcut';

/** Symbols that a screen reader would read as nothing or as their Unicode name. */
const SPOKEN: Record<string, string> = {
  '⌘': 'Command',
  '⇧': 'Shift',
  '⌥': 'Option',
  '⌃': 'Control',
  '↵': 'Enter',
  '⏎': 'Enter',
  '⌫': 'Backspace',
  '⎋': 'Escape',
  '⇥': 'Tab',
  '↑': 'Up arrow',
  '↓': 'Down arrow',
  '←': 'Left arrow',
  '→': 'Right arrow',
};

const SIZES = {
  sm: 'h-4.5 min-w-4.5 px-1 text-xs',
  md: 'h-5.5 min-w-5.5 px-1.5 text-xs',
} as const;

export interface KbdProps extends ComponentProps<'kbd'> {
  size?: keyof typeof SIZES | undefined;
}

/**
 * One key, drawn as a keycap. A symbol such as ⌘ is shown as the symbol and read as its name
 * (Command), so the hint makes sense when heard as well as seen.
 */
export function Kbd({ size = 'md', className, children, ...props }: KbdProps) {
  const spoken = typeof children === 'string' ? SPOKEN[children] : undefined;
  return (
    <kbd
      data-slot="kbd"
      className={cn(
        'inline-flex shrink-0 items-center justify-center font-mono leading-none font-medium whitespace-nowrap text-fg-muted',
        'rounded-badge border border-b-2 border-line-strong bg-surface-raised',
        SIZES[size],
        className,
      )}
      {...props}
    >
      {spoken === undefined ? (
        children
      ) : (
        <>
          <span aria-hidden>{children}</span>
          <span className="sr-only">{spoken}</span>
        </>
      )}
    </kbd>
  );
}

export interface KbdComboProps extends Omit<ComponentProps<'kbd'>, 'children'> {
  /** The keys pressed together, in order: `['⌘', 'K']`. */
  keys: readonly string[];
  size?: keyof typeof SIZES | undefined;
  /** Drawn between keys. Hidden from assistive technology, which reads "Command K". */
  separator?: ReactNode | undefined;
}

/** Keys pressed together. Nested `kbd` elements, the HTML way to mark up a key combination. */
export function KbdCombo({ keys, size = 'md', separator, className, ...props }: KbdComboProps) {
  return (
    <kbd
      data-slot="kbd-combo"
      className={cn('inline-flex items-center gap-1 font-sans text-xs text-fg-subtle', className)}
      {...props}
    >
      {keys.map((key, i) => (
        <Fragment key={`${key}-${String(i)}`}>
          {i > 0 && separator !== undefined && <span aria-hidden>{separator}</span>}
          <Kbd size={size}>{key}</Kbd>
        </Fragment>
      ))}
    </kbd>
  );
}

export interface KbdShortcutProps extends Omit<ComponentProps<'kbd'>, 'children'> {
  /** Such as `mod+k`: Command on Apple platforms, Control elsewhere. */
  shortcut: string;
  size?: keyof typeof SIZES | undefined;
  /** Classes for each keycap. */
  keyClassName?: string | undefined;
}

/**
 * A shortcut as keycaps for the user's platform (`⌘ K` or `Ctrl K`). Screen readers hear it in
 * words ("Command K") instead of symbol by symbol.
 */
export function KbdShortcut({
  shortcut,
  size = 'sm',
  className,
  keyClassName,
  ...props
}: KbdShortcutProps) {
  const mac = useIsMac();
  return (
    <kbd
      data-slot="kbd-shortcut"
      className={cn('inline-flex items-center gap-0.5 font-sans not-italic', className)}
      {...props}
    >
      <span className="sr-only">{shortcutLabel(shortcut, mac)}</span>
      {shortcutKeys(shortcut, mac).map((key, index) => (
        <Kbd key={`${key}-${String(index)}`} size={size} aria-hidden className={keyClassName}>
          {key}
        </Kbd>
      ))}
    </kbd>
  );
}
