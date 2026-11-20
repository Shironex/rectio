'use client';

import type { FileEntry } from '@rectio/blocks';
import { FileManager } from '@rectio/blocks/motion';
import { useToast } from '@rectio/ui';
import { useState } from 'react';

import { FOLDERS, STORAGE, folderPath } from '@/data/files';
import { LOCALE, NOW, plural } from '@/data/workspace';
import { PageHeader } from '../page-header';
import { ErrorPanel, LoadingPanel, LoadingRegion } from '../states/state-views';
import { usePageState } from '../use-page-state';

/** The shared library: reply macros, help center images, exports and contracts. */
export function FilesPage() {
  const state = usePageState();
  const toast = useToast();
  const [folderId, setFolderId] = useState('root');
  const [folders, setFolders] = useState(() =>
    Object.fromEntries(Object.entries(FOLDERS).map(([id, f]) => [id, f.entries])),
  );
  const entries = state === 'empty' ? [] : (folders[folderId] ?? []);

  const update = (change: (list: FileEntry[]) => FileEntry[]) => {
    setFolders((all) => ({ ...all, [folderId]: change(all[folderId] ?? []) }));
  };

  return (
    <>
      <PageHeader
        title="Files"
        description="Macros, help center images and exports the whole team can use"
      />
      {state === 'loading' ? (
        <LoadingRegion label="Loading files">
          <LoadingPanel kind="table" rows={8} columns={4} toolbar />
        </LoadingRegion>
      ) : state === 'error' ? (
        <ErrorPanel title="Files did not load" />
      ) : (
        <FileManager
          path={folderPath(folderId)}
          entries={entries}
          storage={STORAGE}
          now={NOW}
          locale={LOCALE}
          onOpen={(entry) => {
            if (entry.type === 'folder') setFolderId(entry.id);
            else toast.add({ title: `Opening ${entry.name}` });
          }}
          onNavigate={setFolderId}
          onUpload={() => {
            toast.add({ title: 'Choose files to upload', description: 'Up to 25 MB each.' });
          }}
          onDropFiles={(files) => {
            update((list) => [
              ...files.map((file, i) => ({
                id: `up-${String(Date.now())}-${String(i)}`,
                name: file.name,
                type: 'file' as const,
                size: file.size,
                modified: new Date(),
                owner: 'Inês Carvalho',
              })),
              ...list,
            ]);
            toast.add({ type: 'success', title: `${plural(files.length, 'file')} uploaded` });
          }}
          onCreateFolder={() => {
            update((list) => [
              {
                id: `folder-${String(Date.now())}`,
                name: 'Untitled folder',
                type: 'folder',
                modified: new Date(),
                owner: 'Inês Carvalho',
                itemCount: 0,
              },
              ...list,
            ]);
          }}
          onRename={(id, name) => {
            update((list) => list.map((e) => (e.id === id ? { ...e, name } : e)));
          }}
          onDownload={(ids) => {
            toast.add({ title: `Downloading ${plural(ids.length, 'item')}` });
          }}
          onDelete={(ids) => {
            update((list) => list.filter((e) => !ids.includes(e.id)));
            toast.add({ title: `${plural(ids.length, 'item')} deleted` });
          }}
          onUpgrade={() => {
            toast.add({ title: 'Storage add-ons are on the billing page' });
          }}
        />
      )}
    </>
  );
}
