/**
 * The pure half of FileUpload: what a file entry looks like, how sizes and types read in words,
 * and which dropped or picked files pass the accept, size and count rules. No React here, so an
 * app can run the same checks on the server or in a form library.
 */

/** Where one file is in its upload. The app owns the transfer and moves the entry along. */
export type FileUploadStatus = 'queued' | 'uploading' | 'done' | 'error';

/** One file as the list shows it. The component never reads `file`; the app's upload code does. */
export interface FileUploadEntry {
  /** Stable key for the row, unique within the list. */
  id: string;
  name: string;
  /** Bytes. */
  size: number;
  /** MIME type, such as `application/pdf`. Picks the icon; the extension is the fallback. */
  type?: string | undefined;
  status: FileUploadStatus;
  /** 0 to 100 while uploading. */
  progress?: number | undefined;
  /** Why the upload failed, in words the user can act on. Shown with `status: 'error'`. */
  error?: string | undefined;
  /** The picked file, kept for the app's upload and retry. */
  file?: File | undefined;
}

/** Why a file was turned away before it reached the list. */
export type FileRejectionCode = 'type' | 'size' | 'count';

export interface FileRejection {
  file: File;
  code: FileRejectionCode;
  /** A sentence naming the file and the rule, ready to show or announce. */
  message: string;
}

/** Every sentence FileUpload says, for apps that translate or reword them. */
export interface FileUploadMessages {
  /** Announced after files join the list. */
  added: (names: readonly string[]) => string;
  /** Announced after a row is removed. */
  removed: (name: string) => string;
  /** Announced when an upload finishes. */
  uploaded: (name: string) => string;
  /** Announced when an upload fails. */
  failed: (name: string, error: string) => string;
  notAccepted: (name: string, types: string) => string;
  tooLarge: (name: string, size: string, limit: string) => string;
  tooMany: (name: string, max: number) => string;
  /** A single-file upload was given several. */
  oneAtATime: (name: string) => string;
  /** The dropzone's text at rest. */
  dropIdle: string;
  /** The dropzone's text while files are held over it. */
  dropActive: string;
  /** The compact trigger's default label. */
  attach: string;
  queued: string;
  uploading: string;
  done: string;
  /** Shown when an entry has `status: 'error'` and no `error` text. */
  errorFallback: string;
  retry: string;
  remove: (name: string) => string;
}

export const defaultFileUploadMessages: FileUploadMessages = {
  added: (names) =>
    names.length === 1 ? `${names[0] ?? ''} added.` : `${String(names.length)} files added.`,
  removed: (name) => `${name} removed.`,
  uploaded: (name) => `${name} uploaded.`,
  failed: (name, error) => `${name} failed to upload. ${error}`,
  notAccepted: (name, types) => `${name} is not an accepted type (${types}).`,
  tooLarge: (name, size, limit) => `${name} is ${size}; the limit is ${limit}.`,
  tooMany: (name, max) =>
    `${name} was not added; the limit is ${String(max)} ${max === 1 ? 'file' : 'files'}.`,
  oneAtATime: (name) => `${name} was not added; choose one file at a time.`,
  dropIdle: 'Drop files here or click to choose',
  dropActive: 'Release to add the files',
  attach: 'Attach file',
  queued: 'Waiting',
  uploading: 'Uploading',
  done: 'Uploaded',
  errorFallback: 'Upload failed',
  retry: 'Retry',
  remove: (name) => `Remove ${name}`,
};

const UNITS = ['byte', 'kilobyte', 'megabyte', 'gigabyte', 'terabyte'] as const;

/**
 * A byte count in words, with Intl: `12.4 MB`, `512 bytes`, `12,4 MB` where the locale writes a decimal comma. Steps of 1024,
 * the way limits are usually written in code (`10 * 1024 * 1024` reads as `10 MB`), with at most
 * one decimal.
 */
