import { CheckIcon, CopyIcon } from '@phosphor-icons/react';
import { cn } from '@rectio/ui';
import { useEffect, useRef, useState } from 'react';

import { mergeMessages } from './messages';

export interface CopyButtonProps {
  /** The text to copy, or a function that reads it at the moment of the press. */
  value: string | (() => string);
  /** Accessible name before the copy. Default "Copy code". */
  label?: string;
  /** Said and shown once the text is on the clipboard. Default "Copied". */
  copiedLabel?: string;
  /** The button's words; pass the keys you change. See `COPY_BUTTON_MESSAGES`. */
  messages?: Partial<CopyButtonMessages>;
  className?: string;
}

export interface CopyButtonMessages {
  /** Accessible name before the copy. */
  copy: string;
  /** Said and shown once the text is on the clipboard. */
  copied: string;
}

export const COPY_BUTTON_MESSAGES: CopyButtonMessages = {
  copy: 'Copy code',
  copied: 'Copied',
};

/**
 * Copies a value to the clipboard and says so: the icon turns into a check for two seconds and a
 * polite status announces it. A browser that refuses the clipboard leaves the icon as it was.
 */
export function CopyButton({ value, label, copiedLabel, messages, className }: CopyButtonProps) {
  const m = mergeMessages(COPY_BUTTON_MESSAGES, messages);
  const copyName = label ?? m.copy;
  const copiedName = copiedLabel ?? m.copied;
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(
    () => () => {
      clearTimeout(timer.current);
    },
    [],
  );
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(typeof value === 'function' ? value() : value);
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      setCopied(false);
    }
  };
  return (
    <>
      <button
        type="button"
        aria-label={copied ? copiedName : copyName}
        data-slot="copy-button"
        data-copied={copied || undefined}
        onClick={() => {
          void copy();
        }}
        className={cn(
          'relative inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-control text-fg-subtle',
          'transition-colors duration-fast ease-standard pointer-fine:hover:bg-surface-hover pointer-fine:hover:text-fg',
          'data-copied:text-positive-strong active:scale-96 motion-reduce:active:scale-100',
          'outline-offset-2 focus-visible:outline-2 focus-visible:outline-focus',
          'pointer-coarse:after:absolute pointer-coarse:after:top-1/2 pointer-coarse:after:left-1/2 pointer-coarse:after:size-(--rx-button-height-touch) pointer-coarse:after:-translate-1/2',
          className,
        )}
      >
        {copied ? (
          <CheckIcon aria-hidden weight="bold" className="size-4" />
        ) : (
          <CopyIcon aria-hidden weight="bold" className="size-4" />
        )}
      </button>
      <span role="status" className="sr-only">
        {copied ? copiedName : ''}
      </span>
    </>
  );
}
