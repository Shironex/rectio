import { CaretRightIcon, FileIcon, FolderIcon, FolderOpenIcon } from '@phosphor-icons/react';
import { cn } from '@rectio/ui';
import { useState, type ReactNode } from 'react';

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
  className?: string;
}

/**
 * A project's files as an indented tree. Folders open and close with a button that says whether
 * it is expanded; the highlighted entry is named in words for assistive technology as well.
 */
export function FileTree({ entries, label = 'Files', className }: FileTreeProps) {
  return (
    <div
      data-slot="file-tree"
      className={cn(
        'min-w-0 overflow-x-auto rounded-panel border border-line bg-code-background px-2 py-2.5 font-mono text-sm',
        className,
      )}
    >
      <Entries entries={entries} label={label} />
    </div>
  );
}

function Entries({
  entries,
  label,
  nested = false,
}: {
  entries: readonly FileTreeEntry[];
  label?: string;
  nested?: boolean;
}) {
  return (
    <ul
      aria-label={label}
      className={cn('flex flex-col', nested && 'ms-3.5 border-s border-line ps-2')}
    >
      {entries.map((entry) => (
        <li key={entry.name}>
          {entry.children === undefined ? <File entry={entry} /> : <Folder entry={entry} />}
        </li>
      ))}
    </ul>
  );
}

const ROW =
  'flex min-h-7 w-full items-center gap-2 rounded-control px-1.5 text-start whitespace-nowrap';

function Name({ entry }: { entry: FileTreeEntry }) {
  return (
    <>
      <span className={cn(entry.highlight === true ? 'font-strong text-accent-strong' : 'text-fg')}>
        {entry.name}
      </span>
      {entry.highlight === true && <span className="sr-only">(highlighted)</span>}
      {entry.note !== undefined && (
        <span className="font-sans text-xs text-fg-subtle">{entry.note}</span>
      )}
    </>
  );
}

function File({ entry }: { entry: FileTreeEntry }) {
  return (
    <div className={cn(ROW, 'ps-6')}>
      <FileIcon aria-hidden className="size-4 shrink-0 text-fg-subtle" />
      <Name entry={entry} />
    </div>
  );
}

function Folder({ entry }: { entry: FileTreeEntry }) {
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
        <Name entry={entry} />
      </button>
      {open && entry.children !== undefined && entry.children.length > 0 && (
        <Entries entries={entry.children} nested />
      )}
    </>
  );
}
