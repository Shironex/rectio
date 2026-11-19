import {
  ArchiveIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  ArrowsDownUpIcon,
  CaretRightIcon,
  CodeIcon,
  DownloadSimpleIcon,
  FileIcon,
  FileTextIcon,
  FilmStripIcon,
  FolderOpenIcon,
  FolderPlusIcon,
  FolderSimpleIcon,
  HardDrivesIcon,
  ImageIcon,
  PencilSimpleIcon,
  PresentationChartIcon,
  TableIcon,
  TextAlignLeftIcon,
  TrashIcon,
  UploadSimpleIcon,
  WaveformIcon,
  XIcon,
  type Icon,
} from '@phosphor-icons/react';
import {
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Field,
  FieldError,
  FieldLabel,
  Input,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  cn,
} from '@rectio/ui';
import { useState, type KeyboardEvent } from 'react';

import { useBlockParts } from '../../lib/block-parts';
import { BlockPanel } from '../../lib/block-panel';
import { ChoiceSelect, type Choice } from '../../lib/choice-select';
import { EmptyNote } from '../../lib/empty-note';
import { resolveLocale } from '../../lib/finance';
import { ActionMenu, type MenuAction } from '../lib/action-menu';
import { UsageMeter } from '../lib/meter';
import { formatBytes, formatDateTime, plural, relativeTime } from '../lib/saas';
import { focusRing } from '../lib/styles';
import {
  fileEntriesSize,
  fileKindOf,
  fileNameError,
  sortFileEntries,
  storageLevel,
  storageNeedsAttention,
  type FileEntry,
  type FileKind,
  type FilePathSegment,
  type FileSortKey,
  type StorageUsage,
} from './file-manager.logic';

export interface FileManagerProps {
  /** The folders from the root to the one shown, root first; the last is the current folder. */
  path: readonly FilePathSegment[];
  /** What the current folder holds. */
  entries: readonly FileEntry[];
  storage?: StorageUsage | undefined;
  /** Opens a folder or a file; names become buttons when given. */
  onOpen?: (entry: FileEntry) => void;
  /** Goes to a folder on the path; the breadcrumb becomes buttons when given. */
  onNavigate?: (folderId: string) => void;
  onUpload?: () => void;
  onCreateFolder?: () => void;
  /** Called with a valid, new name; the row renames in place. */
  onRename?: (entryId: string, name: string) => void;
  onDownload?: (entryIds: string[]) => void;
  /** Asked to confirm first. */
  onDelete?: (entryIds: string[]) => void;
  /** The moment "modified" is measured from. */
  now?: Date;
  locale?: string;
  title?: string;
  className?: string;
}

const KIND_ICONS: Record<FileKind, Icon> = {
  // Distinct shapes rather than lettered page icons: a label inside a 16px glyph cannot be read.
  folder: FolderSimpleIcon,
  document: TextAlignLeftIcon,
  spreadsheet: TableIcon,
  presentation: PresentationChartIcon,
  pdf: FileTextIcon,
  image: ImageIcon,
  video: FilmStripIcon,
  audio: WaveformIcon,
  archive: ArchiveIcon,
  code: CodeIcon,
  other: FileIcon,
};

const KIND_WORDS: Record<FileKind, string> = {
  folder: 'Folder',
  document: 'Document',
  spreadsheet: 'Spreadsheet',
  presentation: 'Presentation',
  pdf: 'PDF',
  image: 'Image',
  video: 'Video',
  audio: 'Audio',
  archive: 'Archive',
  code: 'Code',
  other: 'File',
};

const SORTS: readonly Choice<FileSortKey>[] = [
  { value: 'name', label: 'Name' },
  { value: 'modified', label: 'Last modified' },
  { value: 'size', label: 'Size' },
];

const WIDE = 'hidden @2xl:table-cell';

/**
 * One folder of a workspace's files: where you are, folders first and then files with their kind,
 * size, owner and last change, sorting, renaming in place, and delete for one or several with a
 * confirmation. The block holds only the selection and the rename draft; changes go to your
 * callbacks.
 */
