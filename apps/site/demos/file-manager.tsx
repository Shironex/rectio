'use client';

import { type FileEntry, FileManager, type FileManagerProps } from '@rectio/blocks';
import { useState } from 'react';

export const NOW = new Date(2026, 2, 19, 14, 20);
const ago = (minutes: number) => new Date(NOW.getTime() - minutes * 60_000);

const MB = 1_000_000;

const ENTRIES: FileEntry[] = [
  {
    id: 'f1',
    name: 'Receipts',
    type: 'folder',
    modified: ago(90),
    owner: 'Ines Duarte',
    itemCount: 142,
  },
  {
    id: 'f2',
    name: 'Contracts',
    type: 'folder',
    modified: ago(60 * 24 * 6),
    owner: 'Niamh Walsh',
    itemCount: 18,
  },
  {
    id: 'f3',
    name: 'Q1 board pack.pdf',
    type: 'file',
    size: 4.2 * MB,
    modified: ago(35),
    owner: 'Niamh Walsh',
  },
  {
    id: 'f4',
    name: 'Cash forecast Q2.xlsx',
    type: 'file',
    size: 812_000,
    modified: ago(60 * 5),
    owner: 'Callum Ross',
  },
  {
    id: 'f5',
    name: 'Cash forecast Q10 draft.xlsx',
    type: 'file',
    size: 96_000,
    modified: ago(60 * 24 * 40),
    owner: 'Callum Ross',
  },
  {
    id: 'f6',
    name: 'Supplier terms.docx',
    type: 'file',
    size: 230_000,
    modified: ago(60 * 24 * 2),
    owner: 'Ines Duarte',
  },
  {
    id: 'f7',
    name: 'Office lease scan.png',
    type: 'file',
    size: 2.6 * MB,
    modified: ago(60 * 24 * 12),
    owner: 'Kenji Arakawa',
  },
  {
    id: 'f8',
    name: 'Ledger export 2025.zip',
    type: 'file',
    size: 38 * MB,
    modified: ago(60 * 24 * 70),
  },
];

/** The demo's props: the app owns the data, here in state, in your app through your API. */
export function useFileManagerDemo() {
  const [entries, setEntries] = useState(ENTRIES);
  const props: FileManagerProps = {
    path: [
      { id: 'root', name: 'Fernhill' },
      { id: 'finance', name: 'Finance' },
      { id: 'q1', name: 'Q1 2026' },
    ],
    entries,
    storage: { used: 8_400 * MB, total: 10_000 * MB },
    now: NOW,
    locale: 'en-GB',
    onOpen: () => undefined,
    onNavigate: () => undefined,
    onUpload: () => undefined,
    onCreateFolder: () => {
      setEntries([
        ...entries,
        {
          id: `n${String(entries.length + 1)}`,
          name: 'New folder',
          type: 'folder',
          modified: NOW,
          owner: 'Niamh Walsh',
          itemCount: 0,
        },
      ]);
    },
    onRename: (id, name) => {
      setEntries(entries.map((e) => (e.id === id ? { ...e, name, modified: NOW } : e)));
    },
    onDownload: () => undefined,
    onDelete: (ids) => {
      setEntries(entries.filter((e) => !ids.includes(e.id)));
    },
  };
  return props;
}

export default function FileManagerDemo() {
  const props = useFileManagerDemo();
  return (
    <div className="w-full">
      <FileManager {...props} />
    </div>
  );
}
