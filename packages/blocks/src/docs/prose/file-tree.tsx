import { CaretRightIcon, FileIcon, FolderIcon, FolderOpenIcon } from '@phosphor-icons/react';
import { cn } from '@rectio/ui';
import { useState, type ReactNode } from 'react';

import { mergeMessages } from '../lib/messages';

export interface FileTreeEntry {
  name: string;
  /** Entries inside a folder. An entry with `children`, even empty, is a folder. */
  children?: readonly FileTreeEntry[] | undefined;
  /** Draws the entry in the accent, for the file the text is about. */
  highlight?: boolean | undefined;
  /** A short note after the name, such as "created by init". */
  note?: ReactNode;
  /** Folders start open unless this is false. */
  defaultOpen?: boolean | undefined;
}

export interface FileTreeProps {
  entries: readonly FileTreeEntry[];
  /** Accessible name of the tree. Default "Files". */
  label?: string;
  /** The tree's words; pass the keys you change. See `FILE_TREE_MESSAGES`. */
  messages?: Partial<FileTreeMessages>;
  className?: string;
}

export interface FileTreeMessages {
  /** Accessible name of the tree. */
  label: string;
  /** Read after the highlighted entry's name. */
  highlighted: string;
}

export const FILE_TREE_MESSAGES: FileTreeMessages = {
  label: 'Files',
  highlighted: '(highlighted)',
};

/**
 * A project's files as an indented tree. Folders open and close with a button that says whether
 * it is expanded; the highlighted entry is named in words for assistive technology as well.
 */
export function FileTree({ entries, label, messages, className }: FileTreeProps) {
  const m = mergeMessages(FILE_TREE_MESSAGES, messages);
  return (
    <div
      data-slot="file-tree"
      className={cn(
        'min-w-0 overflow-x-auto rounded-panel border border-line bg-code-background px-2 py-2.5 font-mono text-sm',
        className,
      )}
    >
      <Entries entries={entries} label={label ?? m.label} highlighted={m.highlighted} />
    </div>
  );
}

function Entries({
  entries,
  label,
  highlighted,
  nested = false,
}: {
  entries: readonly FileTreeEntry[];
  label?: string;
  highlighted: string;
  nested?: boolean;
}) {
  return (
    <ul
      aria-label={label}
      className={cn('flex flex-col', nested && 'ms-3.5 border-s border-line ps-2')}
    >
      {entries.map((entry) => (
        <li key={entry.name}>
          {entry.children === undefined ? (
            <File entry={entry} highlighted={highlighted} />
          ) : (
            <Folder entry={entry} highlighted={highlighted} />
          )}
        </li>
      ))}
    </ul>
  );
}

const ROW =
  'flex min-h-7 w-full items-center gap-2 rounded-control px-1.5 text-start whitespace-nowrap';

function Name({ entry, highlighted }: { entry: FileTreeEntry; highlighted: string }) {
  return (
    <>
      <span className={cn(entry.highlight === true ? 'font-strong text-accent-strong' : 'text-fg')}>
        {entry.name}
      </span>
      {entry.highlight === true && <span className="sr-only">{highlighted}</span>}
      {entry.note !== undefined && (
        <span className="font-sans text-xs text-fg-muted">{entry.note}</span>
      )}
    </>
  );
}

function File({ entry, highlighted }: { entry: FileTreeEntry; highlighted: string }) {
  return (
    <div className={cn(ROW, 'ps-6')}>
      <FileIcon aria-hidden className="size-4 shrink-0 text-fg-subtle" />
      <Name entry={entry} highlighted={highlighted} />
    </div>
  );
}

function Folder({ entry, highlighted }: { entry: FileTreeEntry; highlighted: string }) {
  const [open, setOpen] = useState(entry.defaultOpen !== false);
  const Icon = open ? FolderOpenIcon : FolderIcon;
  return (
    <>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => {
          setOpen(!open);
        }}
        className={cn(
          ROW,
          'cursor-pointer pointer-fine:hover:bg-surface-hover pointer-coarse:min-h-(--rx-control-height-touch)',
          'outline-offset-0 focus-visible:outline-2 focus-visible:outline-focus',
        )}
      >
        <CaretRightIcon
          aria-hidden
          weight="bold"
          className={cn(
            'size-3 shrink-0 text-fg-subtle transition-transform duration-base ease-standard motion-reduce:transition-none',
            open && 'rotate-90',
          )}
        />
        <Icon aria-hidden weight="fill" className="size-4 shrink-0 text-accent-strong" />
        <Name entry={entry} highlighted={highlighted} />
      </button>
      {open && entry.children !== undefined && entry.children.length > 0 && (
        <Entries entries={entry.children} highlighted={highlighted} nested />
      )}
    </>
  );
}