export function FileManager({
  path,
  entries,
  storage,
  onOpen,
  onNavigate,
  onUpload,
  onCreateFolder,
  onRename,
  onDownload,
  onDelete,
  now = new Date(),
  locale: requestedLocale,
  title,
  className,
}: FileManagerProps) {
  const locale = resolveLocale(requestedLocale);
  const { Button, Rows, Row } = useBlockParts();
  const [sort, setSort] = useState<{ key: FileSortKey; ascending: boolean }>({
    key: 'name',
    ascending: true,
  });
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [renaming, setRenaming] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string[] | null>(null);

  const current = path.at(-1);
  const sorted = sortFileEntries(entries, sort.key, sort.ascending);
  // Selection never outlives the entries it points at.
  const chosen = sorted.filter((entry) => selected.has(entry.id));
  const all = sorted.length > 0 && chosen.length === sorted.length;
  const folders = entries.filter((entry) => entry.type === 'folder').length;
  const byId = new Map(entries.map((entry) => [entry.id, entry]));
  const selectable = onDelete !== undefined || onDownload !== undefined;

  // A new key starts in its natural order (names A to Z, newest and largest first); the same key flips.
  const sortBy = (key: FileSortKey) => {
    setSort((was) =>
      was.key === key ? { key, ascending: !was.ascending } : { key, ascending: key === 'name' },
    );
  };
  const selectAll = (checked: boolean) => {
    setSelected(checked ? new Set(sorted.map((e) => e.id)) : new Set());
  };

  const toggle = (id: string, on: boolean) => {
    setSelected((was) => {
      const next = new Set(was);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const rowActions = (entry: FileEntry): MenuAction[] => [
    ...(onOpen === undefined
      ? []
      : [
          {
            id: 'open',
            label: entry.type === 'folder' ? 'Open folder' : 'Open',
            icon: FolderOpenIcon,
            onSelect: () => {
              onOpen(entry);
            },
          },
        ]),
    ...(onRename === undefined
      ? []
      : [
          {
            id: 'rename',
            label: 'Rename',
            icon: PencilSimpleIcon,
            onSelect: () => {
              setRenaming(entry.id);
            },
          },
        ]),
    ...(onDownload === undefined
      ? []
      : [
          {
            id: 'download',
            label: 'Download',
            icon: DownloadSimpleIcon,
            onSelect: () => {
              onDownload([entry.id]);
            },
          },
        ]),
    ...(onDelete === undefined
      ? []
      : [
          {
            id: 'delete',
            label: 'Delete',
            icon: TrashIcon,
            danger: true,
            onSelect: () => {
              setDeleting([entry.id]);
            },
          },
        ]),
  ];

  const summary = [
    plural(entries.length, 'item'),
    folders > 0 ? plural(folders, 'folder') : null,
    fileEntriesSize(entries) > 0 ? formatBytes(fileEntriesSize(entries), locale) : null,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <BlockPanel
      title={title ?? current?.name ?? 'Files'}
      description={summary}
      actions={
        entries.length > 0 && (onUpload !== undefined || onCreateFolder !== undefined) ? (
          <>
            {onCreateFolder !== undefined && (
              <Button variant="secondary" onClick={onCreateFolder}>
                <FolderPlusIcon aria-hidden weight="bold" className="size-4" />
                New folder
              </Button>
            )}
            {onUpload !== undefined && (
              <Button onClick={onUpload}>
                <UploadSimpleIcon aria-hidden weight="bold" className="size-4" />
                Upload
              </Button>
            )}
          </>
        ) : undefined
      }
      className={className}
      bodyClassName="gap-4"
    >
      {path.length > 0 && (
        <nav aria-label="Folder path" className="min-w-0">
          <ol className="flex flex-wrap items-center gap-1 text-sm">
            {path.map((segment, index) => {
              const last = index === path.length - 1;
              return (
                <li key={segment.id} className="flex items-center gap-1">
                  {last || onNavigate === undefined ? (
                    <span
                      aria-current={last ? 'page' : undefined}
                      className={cn('px-1', last ? 'font-medium text-fg' : 'text-fg-muted')}
                    >
                      {segment.name}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        onNavigate(segment.id);
                      }}
                      className={cn(
                        'cursor-pointer rounded-badge px-1 text-fg-muted hover:text-fg hover:underline hover:underline-offset-4',
                        'pointer-coarse:py-2.5',
                        focusRing,
                      )}
                    >
                      {segment.name}
                    </button>
                  )}
                  {!last && (
                    <CaretRightIcon aria-hidden weight="bold" className="size-3 text-fg-subtle" />
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
      )}
      {storage !== undefined && storageNeedsAttention(storage) && (
        <UsageMeter
          label="Storage"
          value={storage.used}
          max={storage.total}
          valueText={`${formatBytes(storage.used, locale)} of ${formatBytes(storage.total, locale)}`}
          level={storageLevel(storage)}
          note={
            storageLevel(storage) === 'over'
              ? 'Storage is full. Delete files or upgrade to upload more.'
              : 'Storage is nearly full. Delete files you no longer need to keep uploading.'
          }
        />
      )}

      {entries.length === 0 ? (
        <EmptyNote
          title={
            <span className="flex flex-col items-center gap-3">
              <FolderOpenIcon aria-hidden weight="duotone" className="size-8 text-fg-subtle" />
              Nothing in {current?.name ?? 'this folder'} yet
            </span>
          }
        >
          {onUpload !== undefined || onCreateFolder !== undefined
            ? 'Upload files here, or make a folder to keep them in order.'
            : 'Files added here show with their size and last change.'}
          {(onUpload !== undefined || onCreateFolder !== undefined) && (
            <span className="mt-4 flex flex-wrap justify-center gap-2">
              {onCreateFolder !== undefined && (
                <Button variant="secondary" onClick={onCreateFolder}>
                  <FolderPlusIcon aria-hidden weight="bold" className="size-4" />
                  New folder
                </Button>
              )}
              {onUpload !== undefined && (
                <Button onClick={onUpload}>
                  <UploadSimpleIcon aria-hidden weight="bold" className="size-4" />
                  Upload
                </Button>
              )}
            </span>
          )}
        </EmptyNote>
      ) : (
        <>
          {/* One toolbar: on narrow widths it selects and sorts; on wide ones the header row
              does both, so the toolbar only appears to act on a selection. */}
          <div
            className={cn(
              'flex min-h-(--rx-control-height-md) flex-wrap items-center justify-between gap-3 rounded-control bg-surface-sunken px-3 py-1.5',
              chosen.length === 0 && '@xl:hidden',
            )}
          >
            {selectable ? (
              <label className="flex cursor-pointer items-center gap-3 text-sm">
                <span className="flex @xl:hidden">
                  <Checkbox
                    aria-label="Select everything in this folder"
                    checked={all}
                    indeterminate={chosen.length > 0 && !all}
                    onCheckedChange={selectAll}
                  />
                </span>
                {chosen.length === 0 ? (
                  <span className="text-fg-muted">Select all</span>
                ) : (
                  <span>
                    <span className="font-medium numeric">{chosen.length}</span> selected
                    {fileEntriesSize(chosen) > 0 && (
                      <span className="text-fg-muted">
                        , {formatBytes(fileEntriesSize(chosen), locale)}
                      </span>
                    )}
                  </span>
                )}
              </label>
            ) : (
              <span />
            )}
            <div className="flex flex-wrap items-center gap-2 pointer-coarse:gap-5">
              {chosen.length > 0 && onDownload !== undefined && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    onDownload(chosen.map((e) => e.id));
                  }}
                >
                  <DownloadSimpleIcon aria-hidden weight="bold" className="size-3.5" />
                  Download
                </Button>
              )}
              {chosen.length > 0 && onDelete !== undefined && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    setDeleting(chosen.map((e) => e.id));
                  }}
                >
                  <TrashIcon aria-hidden weight="bold" className="size-3.5" />
                  Delete {chosen.length}
                </Button>
              )}
              {chosen.length === 0 && (
                <ChoiceSelect
                  label="Sort"
                  value={sort.key}
                  onValueChange={(key) => {
                    setSort({ key, ascending: key === 'name' });
                  }}
                  choices={SORTS}
                  className="h-(--rx-control-height-sm) text-sm"
                />
              )}
            </div>
          </div>
          <p role="status" className="sr-only">
            {chosen.length === 0 ? '' : `${String(chosen.length)} selected`}
          </p>

          <Table>
            <TableCaption className="sr-only">
              {current?.name ?? 'Files'}, folders first, sorted by{' '}
              {SORTS.find((s) => s.value === sort.key)?.label.toLowerCase()}
            </TableCaption>
            <TableHeader className="hidden @xl:table-header-group">
              <TableRow>
                {selectable && (
                  <TableHead className="w-0 pe-0">
                    <span className="flex items-center">
                      <Checkbox
                        aria-label="Select everything in this folder"
                        checked={all}
                        indeterminate={chosen.length > 0 && !all}
                        onCheckedChange={selectAll}
                      />
                    </span>
                  </TableHead>
                )}
                <FileSortHead column="name" sort={sort} onSort={sortBy}>
                  Name
                </FileSortHead>
                <TableHead className={WIDE}>Owner</TableHead>
                <FileSortHead column="modified" sort={sort} onSort={sortBy}>
                  Modified
                </FileSortHead>
                <FileSortHead column="size" sort={sort} onSort={sortBy} align="end">
                  Size
                </FileSortHead>
                <TableHead className="w-0">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <Rows>
                {sorted.map((entry) => {
                  const kind = fileKindOf(entry);
                  const KindIcon = KIND_ICONS[kind];
                  const actions = rowActions(entry);
                  return (
                    <Row key={entry.id} data-selected={selected.has(entry.id) || undefined}>
                      {selectable && (
                        <TableCell className="w-0 pe-0">
                          <span className="flex items-center">
                            <Checkbox
                              aria-label={`Select ${entry.name}`}
                              checked={selected.has(entry.id)}
                              onCheckedChange={(checked) => {
                                toggle(entry.id, checked);
                              }}
                            />
                          </span>
                        </TableCell>
                      )}
                      <TableCell className="w-full max-w-0">
                        <span className="flex min-w-0 items-center gap-3">
                          <span
                            className={cn(
                              'inline-flex size-8 shrink-0 items-center justify-center rounded-control border',
                              kind === 'folder'
                                ? 'border-accent/30 bg-accent-subtle text-accent-strong'
                                : 'border-line bg-surface-sunken text-fg-muted',
                            )}
                          >
                            <KindIcon
                              aria-hidden
                              weight={kind === 'folder' ? 'fill' : 'regular'}
                              className="size-4"
                            />
                            <span className="sr-only">{KIND_WORDS[kind]}</span>
                          </span>
                          {renaming === entry.id && onRename !== undefined ? (
                            <RenameField
                              entry={entry}
                              siblings={entries}
                              onCancel={() => {
                                setRenaming(null);
                              }}
                              onSave={(name) => {
                                onRename(entry.id, name);
                                setRenaming(null);
                              }}
                            />
                          ) : (
                            <span className="flex min-w-0 flex-col">
                              {onOpen === undefined ? (
                                <span className="font-medium break-words @xl:truncate">
                                  {entry.name}
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    onOpen(entry);
                                  }}
                                  className={cn(
                                    'w-fit max-w-full cursor-pointer rounded-badge text-start font-medium break-words @xl:truncate',
                                    'hover:underline hover:decoration-line-strong hover:underline-offset-4',
                                    focusRing,
                                  )}
                                >
                                  {entry.name}
                                </button>
                              )}
                              {/* Narrow: what the hidden columns said, under the name. */}
                              <span className="text-sm text-fg-muted @xl:hidden">
                                {[
                                  entry.type === 'file'
                                    ? formatBytes(entry.size ?? 0, locale)
                                    : entry.itemCount === undefined
                                      ? null
                                      : plural(entry.itemCount, 'item'),
                                  relativeTime(entry.modified, now, locale),
                                ]
                                  .filter(Boolean)
                                  .join(', ')}
                              </span>
                            </span>
                          )}
                        </span>
                      </TableCell>
                      <TableCell className={cn(WIDE, 'whitespace-nowrap text-fg-muted')}>
                        {entry.owner ?? <span className="text-fg-subtle">No owner</span>}
                      </TableCell>
                      <TableCell className="hidden whitespace-nowrap @xl:table-cell">
                        <time
                          dateTime={entry.modified.toISOString()}
                          title={formatDateTime(entry.modified, locale)}
                          className="text-fg-muted"
                        >
                          {relativeTime(entry.modified, now, locale)}
                        </time>
                      </TableCell>
                      <TableCell
                        align="end"
                        className="hidden whitespace-nowrap text-fg-muted numeric @xl:table-cell"
                      >
                        {entry.type === 'folder'
                          ? entry.itemCount === undefined
                            ? ''
                            : plural(entry.itemCount, 'item')
                          : formatBytes(entry.size ?? 0, locale)}
                      </TableCell>
                      <TableCell className="w-0">
                        {actions.length > 0 && (
                          <ActionMenu label={`Actions for ${entry.name}`} actions={actions} />
                        )}
                      </TableCell>
                    </Row>
                  );
                })}
              </Rows>
            </TableBody>
          </Table>
          {storage !== undefined && !storageNeedsAttention(storage) && (
            <p className="flex items-center gap-2 text-sm text-fg-muted">
              <HardDrivesIcon aria-hidden weight="bold" className="size-4 text-fg-subtle" />
              <span>
                <span className="numeric">{formatBytes(storage.used, locale)}</span> of{' '}
                <span className="numeric">{formatBytes(storage.total, locale)}</span> storage used
              </span>
            </p>
          )}
        </>
      )}

      <DeleteEntriesDialog
        entries={deleting === null ? [] : deleting.flatMap((id) => byId.get(id) ?? [])}
        onCancel={() => {
          setDeleting(null);
        }}
        onConfirm={(ids) => {
          onDelete?.(ids);
          setSelected((was) => new Set([...was].filter((id) => !ids.includes(id))));
          setDeleting(null);
        }}
      />
    </BlockPanel>
  );
}

