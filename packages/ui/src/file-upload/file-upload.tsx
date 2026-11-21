'use client';

import { Field as BaseField } from '@base-ui/react/field';
import { Progress } from '@base-ui/react/progress';
import {
  CheckCircleIcon,
  ClockIcon,
  DownloadSimpleIcon,
  FileCsvIcon,
  FileDocIcon,
  FileIcon,
  FileImageIcon,
  FilePdfIcon,
  FileTextIcon,
  FileXlsIcon,
  FileZipIcon,
  PaperclipIcon,
  UploadSimpleIcon,
  WarningCircleIcon,
  XIcon,
} from '@phosphor-icons/react';
import {
  createContext,
  use,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ComponentProps,
  type DragEvent,
  type MouseEvent,
  type ReactNode,
  type Ref,
  type RefObject,
} from 'react';

import { Button, type ButtonProps } from '../button/button';
import { controlFocus } from '../field/control-styles';
import { cn } from '../lib/cn';
import {
  defaultFileUploadMessages,
  fileExtension,
  formatFileSize,
  validateFiles,
  type FileRejection,
  type FileUploadEntry,
  type FileUploadMessages,
  type FileUploadStatus,
} from './file-validation';

type WithClassName<P> = Omit<P, 'className'> & { className?: string };

interface FileUploadContextValue {
  openPicker: () => void;
  /** The dropzone or trigger, where focus goes when the last row is removed. */
  registerTrigger: (node: HTMLElement | null) => void;
  triggerRef: RefObject<HTMLElement | null>;
  disabled: boolean;
  locale: string | undefined;
  messages: FileUploadMessages;
  addFiles: (files: readonly File[]) => void;
  announce: (text: string) => void;
  onRemove: ((file: FileUploadEntry) => void) | undefined;
  onRetry: ((file: FileUploadEntry) => void) | undefined;
}

const FileUploadContext = createContext<FileUploadContextValue | null>(null);

function useFileUploadContext(part: string): FileUploadContextValue {
  const context = use(FileUploadContext);
  if (context === null) throw new Error(`${part} must be inside <FileUpload>.`);
  return context;
}

export interface FileUploadProps extends Omit<ComponentProps<'div'>, 'className' | 'onChange'> {
  className?: string;
  /** The native `accept` string, such as `.pdf,.png,.jpg`. Checked on drop as well as in the picker. */
  accept?: string;
  /** Words for the accepted types in rejection messages; derived from `accept` when omitted. */
  acceptLabel?: string;
  /** Largest file, in bytes. */
  maxSize?: number;
  /** Most files in the list, counting `files`. */
  maxFiles?: number;
  /** False takes one file at a time, for an avatar or a single attachment. */
  multiple?: boolean;
  disabled?: boolean;
  /** The current entries: counted against `maxFiles`, and watched to announce finished uploads. */
  files?: readonly FileUploadEntry[];
  /** Files that passed every rule, in the order given. The app adds them to its list. */
  onFilesAdded?: (files: File[]) => void;
  /** Files turned away, each with a sentence naming the rule. They are announced as well. */
  onRejected?: (rejections: FileRejection[]) => void;
  /** The user pressed a row's remove button. Abort its upload and drop it from the list. */
  onRemove?: (file: FileUploadEntry) => void;
  /** The user pressed Retry on a failed row. */
  onRetry?: (file: FileUploadEntry) => void;
  /** BCP 47 locale for sizes and percentages. */
  locale?: string;
  /** Rewords or translates any sentence the component says. */
  messages?: Partial<FileUploadMessages>;
}

/** Remembers each row's status so a change to done or error can be announced once. */
function useStatusAnnouncements(
  files: readonly FileUploadEntry[] | undefined,
  messages: FileUploadMessages,
  announce: (text: string) => void,
) {
  const seen = useRef(new Map<string, FileUploadStatus>());
  useEffect(() => {
    if (files === undefined) return;
    const said: string[] = [];
    const next = new Map<string, FileUploadStatus>();
    for (const entry of files) {
      const before = seen.current.get(entry.id);
      next.set(entry.id, entry.status);
      if (before === undefined || before === entry.status) continue;
      if (entry.status === 'done') said.push(messages.uploaded(entry.name));
      if (entry.status === 'error')
        said.push(messages.failed(entry.name, entry.error ?? messages.errorFallback));
    }
    seen.current = next;
    if (said.length > 0) announce(said.join(' '));
  }, [files, messages, announce]);
}

/**
 * Holds the rules and the callbacks for a file upload, and the hidden native input behind it. It
 * sends nothing: accepted files go to `onFilesAdded`, and the app passes entries with their status
 * and progress back to `FileList`. Added, rejected, finished and failed files are announced
 * politely. Use `useFileUpload` for the state when the app has none of its own.
 */