export function formatFileSize(bytes: number, locale?: string): string {
  let value = Math.max(0, bytes);
  let unit = 0;
  while (value >= 1024 && unit < UNITS.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return new Intl.NumberFormat(locale, {
    style: 'unit',
    unit: UNITS[unit],
    unitDisplay: unit === 0 ? 'long' : 'short',
    maximumFractionDigits: unit === 0 ? 0 : 1,
  }).format(value);
}

/** Readable names for common MIME types, where the subtype alone would read oddly. */
const MIME_LABELS: Record<string, string> = {
  'application/pdf': 'PDF',
  'image/jpeg': 'JPG',
  'image/svg+xml': 'SVG',
  'text/plain': 'TXT',
  'application/msword': 'DOC',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
  'application/vnd.ms-excel': 'XLS',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
};

const EXTENSION_LABELS: Record<string, string> = { jpeg: 'JPG' };

const WILDCARD_LABELS: Record<string, string> = {
  image: 'images',
  video: 'videos',
  audio: 'audio',
  text: 'text files',
};

function parseAccept(accept: string | undefined): string[] {
  if (accept === undefined) return [];
  return accept
    .split(',')
    .map((part) => part.trim().toLowerCase())
    .filter((part) => part !== '');
}

/**
 * The accept list in words for messages: `.pdf,image/png,.jpg,.jpeg` reads `PDF, PNG, JPG`.
 * Unknown types fall back to their extension or subtype in capitals.
 */
export function describeAccept(accept: string | undefined): string {
  const labels = parseAccept(accept).map((part) => {
    if (part.startsWith('.')) {
      const ext = part.slice(1);
      return EXTENSION_LABELS[ext] ?? ext.toUpperCase();
    }
    const known = MIME_LABELS[part];
    if (known !== undefined) return known;
    const [kind = '', subtype = ''] = part.split('/');
    if (subtype === '*') return WILDCARD_LABELS[kind] ?? `${kind} files`;
    return subtype.replace(/^x-/, '').toUpperCase();
  });
  return [...new Set(labels)].join(', ');
}

/** The lower-cased extension of a file name, without the dot; empty when there is none. */
export function fileExtension(name: string): string {
  const dot = name.lastIndexOf('.');
  return dot <= 0 ? '' : name.slice(dot + 1).toLowerCase();
}

/** True when the file matches one entry of an `accept` string: extension, exact or wildcard MIME. */
export function matchesAccept(file: Pick<File, 'name' | 'type'>, accept: string | undefined) {
  const rules = parseAccept(accept);
  if (rules.length === 0) return true;
  const ext = fileExtension(file.name);
  const type = file.type.toLowerCase();
  return rules.some((rule) => {
    if (rule.startsWith('.')) return ext !== '' && rule.slice(1) === ext;
    if (rule.endsWith('/*')) return type.startsWith(rule.slice(0, -1));
    return type === rule;
  });
}

export interface FileRules {
  /** The native `accept` string: extensions and MIME types, comma separated. */
  accept?: string | undefined;
  /** Overrides the words for the accepted types in messages, such as `PDF or image`. */
  acceptLabel?: string | undefined;
  /** Largest file, in bytes. */
  maxSize?: number | undefined;
  /** Most files in the list, counting `existing`. Ignored when `multiple` is false. */
  maxFiles?: number | undefined;
  /** False takes one file at a time; the app replaces the previous one. */
  multiple?: boolean | undefined;
  /** Files already in the list, counted against `maxFiles`. */
  existing?: number | undefined;
  locale?: string | undefined;
  messages?: FileUploadMessages | undefined;
}

/**
 * Splits incoming files into accepted and rejected, in the order given. Each rejected file carries
 * one reason, the first rule it breaks: type, then size, then count.
 */
export function validateFiles(
  incoming: readonly File[],
  rules: FileRules = {},
): { accepted: File[]; rejected: FileRejection[] } {
  const messages = rules.messages ?? defaultFileUploadMessages;
  const multiple = rules.multiple ?? true;
  const types = rules.acceptLabel ?? describeAccept(rules.accept);
  const room = multiple ? (rules.maxFiles ?? Number.POSITIVE_INFINITY) - (rules.existing ?? 0) : 1;
  const accepted: File[] = [];
  const rejected: FileRejection[] = [];

  for (const file of incoming) {
    if (!matchesAccept(file, rules.accept)) {
      rejected.push({ file, code: 'type', message: messages.notAccepted(file.name, types) });
    } else if (rules.maxSize !== undefined && file.size > rules.maxSize) {
      rejected.push({
        file,
        code: 'size',
        message: messages.tooLarge(
          file.name,
          formatFileSize(file.size, rules.locale),
          formatFileSize(rules.maxSize, rules.locale),
        ),
      });
    } else if (accepted.length >= room) {
      rejected.push({
        file,
        code: 'count',
        message: multiple
          ? messages.tooMany(file.name, rules.maxFiles ?? 0)
          : messages.oneAtATime(file.name),
      });
    } else {
      accepted.push(file);
    }
  }
  return { accepted, rejected };
}