/** The name, editable in place: Enter saves, Escape cancels, an error says why it cannot be used. */
function RenameField({
  entry,
  siblings,
  onSave,
  onCancel,
}: {
  entry: FileEntry;
  siblings: readonly FileEntry[];
  onSave: (name: string) => void;
  onCancel: () => void;
}) {
  const { Button } = useBlockParts();
  const [name, setName] = useState(entry.name);
  const error = fileNameError(name, siblings, entry.id);
  const save = () => {
    if (error !== null) return;
    if (name.trim() === entry.name) onCancel();
    else onSave(name.trim());
  };
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      save();
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      onCancel();
    }
  };
  return (
    <div className="flex min-w-0 flex-1 items-start gap-2">
      <Field invalid={error !== null} className="min-w-0 flex-1">
        <FieldLabel className="sr-only">New name for {entry.name}</FieldLabel>
        <Input
          autoFocus
          value={name}
          onKeyDown={onKeyDown}
          onFocus={(event) => {
            // Select the name without its extension, the part people usually change.
            const dot = entry.type === 'file' ? event.target.value.lastIndexOf('.') : -1;
            event.target.setSelectionRange(0, dot > 0 ? dot : event.target.value.length);
          }}
          onChange={(event) => {
            setName(event.target.value);
          }}
          className="h-(--rx-control-height-sm) text-sm"
        />
        {error !== null && <FieldError>{error}</FieldError>}
      </Field>
      <Button size="sm" onClick={save}>
        Save
      </Button>
      <Button variant="ghost" size="sm" iconOnly aria-label="Cancel renaming" onClick={onCancel}>
        <XIcon aria-hidden weight="bold" className="size-3.5" />
      </Button>
    </div>
  );
}