export function FileUpload({
  className,
  accept,
  acceptLabel,
  maxSize,
  maxFiles,
  multiple = true,
  disabled = false,
  files,
  onFilesAdded,
  onRejected,
  onRemove,
  onRetry,
  locale,
  messages: messageOverrides,
  children,
  ...props
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const messages = useMemo(
    () => ({ ...defaultFileUploadMessages, ...messageOverrides }),
    [messageOverrides],
  );
  useStatusAnnouncements(files, messages, setAnnouncement);

  const context = useMemo<FileUploadContextValue>(
    () => ({
      openPicker: () => {
        inputRef.current?.click();
      },
      registerTrigger: (node) => {
        triggerRef.current = node;
      },
      triggerRef,
      disabled,
      locale,
      messages,
      announce: setAnnouncement,
      onRemove,
      onRetry,
      addFiles: (incoming) => {
        if (incoming.length === 0) return;
        const { accepted, rejected } = validateFiles(incoming, {
          accept,
          acceptLabel,
          maxSize,
          maxFiles,
          multiple,
          existing: files?.length ?? 0,
          locale,
          messages,
        });
        const said: string[] = [];
        if (accepted.length > 0) {
          said.push(messages.added(accepted.map((file) => file.name)));
          onFilesAdded?.(accepted);
        }
        if (rejected.length > 0) {
          said.push(...rejected.map((rejection) => rejection.message));
          onRejected?.(rejected);
        }
        setAnnouncement(said.join(' '));
      },
    }),
    [
      accept,
      acceptLabel,
      disabled,
      files,
      locale,
      maxFiles,
      maxSize,
      messages,
      multiple,
      onFilesAdded,
      onRejected,
      onRemove,
      onRetry,
    ],
  );

  return (
    <FileUploadContext value={context}>
      <div data-slot="file-upload" className={cn('flex flex-col gap-3', className)} {...props}>
        {children}
        <input
          ref={inputRef}
          type="file"
          hidden
          tabIndex={-1}
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          data-slot="file-upload-input"
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            const picked = [...(event.currentTarget.files ?? [])];
            // Cleared, so picking the same file again after removing it fires a change.
            event.currentTarget.value = '';
            context.addFiles(picked);
          }}
        />
        <p role="status" aria-live="polite" className="sr-only">
          {announcement}
        </p>
      </div>
    </FileUploadContext>
  );
}

const hasFiles = (event: DragEvent<HTMLElement>) => event.dataTransfer.types.includes('Files');

const isDisabled = (element: HTMLElement) =>
  element.hasAttribute('disabled') || element.hasAttribute('data-disabled');

/**
 * Drag and drop for a trigger. A counter, not a flag: dragenter and dragleave fire for every child
 * the pointer crosses, and only the last leave means the files left the target.
 */
function useDropTarget(context: FileUploadContextValue) {
  const [dragging, setDragging] = useState(false);
  const depth = useRef(0);
  const reset = () => {
    depth.current = 0;
    setDragging(false);
  };
  return {
    dragging,
    handlers: {
      onDragEnter: (event: DragEvent<HTMLElement>) => {
        if (!hasFiles(event) || context.disabled || isDisabled(event.currentTarget)) return;
        event.preventDefault();
        depth.current += 1;
        setDragging(true);
      },
      onDragOver: (event: DragEvent<HTMLElement>) => {
        if (!hasFiles(event)) return;
        // Always claimed, so a file dropped on a disabled target does not open in the tab.
        event.preventDefault();
        const blocked = context.disabled || isDisabled(event.currentTarget);
        event.dataTransfer.dropEffect = blocked ? 'none' : 'copy';
      },
      onDragLeave: () => {
        depth.current = Math.max(0, depth.current - 1);
        if (depth.current === 0) setDragging(false);
      },
      onDrop: (event: DragEvent<HTMLElement>) => {
        if (!hasFiles(event)) return;
        event.preventDefault();
        reset();
        if (context.disabled || isDisabled(event.currentTarget)) return;
        context.addFiles([...event.dataTransfer.files]);
      },
    },
  };
}

type ControlProps = ComponentProps<typeof BaseField.Control>;

/** Props shared by the dropzone and the compact trigger, as the native button takes them. */
type TriggerButtonProps = Omit<
  ComponentProps<'button'>,
  'className' | 'type' | 'value' | 'defaultValue' | 'onChange' | 'children'
>;

