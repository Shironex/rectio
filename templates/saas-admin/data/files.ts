import type { FileEntry, FilePathSegment, StorageUsage } from '@rectio/blocks';

import { at, minutesAgo } from './workspace';

export const ROOT: FilePathSegment = { id: 'root', name: 'Files' };

/** A folder and what it holds. Files are the help desk's shared library: macros, images, exports. */
export interface Folder {
  segment: FilePathSegment;
  parentId: string | null;
  entries: FileEntry[];
}

const MB = 1_000_000;

export const FOLDERS: Readonly<Record<string, Folder>> = {
  root: {
    segment: ROOT,
    parentId: null,
    entries: [
      {
        id: 'macros',
        name: 'Reply macros',
        type: 'folder',
        modified: minutesAgo(60 * 5),
        owner: 'Sana Qureshi',
        itemCount: 4,
      },
      {
        id: 'help-images',
        name: 'Help center images',
        type: 'folder',
        modified: minutesAgo(60 * 28),
        owner: 'Hannah Becker',
        itemCount: 3,
      },
      {
        id: 'exports',
        name: 'Exports',
        type: 'folder',
        modified: at(11, 16, 8, 0),
        owner: 'Yuki Tanaka',
        itemCount: 3,
      },
      {
        id: 'contracts',
        name: 'Customer contracts',
        type: 'folder',
        modified: at(10, 30, 15, 12),
        owner: 'Inês Carvalho',
        itemCount: 0,
      },
      {
        id: 'f-handbook',
        name: 'Support handbook 2026.pdf',
        type: 'file',
        size: 3.8 * MB,
        modified: at(11, 3, 11, 20),
        owner: 'Inês Carvalho',
      },
      {
        id: 'f-escalation',
        name: 'Escalation matrix.xlsx',
        type: 'file',
        size: 0.21 * MB,
        modified: at(11, 12, 16, 45),
        owner: 'Tomás Rivera',
      },
      {
        id: 'f-holidays',
        name: 'Holiday cover rota.csv',
        type: 'file',
        size: 0.018 * MB,
        modified: minutesAgo(60 * 3),
        owner: 'Kwame Asante',
      },
      {
        id: 'f-tone',
        name: 'Tone of voice guide.docx',
        type: 'file',
        size: 1.2 * MB,
        modified: at(9, 22, 10, 0),
        owner: 'Sana Qureshi',
      },
    ],
  },
  macros: {
    segment: { id: 'macros', name: 'Reply macros' },
    parentId: 'root',
    entries: [
      {
        id: 'm-refund',
        name: 'Refund approved.md',
        type: 'file',
        size: 4_200,
        modified: minutesAgo(60 * 5),
        owner: 'Tomás Rivera',
      },
      {
        id: 'm-outage',
        name: 'Payments outage update.md',
        type: 'file',
        size: 6_100,
        modified: at(11, 10, 13, 2),
        owner: 'Inês Carvalho',
      },
      {
        id: 'm-2fa',
        name: 'Reset two-factor.md',
        type: 'file',
        size: 3_300,
        modified: at(10, 2, 9, 40),
        owner: 'Sana Qureshi',
      },
      {
        id: 'm-import',
        name: 'CSV import checklist.md',
        type: 'file',
        size: 5_800,
        modified: at(11, 18, 17, 5),
        owner: 'Kwame Asante',
      },
    ],
  },
  'help-images': {
    segment: { id: 'help-images', name: 'Help center images' },
    parentId: 'root',
    entries: [
      {
        id: 'h-dispatch',
        name: 'dispatch-board.png',
        type: 'file',
        size: 1.4 * MB,
        modified: minutesAgo(60 * 28),
        owner: 'Hannah Becker',
      },
      {
        id: 'h-booking',
        name: 'booking-page-holidays.png',
        type: 'file',
        size: 0.86 * MB,
        modified: at(11, 14, 12, 0),
        owner: 'Hannah Becker',
      },
      {
        id: 'h-offline',
        name: 'mobile-offline-mode.gif',
        type: 'file',
        size: 6.2 * MB,
        modified: at(10, 21, 15, 30),
        owner: 'Leo Marchetti',
      },
    ],
  },
  exports: {
    segment: { id: 'exports', name: 'Exports' },
    parentId: 'root',
    entries: [
      {
        id: 'e-oct',
        name: 'Tickets October 2026.csv',
        type: 'file',
        size: 2.9 * MB,
        modified: at(11, 1, 6, 0),
        owner: 'Yuki Tanaka',
      },
      {
        id: 'e-csat',
        name: 'Satisfaction Q3 2026.csv',
        type: 'file',
        size: 0.64 * MB,
        modified: at(10, 2, 6, 0),
        owner: 'Yuki Tanaka',
      },
      {
        id: 'e-sla',
        name: 'Targets missed, week 46.csv',
        type: 'file',
        size: 0.09 * MB,
        modified: at(11, 16, 8, 0),
        owner: 'Yuki Tanaka',
      },
    ],
  },
  contracts: {
    segment: { id: 'contracts', name: 'Customer contracts' },
    parentId: 'root',
    entries: [],
  },
};

export const STORAGE: StorageUsage = { used: 18.4 * 1_000 * MB, total: 50 * 1_000 * MB };

/** The path from the root to a folder, root first. */
export function folderPath(id: string): FilePathSegment[] {
  const path: FilePathSegment[] = [];
  let folder = FOLDERS[id];
  while (folder !== undefined) {
    path.unshift(folder.segment);
    folder = folder.parentId === null ? undefined : FOLDERS[folder.parentId];
  }
  return path.length === 0 ? [ROOT] : path;
}
