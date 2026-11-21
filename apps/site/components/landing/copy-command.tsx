'use client';

import { CheckIcon, CopyIcon } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';

/** A shell command with a copy button. Says "Copied" for a moment, in words and to screen readers. */
export function CopyCommand({ command, className }: { command: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => {
      setCopied(false);
    }, 1600);
    return () => {
      clearTimeout(id);
    };
  }, [copied]);
  return (
    // A plain join, not cn: this sits in the hero, and the class merger is code the first screen
    // can do without. Callers only add classes the base does not set.
    <div
      className={`inline-flex min-h-11 max-w-full items-center gap-1 rounded-control border border-line bg-surface py-1 ps-3.5 pe-1 font-mono text-sm text-fg pointer-coarse:min-h-12 ${className ?? ''}`}
    >
      {/* The prompt sits in the same line box as the command, so both share a baseline when a long
          command wraps on a narrow screen instead of hiding behind a scroll. */}
      <span className="min-w-0 break-words">
        <span aria-hidden className="me-1.5 text-fg-muted select-none">
          $
        </span>
        <code>{command}</code>
      </span>
      <button
        type="button"
        onClick={() => {
          navigator.clipboard.writeText(command).then(
            () => {
              setCopied(true);
            },
            () => {
              // Clipboard refused (permissions, insecure origin): the command stays selectable.
            },
          );
        }}
        className="site-press ms-2 inline-flex size-9 shrink-0 cursor-pointer pointer-coarse:size-11 items-center justify-center rounded-control text-fg-muted transition-colors duration-fast ease-standard pointer-fine:hover:bg-surface-hover pointer-fine:hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-focus"
      >
        {copied ? (
          <CheckIcon aria-hidden weight="bold" className="size-4 text-positive-strong" />
        ) : (
          <CopyIcon aria-hidden weight="bold" className="size-4" />
        )}
        <span className="sr-only">{copied ? 'Copied' : `Copy ${command}`}</span>
      </button>
      <span role="status" className="sr-only">
        {copied ? 'Command copied' : ''}
      </span>
    </div>
  );
}
