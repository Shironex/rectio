import { FileManager as PlainFileManager, type FileEntry } from '@rectio/blocks';
import { FileManager as MotionFileManager } from '@rectio/blocks/motion';
import { useState } from 'react';

import { NOW, ago, type DemoProps } from './demo';

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
    owner: 'Tomasz Wierzbicki',
  },
  {
    id: 'f5',
    name: 'Cash forecast Q10 draft.xlsx',
    type: 'file',
    size: 96_000,
    modified: ago(60 * 24 * 40),
    owner: 'Tomasz Wierzbicki',
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

export function FileManagerDemo({ motion, empty, locale }: DemoProps) {
  const FileManager = motion ? MotionFileManager : PlainFileManager;
  const [entries, setEntries] = useState(empty ? [] : ENTRIES);
  return (
    <FileManager
      path={[
        { id: 'root', name: 'Fernhill' },
        { id: 'finance', name: 'Finance' },
        { id: 'q1', name: 'Q1 2026' },
      ]}
      entries={entries}
      storage={{ used: 8_400 * MB, total: 10_000 * MB }}
      now={NOW}
      locale={locale}
      onOpen={() => undefined}
      onNavigate={() => undefined}
      onUpload={() => undefined}
      onDropFiles={(files) => {
        setEntries([
          ...entries,
          ...files.map((file, index) => ({
            id: `d${String(entries.length + index + 1)}`,
            name: file.name,
            type: 'file' as const,
            size: file.size,
            modified: NOW,
            owner: 'Niamh Walsh',
          })),
        ]);
      }}
      onCreateFolder={() => {
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
      }}
      onRename={(id, name) => {
        setEntries(entries.map((e) => (e.id === id ? { ...e, name, modified: NOW } : e)));
      }}
      onDownload={() => undefined}
      onUpgrade={() => undefined}
      defaultSelectedIds={['f3']}
      onDelete={(ids) => {
        setEntries(entries.filter((e) => !ids.includes(e.id)));
      }}
    />
  );
}
