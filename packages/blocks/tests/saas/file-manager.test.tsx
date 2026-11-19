import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import {
  FileManager,
  fileEntriesSize,
  fileKindOf,
  fileNameError,
  sortFileEntries,
  storageLevel,
  type FileEntry,
} from '../../src/index';

const NOW = new Date(2026, 2, 19, 14, 20);
const at = (minutes: number) => new Date(NOW.getTime() - minutes * 60_000);
const ENTRIES: FileEntry[] = [
  { id: 'a', name: 'Report Q10.pdf', type: 'file', size: 300, modified: at(10) },
  { id: 'b', name: 'Report Q2.pdf', type: 'file', size: 900, modified: at(60) },
  { id: 'c', name: 'Archive', type: 'folder', modified: at(5) },
  { id: 'd', name: 'notes', type: 'file', size: 100, modified: at(1) },
];
const PATH = [
  { id: 'root', name: 'Home' },
  { id: 'q1', name: 'Q1' },
];

describe('file manager logic', () => {
  it('sorts folders first, names as people read them, dates and sizes largest first', () => {
    expect(sortFileEntries(ENTRIES, 'name').map((e) => e.id)).toEqual(['c', 'd', 'b', 'a']);
    expect(sortFileEntries(ENTRIES, 'size').map((e) => e.id)).toEqual(['c', 'b', 'a', 'd']);
    expect(sortFileEntries(ENTRIES, 'modified').map((e) => e.id)).toEqual(['c', 'd', 'a', 'b']);
  });

  it('knows kinds, sizes, names and storage levels', () => {
    expect(fileKindOf({ name: 'x.XLSX', type: 'file' })).toBe('spreadsheet');
    expect(fileKindOf({ name: '.env', type: 'file' })).toBe('other');
    expect(fileKindOf({ name: 'a.pdf', type: 'folder' })).toBe('folder');
    expect(fileEntriesSize(ENTRIES)).toBe(1300);
    expect(fileNameError(' ', ENTRIES)).toBe('Give it a name.');
    expect(fileNameError('a/b', ENTRIES)).toMatch(/cannot contain/);
    expect(fileNameError('archive', ENTRIES)).toMatch(/already in this folder/);
    expect(fileNameError('Archive', ENTRIES, 'c')).toBeNull();
    expect(storageLevel({ used: 5, total: 10 })).toBe('ok');
    expect(storageLevel({ used: 8, total: 10 })).toBe('warning');
    expect(storageLevel({ used: 10, total: 10 })).toBe('over');
  });
});

describe('FileManager', () => {
  it('shows the path and navigates up it', async () => {
    const onNavigate = vi.fn();
    render(<FileManager path={PATH} entries={ENTRIES} now={NOW} onNavigate={onNavigate} />);
    const nav = screen.getByRole('navigation', { name: 'Folder path' });
    expect(within(nav).getByText('Q1')).toHaveAttribute('aria-current', 'page');
    await userEvent.click(within(nav).getByRole('button', { name: 'Home' }));
    expect(onNavigate).toHaveBeenCalledWith('root');
  });

  it('renames in place and refuses a taken name', async () => {
    const onRename = vi.fn();
    render(<FileManager path={PATH} entries={ENTRIES} now={NOW} onRename={onRename} />);
    await userEvent.click(screen.getByRole('button', { name: 'Actions for notes' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Rename' }));
    const field = screen.getByLabelText('New name for notes');
    await userEvent.clear(field);
    await userEvent.type(field, 'Archive');
    expect(screen.getByText(/already in this folder/)).toBeInTheDocument();
    await userEvent.clear(field);
    await userEvent.type(field, 'Minutes{Enter}');
    expect(onRename).toHaveBeenCalledWith('d', 'Minutes');
  });

  it('selects several and deletes them after confirming', async () => {
    const onDelete = vi.fn();
    render(<FileManager path={PATH} entries={ENTRIES} now={NOW} onDelete={onDelete} />);
    await userEvent.click(screen.getByRole('checkbox', { name: 'Select notes' }));
    await userEvent.click(screen.getByRole('checkbox', { name: 'Select Archive' }));
    expect(screen.getByText('selected', { exact: false })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Delete 2' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(/Folders are deleted with everything/)).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Delete 2 items' }));
    expect(onDelete).toHaveBeenCalledWith(['c', 'd']);
  });

  it('shows an empty folder', () => {
    render(<FileManager path={PATH} entries={[]} now={NOW} onUpload={vi.fn()} />);
    expect(screen.getByText('This folder is empty')).toBeInTheDocument();
  });
});