function DeleteEntriesDialog({
  entries,
  onCancel,
  onConfirm,
}: {
  entries: FileEntry[];
  onCancel: () => void;
  onConfirm: (ids: string[]) => void;
}) {
  const { Button } = useBlockParts();
  // While the dialog closes it keeps naming what it was about.
  const [shown, setShown] = useState(entries);
  const key = entries.map((e) => e.id).join();
  if (entries.length > 0 && key !== shown.map((e) => e.id).join()) setShown(entries);
  const one = shown.length === 1 ? shown[0] : undefined;
  const folders = shown.filter((e) => e.type === 'folder').length;
  return (
    <Dialog
      open={entries.length > 0}
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {one === undefined ? `Delete ${plural(shown.length, 'item')}?` : `Delete ${one.name}?`}
          </DialogTitle>
          <DialogDescription>
            {folders > 0
              ? 'Folders are deleted with everything in them. This cannot be undone.'
              : 'This cannot be undone.'}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              onConfirm(shown.map((e) => e.id));
            }}
          >
            {one === undefined ? `Delete ${plural(shown.length, 'item')}` : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const SORT_WORDS = { true: 'ascending', false: 'descending' } as const;

/** A sortable column header: the title is a button, `aria-sort` says the current order. */
function FileSortHead({
  column,
  sort,
  onSort,
  align = 'start',
  children,
}: {
  column: FileSortKey;
  sort: { key: FileSortKey; ascending: boolean };
  onSort: (key: FileSortKey) => void;
  align?: 'start' | 'end';
  children: string;
}) {
  const active = sort.key === column;
  const SortIcon = !active ? ArrowsDownUpIcon : sort.ascending ? ArrowUpIcon : ArrowDownIcon;
  return (
    <TableHead
      align={align}
      aria-sort={active ? SORT_WORDS[String(sort.ascending) as 'true' | 'false'] : 'none'}
      className="p-0"
    >
      <button
        type="button"
        data-sorted={active || undefined}
        onClick={() => {
          onSort(column);
        }}
        className={cn(
          'group/sort inline-flex h-full w-full cursor-pointer items-center gap-1.5 px-(--rx-table-cell-padding-x)',
          'font-medium whitespace-nowrap text-fg-muted hover:text-fg data-sorted:text-fg',
          'transition-colors duration-fast ease-standard',
          '-outline-offset-2 focus-visible:outline-2 focus-visible:outline-focus',
          align === 'end' && 'flex-row-reverse',
        )}
      >
        <span>{children}</span>
        <SortIcon
          aria-hidden
          weight="bold"
          className={cn(
            'size-3 shrink-0',
            !active && 'text-fg-disabled group-hover/sort:text-fg-subtle',
          )}
        />
      </button>
    </TableHead>
  );
}
