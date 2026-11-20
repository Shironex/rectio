import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import {
  FileManager,
  fileEntriesSize,
  fileKindOf,
  fileNameError,
  filePage,
  sortFileEntries,
  storageLevel,
  storageNeedsAttention,
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
    expect(storageNeedsAttention({ used: 8.9, total: 10 })).toBe(false);
    expect(storageNeedsAttention({ used: 9, total: 10 })).toBe(true);
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

  it('offers an upgrade under the meter and starts with the given selection', async () => {
    const onUpgrade = vi.fn();
    render(
      <FileManager
        path={PATH}
        entries={ENTRIES}
        now={NOW}
        storage={{ used: 8.4e9, total: 1e10 }}
        onUpgrade={onUpgrade}
        onDelete={vi.fn()}
        defaultSelectedIds={['d']}
      />,
    );
    expect(screen.getByText('1.6 GB left')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Upgrade' }));
    expect(onUpgrade).toHaveBeenCalledOnce();
    expect(screen.getByRole('checkbox', { name: 'Select notes' })).toBeChecked();
  });

  it('returns focus to the row menu when a rename is cancelled', async () => {
    render(<FileManager path={PATH} entries={ENTRIES} now={NOW} onRename={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Actions for notes' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Rename' }));
    await userEvent.keyboard('{Escape}');
    expect(screen.getByRole('button', { name: 'Actions for notes' })).toHaveFocus();
  });

  it('selects several and deletes them after confirming', async () => {
    const onDelete = vi.fn();
    render(<FileManager path={PATH} entries={ENTRIES} now={NOW} onDelete={onDelete} />);
    await userEvent.click(screen.getByRole('checkbox', { name: 'Select notes' }));
    await userEvent.click(screen.getByRole('checkbox', { name: 'Select Archive' }));
    expect(screen.getByRole('status')).toHaveTextContent('2 selected');
    await userEvent.click(screen.getByRole('button', { name: 'Delete 2' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(/Folders are deleted with everything/)).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Delete 2 items' }));
    expect(onDelete).toHaveBeenCalledWith(['c', 'd']);
  });

  it('sorts from the column headers and flips on a second click', async () => {
    render(<FileManager path={PATH} entries={ENTRIES} now={NOW} />);
    const names = () =>
      screen
        .getAllByRole('row')
        .slice(1)
        .map((row) => row.textContent);
    const size = screen.getByRole('button', { name: 'Size' });
    await userEvent.click(size);
    expect(size.closest('th')).toHaveAttribute('aria-sort', 'descending');
    expect(names()[1]).toMatch(/Report Q2\.pdf/);
    await userEvent.click(size);
    expect(size.closest('th')).toHaveAttribute('aria-sort', 'ascending');
    expect(names()[1]).toMatch(/notes/);
  });

  it('shows a thin storage meter that warns near the limit', () => {
    const { rerender } = render(
      <FileManager path={PATH} entries={ENTRIES} now={NOW} storage={{ used: 5e9, total: 1e10 }} />,
    );
    expect(screen.getByRole('meter')).toBeInTheDocument();
    expect(screen.queryByText(/Nearly full/)).not.toBeInTheDocument();
    expect(screen.getByText('5 GB left')).toBeInTheDocument();
    rerender(
      <FileManager
        path={PATH}
        entries={ENTRIES}
        now={NOW}
        storage={{ used: 9.5e9, total: 1e10 }}
      />,
    );
    expect(screen.getByText(/Nearly full/)).toBeInTheDocument();
  });

  it('takes files dropped on an empty folder', () => {
    const onDropFiles = vi.fn();
    render(<FileManager path={PATH} entries={[]} now={NOW} onDropFiles={onDropFiles} />);
    const file = new File(['x'], 'a.txt');
    const title = screen.getByText('Drag files here or upload');
    fireEvent.drop(title, { dataTransfer: { files: [file], types: ['Files'] } });
    expect(onDropFiles).toHaveBeenCalledWith([file]);
  });

  it('shows an empty folder', () => {
    render(<FileManager path={PATH} entries={[]} now={NOW} onUpload={vi.fn()} />);
    expect(screen.getByText('Nothing in Q1 yet')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Upload' })).toBeInTheDocument();
  });
});

describe('FileManager paging', () => {
  const MANY: FileEntry[] = Array.from({ length: 23 }, (_, index) => ({
    id: `f${String(index)}`,
    name: `File ${String(index + 1).padStart(2, '0')}.txt`,
    type: 'file' as const,
    size: 10,
    modified: at(index),
  }));
  const rowNames = () =>
    screen
      .getAllByRole('button', { name: /^Actions for / })
      .map((button) => button.getAttribute('aria-label'));

  it('knows which rows a page shows', () => {
    expect(filePage(23, 10, 1)).toEqual({ page: 1, pageCount: 3, first: 1, last: 10 });
    expect(filePage(23, 10, 3)).toEqual({ page: 3, pageCount: 3, first: 21, last: 23 });
    expect(filePage(23, 10, 9).page).toBe(3);
    expect(filePage(0, 10, 1)).toEqual({ page: 1, pageCount: 1, first: 0, last: 0 });
    expect(filePage(23, Infinity, 2)).toEqual({ page: 1, pageCount: 1, first: 1, last: 23 });
  });

  it('pages a long folder and says which rows are shown', async () => {
    const onPageChange = vi.fn();
    render(
      <FileManager
        path={PATH}
        entries={MANY}
        now={NOW}
        onDelete={vi.fn()}
        pageSize={10}
        onPageChange={onPageChange}
      />,
    );
    expect(rowNames()).toHaveLength(10);
    expect(screen.getByText(/1 to 10 of 23 items/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Page 3' }));
    expect(onPageChange).toHaveBeenCalledWith(3);
    expect(rowNames()).toEqual([
      'Actions for File 21.txt',
      'Actions for File 22.txt',
      'Actions for File 23.txt',
    ]);
  });

  it('shows the whole folder when paging is turned off', () => {
    render(
      <FileManager path={PATH} entries={MANY} now={NOW} onDelete={vi.fn()} pageSize={Infinity} />,
    );
    expect(rowNames()).toHaveLength(23);
    expect(screen.queryByRole('navigation', { name: 'Pages of this folder' })).toBeNull();
  });

  it('takes one page from your server with the total', () => {
    render(
      <FileManager
        path={PATH}
        entries={MANY.slice(0, 5)}
        now={NOW}
        onDelete={vi.fn()}
        pageSize={5}
        page={2}
        totalEntries={23}
      />,
    );
    expect(rowNames()).toHaveLength(5);
    expect(screen.getByText(/6 to 10 of 23 items/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Page 2' })).toHaveAttribute('aria-current', 'page');
  });
});