export interface FileDropzoneProps extends TriggerButtonProps {
  className?: string;
  /** Replaces the default icon and text. Receives whether files are held over the zone. */
  children?: ReactNode | ((state: { dragging: boolean }) => ReactNode);
}

/**
 * The drop area. It is a real button: Enter, Space or a click opens the native picker, and files
 * dropped on it run through the same rules. A FieldLabel names it and the FieldDescription (state
 * the accepted types and the limit there) and FieldError are linked to it. While files are held
 * over it, the border turns solid and the icon and text change, so the state never rests on
 * colour.
 */
export function FileDropzone({ className, children, onClick, ref, ...props }: FileDropzoneProps) {
  const context = useFileUploadContext('FileDropzone');
  const { dragging, handlers } = useDropTarget(context);
  const { messages } = context;
  const Icon = dragging ? DownloadSimpleIcon : UploadSimpleIcon;
  const content =
    typeof children === 'function'
      ? children({ dragging })
      : (children ?? (
          <>
            <span
              data-part="dropzone-icon"
              className={cn(
                'flex size-10 items-center justify-center rounded-full',
                'bg-surface-sunken text-fg-muted transition-colors duration-fast ease-standard',
                'group-data-dragging:bg-accent group-data-dragging:text-accent-contrast',
                'group-data-disabled:text-fg-disabled',
              )}
            >
              <Icon aria-hidden weight="bold" className="size-5" />
            </span>
            <span className="text-sm font-medium">
              {dragging ? messages.dropActive : messages.dropIdle}
            </span>
          </>
        ));

  return (
    <BaseField.Control
      {...(props as ControlProps)}
      {...handlers}
      ref={(node: HTMLButtonElement | null) => {
        context.registerTrigger(node);
        assignRef(ref, node);
      }}
      disabled={context.disabled || props.disabled === true}
      data-slot="file-dropzone"
      data-dragging={dragging || undefined}
      onClick={(event: MouseEvent<HTMLInputElement>) => {
        onClick?.(event as unknown as MouseEvent<HTMLButtonElement>);
        if (!event.defaultPrevented) context.openPicker();
      }}
      render={<button type="button" />}
      className={cn(
        'group relative flex w-full cursor-pointer flex-col items-center justify-center gap-2 px-6 py-6 text-center',
        'rounded-panel border border-dashed border-line-strong bg-(--rx-field-background) text-fg',
        'transition-[background-color,border-color] duration-fast ease-standard',
        'hover:not-data-disabled:border-fg-subtle hover:not-data-disabled:bg-surface-hover',
        controlFocus,
        'data-dragging:border-solid data-dragging:border-accent data-dragging:bg-accent-subtle',
        'data-invalid:border-negative data-invalid:ring-1 data-invalid:ring-negative data-invalid:ring-inset',
        'data-disabled:cursor-not-allowed data-disabled:border-line data-disabled:bg-surface-sunken data-disabled:text-fg-disabled',
        className,
      )}
    >
      {content}
    </BaseField.Control>
  );
}

export interface FileUploadTriggerProps extends Omit<
  ButtonProps,
  'type' | 'value' | 'defaultValue' | 'onChange' | 'loading' | 'renderContent'
> {
  /** Defaults to a paperclip and "Attach file". */
  children?: ReactNode;
}

/**
 * The compact variant: a button-sized trigger for a single avatar or attachment, with the same
 * picker, rules and Field wiring as the dropzone. Files dropped on it are taken too.
 */
export function FileUploadTrigger({
  className,
  children,
  onClick,
  variant = 'secondary',
  disabled,
  ref,
  ...props
}: FileUploadTriggerProps) {
  const context = useFileUploadContext('FileUploadTrigger');
  const { dragging, handlers } = useDropTarget(context);
  const Icon = dragging ? DownloadSimpleIcon : PaperclipIcon;
  return (
    <BaseField.Control
      {...(props as unknown as ControlProps)}
      {...handlers}
      ref={(node: HTMLButtonElement | null) => {
        context.registerTrigger(node);
        assignRef(ref, node);
      }}
      disabled={context.disabled || disabled === true}
      data-slot="file-upload-trigger"
      data-dragging={dragging || undefined}
      onClick={(event: MouseEvent<HTMLInputElement>) => {
        onClick?.(event as never);
        if (!event.defaultPrevented) context.openPicker();
      }}
      render={
        <Button
          variant={variant}
          className={cn(
            'w-fit self-start',
            'data-dragging:border data-dragging:border-solid data-dragging:border-accent data-dragging:bg-accent-subtle',
            'data-invalid:border-negative data-invalid:ring-1 data-invalid:ring-negative data-invalid:ring-inset',
            className,
          )}
        />
      }
    >
      {children ?? (
        <>
          <Icon aria-hidden weight="bold" className="size-4" />
          {dragging ? context.messages.dropActive : context.messages.attach}
        </>
      )}
    </BaseField.Control>
  );
}

