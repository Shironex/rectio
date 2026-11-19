import { resolveLocale } from '../../lib/finance';
import { collator } from '../lib/saas';

export interface FileEntry {
  id: string;
  name: string;
  type: 'folder' | 'file';
  /** Bytes, for files. */
  size?: number;
  modified: Date;
  owner?: string;
  /** How many items a folder holds, when known. */
  itemCount?: number;
}

/** One folder on the way from the root to the folder shown, root first. */
export interface FilePathSegment {
  id: string;
  name: string;
}

export interface StorageUsage {
  /** Bytes used. */
  used: number;
  /** Bytes allowed on the plan. */
  total: number;
}

export type FileKind =
  | 'folder'
  | 'document'
  | 'spreadsheet'
  | 'presentation'
  | 'pdf'
  | 'image'
  | 'video'
  | 'audio'
  | 'archive'
  | 'code'
  | 'other';

const EXTENSIONS: Record<string, FileKind> = {
  doc: 'document',
  docx: 'document',
  txt: 'document',
  md: 'document',
  rtf: 'document',
  odt: 'document',
  xls: 'spreadsheet',
  xlsx: 'spreadsheet',
  csv: 'spreadsheet',
  ods: 'spreadsheet',
  ppt: 'presentation',
  pptx: 'presentation',
  key: 'presentation',
  odp: 'presentation',
  pdf: 'pdf',
  png: 'image',
  jpg: 'image',
  jpeg: 'image',
  gif: 'image',
  webp: 'image',
  svg: 'image',
  heic: 'image',
  mp4: 'video',
  mov: 'video',
  webm: 'video',
  mp3: 'audio',
  wav: 'audio',
  m4a: 'audio',
  zip: 'archive',
  gz: 'archive',
  tar: 'archive',
  '7z': 'archive',
  rar: 'archive',
  json: 'code',
  ts: 'code',
  tsx: 'code',
  js: 'code',
  html: 'code',
  css: 'code',
  sql: 'code',
  xml: 'code',
};

/** What a file is, by its extension; folders are folders. */
export function fileKindOf(entry: Pick<FileEntry, 'name' | 'type'>): FileKind {
  if (entry.type === 'folder') return 'folder';
  const dot = entry.name.lastIndexOf('.');
  if (dot <= 0) return 'other';
  return EXTENSIONS[entry.name.slice(dot + 1).toLowerCase()] ?? 'other';
}

export type FileSortKey = 'name' | 'modified' | 'size';

/**
 * Folders first, always; then by the key. Names compare as people read them, so "Q2" comes before
 * "Q10"; dates and sizes put the newest and largest first unless `ascending`.
 */
export function sortFileEntries(
  entries: readonly FileEntry[],
  key: FileSortKey,
  ascending = key === 'name',
  locale?: string,
): FileEntry[] {
  const names = collator(resolveLocale(locale), { numeric: true, sensitivity: 'base' });
  const value = (entry: FileEntry): number =>
    key === 'modified' ? entry.modified.getTime() : (entry.size ?? 0);
  return [...entries].sort((a, b) => {
    if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
    const by = key === 'name' ? names.compare(a.name, b.name) : value(a) - value(b);
    // Ties fall back to the name, so the order never shuffles between renders.
    return (ascending ? by : -by) || names.compare(a.name, b.name);
  });
}

/** The bytes the files among `entries` take; folders count nothing. */
export function fileEntriesSize(entries: readonly FileEntry[]): number {
  return entries.reduce((sum, entry) => sum + (entry.type === 'file' ? (entry.size ?? 0) : 0), 0);
}

/** Why a name cannot be used in this folder, or null when it can. */
export function fileNameError(
  name: string,
  siblings: readonly FileEntry[],
  selfId?: string,
): string | null {
  const trimmed = name.trim();
  if (trimmed === '') return 'Give it a name.';
  if (/[/\\]/.test(trimmed)) return 'A name cannot contain / or \\.';
  if (trimmed === '.' || trimmed === '..') return 'Choose another name.';
  if (trimmed.length > 255) return 'Keep the name under 255 characters.';
  const taken = siblings.some(
    (entry) => entry.id !== selfId && entry.name.toLowerCase() === trimmed.toLowerCase(),
  );
  return taken ? `Something called ${trimmed} is already in this folder.` : null;
}

/** How full the storage is: ok, warning from 80 percent, over at 100. */
export function storageLevel(usage: StorageUsage): 'ok' | 'warning' | 'over' {
  if (usage.total <= 0) return 'over';
  const share = usage.used / usage.total;
  if (share >= 1) return 'over';
  if (share >= 0.8) return 'warning';
  return 'ok';
}

/** Whether storage is full enough to show up front: from 90 percent. Below that it is a footnote. */
export function storageNeedsAttention(usage: StorageUsage): boolean {
  return usage.total <= 0 || usage.used / usage.total >= 0.9;
}
