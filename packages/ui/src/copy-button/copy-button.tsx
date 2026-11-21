'use client';

import { CheckIcon, CopyIcon } from '@phosphor-icons/react';
import { useEffect, useRef, useState, type ReactNode } from 'react';

import { Button, type ButtonProps } from '../button/button';
import { cn } from '../lib/cn';
import { copyToClipboard } from './clipboard';

export type CopyButtonProps = Omit<ButtonProps, 'onClick' | 'children' | 'iconOnly' | 'value'> & {
  /** The text to copy, or a function that returns it at the moment of the press. */
  value: string | (() => string);
  /** The button's name, read by screen readers and shown with `showLabel`. Default "Copy". */
  label?: string;
  /** Said and shown once the text is on the clipboard. Default "Copied". */
  copiedLabel?: string;
  /** Show the label beside the icon. Without it the button is a square icon button. */
  showLabel?: boolean;
  /** After a copy, such as to raise a toast. */
  onCopy?: (value: string) => void;
  /** When the browser refuses the copy. The button stays as it was. */
  onCopyError?: (error: unknown) => void;
  /** How long the copied state shows, in milliseconds. Default 2000. */
  resetAfter?: number;
  /**
   * Draws the icon pair, for the motion add-on. Gets whether the copied state is showing; the
   * button keeps the copy logic, the names and the status message.
   */
  renderIcon?: (copied: boolean) => ReactNode;
};

/**
 * The copy and check icons in one box: the check takes the copy icon's place with a short
 * crossfade, a slight scale and a blur that hides the overlap. Under reduced motion they swap.
 */
function CopyIcons({ copied }: { copied: boolean }) {
  const icon = cn(
    'col-start-1 row-start-1 size-4',
    'transition-[opacity,scale,filter] duration-fast ease-standard motion-reduce:transition-none',
  );
  return (
    <span aria-hidden data-part="icons" className="grid place-items-center">
      <CopyIcon
        weight="bold"
        className={cn(icon, copied && 'scale-(--rx-motion-scale-from) opacity-0 blur-xs')}
      />
      <CheckIcon
        weight="bold"
        className={cn(
          icon,
          'text-positive-strong',
          !copied && 'scale-(--rx-motion-scale-from) opacity-0 blur-xs',
        )}
      />
    </span>
  );
}

/**
 * Copies a value, such as an IBAN, an API key or an invoice link, and says so: the icon turns to a
 * check and screen readers hear "Copied". A ghost icon button by default; `showLabel` adds the
 * label. Falls back to the copy command where the Clipboard API is not allowed.
 */
export function CopyButton({
  value,
  label = 'Copy',
  copiedLabel = 'Copied',
  showLabel = false,
  onCopy,
  onCopyError,
  resetAfter = 2000,
  renderIcon,
  variant = 'ghost',
  size = 'sm',
  className,
  ...props
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(
    () => () => {
      clearTimeout(timer.current);
    },
    [],
  );

  return (
    <>
      <Button
        data-slot="copy-button"
        data-copied={copied || undefined}
        variant={variant}
        size={size}
        iconOnly={!showLabel}
        {...(showLabel ? {} : { 'aria-label': label })}
        {...(className === undefined ? {} : { className })}
        onClick={() => {
          const text = typeof value === 'function' ? value() : value;
          copyToClipboard(text).then(
            () => {
              setCopied(true);
              clearTimeout(timer.current);
              timer.current = setTimeout(() => {
                setCopied(false);
              }, resetAfter);
              onCopy?.(text);
            },
            (error: unknown) => {
              onCopyError?.(error);
            },
          );
        }}
        {...props}
      >
        {renderIcon ? renderIcon(copied) : <CopyIcons copied={copied} />}
        {showLabel && (
          // Both labels in one cell, so the button keeps its width when the label changes. The
          // hidden one is left out of the accessible name.
          <span className="grid">
            <span
              aria-hidden={copied || undefined}
              className={cn('col-start-1 row-start-1', copied && 'invisible')}
            >
              {label}
            </span>
            <span
              aria-hidden={!copied || undefined}
              className={cn('col-start-1 row-start-1', !copied && 'invisible')}
            >
              {copiedLabel}
            </span>
          </span>
        )}
      </Button>
      {/* The name of a focused button changing is not announced, so a status says it. */}
      <span role="status" className="sr-only">
        {copied ? copiedLabel : ''}
      </span>
    </>
  );
}