export type FileListProps = WithClassName<ComponentProps<'ul'>>;

/** The rows. Give it an `aria-label` such as "Attached receipts" when the page has several. */
export function FileList({ className, ...props }: FileListProps) {
  return (
    // An explicit role: some screen readers drop list semantics once list-style is removed.
    <ul
      role="list"
      data-slot="file-list"
      className={cn('flex flex-col gap-2', className)}
      {...props}
    />
  );
}

/** The kind of document a file is, for its icon; the extension decides when the MIME type is missing. */
function kindOf(entry: Pick<FileUploadEntry, 'name' | 'type'>) {
  const type = entry.type ?? '';
  const ext = fileExtension(entry.name);
  if (type === 'application/pdf' || ext === 'pdf') return 'pdf';
  if (type.startsWith('image/')) return 'image';
  if (type === 'text/csv' || ext === 'csv') return 'csv';
  if (type.includes('sheet') || type.includes('excel') || ext === 'xls' || ext === 'xlsx')
    return 'sheet';
  if (type.includes('word') || ext === 'doc' || ext === 'docx') return 'doc';
  if (type.includes('zip') || type.includes('compressed') || ext === 'zip') return 'zip';
  if (type.startsWith('text/')) return 'text';
  return 'file';
}

const FILE_ICONS = {
  pdf: FilePdfIcon,
  image: FileImageIcon,
  csv: FileCsvIcon,
  sheet: FileXlsIcon,
  doc: FileDocIcon,
  zip: FileZipIcon,
  text: FileTextIcon,
  file: FileIcon,
} as const;

function FileTypeIcon({ file }: { file: Pick<FileUploadEntry, 'name' | 'type'> }) {
  const Icon = FILE_ICONS[kindOf(file)];
  return <Icon aria-hidden weight="regular" className="size-4.5" />;
}

/** Hands a node to a ref the caller passed, whatever its shape. */
function assignRef<T>(ref: Ref<T> | undefined, value: T | null) {
  if (typeof ref === 'function') ref(value);
  else if (ref !== null && ref !== undefined) ref.current = value;
}

export interface FileProgressProps extends Omit<
  ComponentProps<typeof Progress.Root>,
  'className' | 'value' | 'children'
> {
  className?: string;
  /** 0 to 100; null for a transfer whose size is unknown. */
  value: number | null;
}

/**
 * A thin progress bar on Base UI's Progress: `role="progressbar"` with `aria-valuenow`. The fill
 * grows by `scaleX`, never by width, so each step is a compositor-only change. Name it with
 * `aria-label`.
 */
export function FileProgress({ className, value, ...props }: FileProgressProps) {
  const fraction = value === null ? 0 : Math.min(100, Math.max(0, value)) / 100;
  return (
    <Progress.Root
      data-slot="file-progress"
      value={value === null ? null : fraction * 100}
      className={cn('flex w-full items-center', className)}
      {...props}
    >
      <Progress.Track className="relative h-1 w-full overflow-hidden rounded-full bg-line">
        <span
          data-part="fill"
          className={cn(
            'absolute inset-0 bg-accent ltr:origin-left rtl:origin-right',
            'transition-transform duration-base ease-standard',
          )}
          style={{ transform: `scaleX(${String(fraction)})` }}
        />
      </Progress.Track>
    </Progress.Root>
  );
}

export interface FileItemProps extends Omit<ComponentProps<'li'>, 'className' | 'children'> {
  className?: string;
  file: FileUploadEntry;
  /** Overrides the root's `onRemove` for this row. */
  onRemove?: (file: FileUploadEntry) => void;
  /** Overrides the root's `onRetry` for this row. */
  onRetry?: (file: FileUploadEntry) => void;
}

/** Where focus goes when a row's remove button disappears: the next row, the previous, the trigger. */
function focusAfterRemoval(row: HTMLElement | null, trigger: HTMLElement | null) {
  const usable = (element: Element | null): element is HTMLElement =>
    element instanceof HTMLElement && !element.inert;
  let next: Element | null = row?.nextElementSibling ?? null;
  while (next !== null && !usable(next)) next = next.nextElementSibling;
  let previous: Element | null = row?.previousElementSibling ?? null;
  while (previous !== null && !usable(previous)) previous = previous.previousElementSibling;
  const target =
    (next ?? previous)?.querySelector<HTMLElement>('[data-part="remove"]') ?? trigger ?? null;
  target?.focus();
}

/**
 * One file: its type icon, name, size and state in words. Uploading shows a progress bar and the
 * percentage; done shows a check; error shows the message and Retry. The remove button is named
 * after the file ("Remove invoice.pdf"), and focus moves to the next row when it is pressed.
 */
export function FileItem({
  className,
  file,
  onRemove: removeOverride,
  onRetry: retryOverride,
  ...props
}: FileItemProps) {
  const context = use(FileUploadContext);
  const messages = context?.messages ?? defaultFileUploadMessages;
  const locale = context?.locale;
  const onRemove = removeOverride ?? context?.onRemove;
  const onRetry = retryOverride ?? context?.onRetry;
  const percent = Math.round(Math.min(100, Math.max(0, file.progress ?? 0)));
  const percentText = new Intl.NumberFormat(locale, { style: 'percent' }).format(percent / 100);

  let status: ReactNode;
  if (file.status === 'queued') {
    status = (
      <span className="flex items-center gap-1">
        <ClockIcon aria-hidden weight="bold" className="size-3.5 shrink-0" />
        {messages.queued}
      </span>
    );
  } else if (file.status === 'uploading') {
    status = (
      <span className="flex min-w-0 flex-1 items-center gap-2">
        <FileProgress
          value={percent}
          locale={locale}
          aria-label={`${messages.uploading} ${file.name}`}
          className="max-w-40 flex-1"
        />
        <span>{percentText}</span>
      </span>
    );
  } else if (file.status === 'done') {
    status = (
      <span className="flex items-center gap-1 text-positive-strong">
        <CheckCircleIcon
          data-part="status-icon"
          aria-hidden
          weight="fill"
          className="size-3.5 shrink-0"
        />
        {messages.done}
      </span>
    );
  } else {
    status = (
      <span className="flex items-start gap-1 text-negative-strong">
        <WarningCircleIcon aria-hidden weight="bold" className="mt-0.5 size-3.5 shrink-0" />
        <span>{file.error ?? messages.errorFallback}</span>
      </span>
    );
  }

  return (
    <li
      data-slot="file-item"
      data-status={file.status}
      className={cn(
        'flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-(--rx-field-radius) border border-line bg-surface px-3 py-2.5',
        'data-[status=error]:border-negative',
        className,
      )}
      {...props}
    >
      <span
        aria-hidden
        className="flex size-8 shrink-0 items-center justify-center rounded-(--rx-badge-radius) bg-surface-sunken text-fg-muted"
      >
        <FileTypeIcon file={file} />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-sm font-medium text-fg" title={file.name}>
          {file.name}
        </span>
        <div className="flex items-start gap-1.5 text-sm text-fg-subtle numeric">
          <span className="shrink-0">{formatFileSize(file.size, locale)}</span>
          {file.status !== 'error' && (
            <>
              <span aria-hidden className="shrink-0">
                ·
              </span>
              {status}
            </>
          )}
        </div>
      </div>
      {(onRetry !== undefined && file.status === 'error') || onRemove !== undefined ? (
        <div className="flex shrink-0 items-center gap-1 pointer-coarse:gap-5">
          {onRetry !== undefined && file.status === 'error' && (
            <Button
              size="sm"
              variant="secondary"
              data-part="retry"
              // The visible word starts the name, so voice control users can say "Retry".
              aria-label={`${messages.retry} ${file.name}`}
              onClick={() => {
                onRetry(file);
              }}
            >
              {messages.retry}
            </Button>
          )}
          {onRemove !== undefined && (
            <Button
              size="sm"
              variant="ghost"
              iconOnly
              data-part="remove"
              aria-label={messages.remove(file.name)}
              onClick={(event) => {
                focusAfterRemoval(
                  event.currentTarget.closest('li'),
                  context?.triggerRef.current ?? null,
                );
                onRemove(file);
                context?.announce(messages.removed(file.name));
              }}
            >
              <XIcon aria-hidden weight="bold" className="size-3.5" />
            </Button>
          )}
        </div>
      ) : null}
      {/* A failure gets its own line under the row, so the message never squeezes beside Retry. */}
      {file.status === 'error' && <div className="basis-full ps-11 text-sm">{status}</div>}
    </li>
  );
}

export {
  defaultFileUploadMessages,
  describeAccept,
  formatFileSize,
  matchesAccept,
  validateFiles,
  type FileRejection,
  type FileRejectionCode,
  type FileRules,
  type FileUploadEntry,
  type FileUploadMessages,
  type FileUploadStatus,
} from './file-validation';
export { useFileUpload, type FileUploadTask, type UseFileUploadOptions } from './use-file-upload';
