import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Tree, type TreeNode } from './tree';

const ACCOUNTS: TreeNode[] = [
  {
    id: 'assets',
    label: 'Assets',
    children: [
      {
        id: 'bank',
        label: 'Bank accounts',
        children: [
          { id: 'operating', label: 'Operating account' },
          { id: 'payroll', label: 'Payroll account' },
        ],
      },
      { id: 'receivables', label: 'Receivables' },
    ],
  },
  {
    id: 'liabilities',
    label: 'Liabilities',
    children: [{ id: 'payables', label: 'Payables' }],
  },
  { id: 'equity', label: 'Equity', disabled: true },
];

const item = (name: string) => screen.getByRole('treeitem', { name });
const names = () => screen.getAllByRole('treeitem').map((row) => row.textContent);

describe('Tree', () => {
  it('is a named tree with levels, positions and open states', () => {
    render(<Tree aria-label="Chart of accounts" items={ACCOUNTS} defaultExpanded={['assets']} />);
    expect(screen.getByRole('tree', { name: 'Chart of accounts' })).toBeInTheDocument();
    expect(names()).toEqual(['Assets', 'Bank accounts', 'Receivables', 'Liabilities', 'Equity']);
    expect(item('Assets')).toHaveAttribute('aria-expanded', 'true');
    expect(item('Bank accounts')).toHaveAttribute('aria-expanded', 'false');
    expect(item('Receivables')).not.toHaveAttribute('aria-expanded');
    expect(item('Bank accounts')).toHaveAttribute('aria-level', '2');
    expect(item('Receivables')).toHaveAttribute('aria-posinset', '2');
    expect(item('Receivables')).toHaveAttribute('aria-setsize', '2');
    // One Tab stop: the first row.
    expect(item('Assets')).toHaveAttribute('tabindex', '0');
    expect(item('Liabilities')).toHaveAttribute('tabindex', '-1');
  });

  it('follows the tree keys: down, right opens then steps in, left steps out then closes', async () => {
    const onExpandedChange = vi.fn();
    render(<Tree aria-label="Accounts" items={ACCOUNTS} onExpandedChange={onExpandedChange} />);
    item('Assets').focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(onExpandedChange).toHaveBeenLastCalledWith(['assets']);
    expect(item('Assets')).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    expect(item('Bank accounts')).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}');
    expect(item('Receivables')).toHaveFocus();
    await userEvent.keyboard('{ArrowLeft}');
    expect(item('Assets')).toHaveFocus();
    await userEvent.keyboard('{ArrowLeft}');
    expect(item('Assets')).toHaveAttribute('aria-expanded', 'false');
    await userEvent.keyboard('{End}');
    expect(item('Equity')).toHaveFocus();
    await userEvent.keyboard('{Home}');
    expect(item('Assets')).toHaveFocus();
  });

  it('swaps left and right in a right to left page', async () => {
    render(
      <div dir="rtl" style={{ direction: 'rtl' }}>
        <Tree aria-label="Accounts" items={ACCOUNTS} />
      </div>,
    );
    item('Assets').focus();
    await userEvent.keyboard('{ArrowLeft}');
    expect(item('Assets')).toHaveAttribute('aria-expanded', 'true');
    await userEvent.keyboard('{ArrowRight}');
    expect(item('Assets')).toHaveAttribute('aria-expanded', 'false');
  });

  it('opens every sibling with * and jumps by typing', async () => {
    render(<Tree aria-label="Accounts" items={ACCOUNTS} />);
    item('Assets').focus();
    await userEvent.keyboard('*');
    expect(item('Assets')).toHaveAttribute('aria-expanded', 'true');
    expect(item('Liabilities')).toHaveAttribute('aria-expanded', 'true');
    await userEvent.keyboard('pa');
    expect(item('Payables')).toHaveFocus();
  });

  it('selects one row with a press or Enter and reports it', async () => {
    const onSelectedChange = vi.fn();
    const onAction = vi.fn();
    render(
      <Tree
        aria-label="Accounts"
        items={ACCOUNTS}
        defaultExpanded={['liabilities']}
        onSelectedChange={onSelectedChange}
        onAction={onAction}
      />,
    );
    await userEvent.click(item('Liabilities'));
    expect(onSelectedChange).toHaveBeenLastCalledWith(['liabilities']);
    expect(item('Liabilities')).toHaveAttribute('aria-selected', 'true');
    await userEvent.keyboard('{ArrowDown}{Enter}');
    expect(onSelectedChange).toHaveBeenLastCalledWith(['payables']);
    expect(onAction).toHaveBeenLastCalledWith(expect.objectContaining({ id: 'payables' }));
    expect(item('Liabilities')).toHaveAttribute('aria-selected', 'false');
  });

  it('never selects a disabled row', async () => {
    const onSelectedChange = vi.fn();
    render(<Tree aria-label="Accounts" items={ACCOUNTS} onSelectedChange={onSelectedChange} />);
    await userEvent.click(item('Equity'));
    expect(onSelectedChange).not.toHaveBeenCalled();
    expect(item('Equity')).toHaveAttribute('aria-disabled', 'true');
  });

  it('toggles and extends a multiple selection', async () => {
    const onSelectedChange = vi.fn();
    render(
      <Tree
        aria-label="Accounts"
        items={ACCOUNTS}
        selectionMode="multiple"
        onSelectedChange={onSelectedChange}
      />,
    );
    expect(screen.getByRole('tree')).toHaveAttribute('aria-multiselectable', 'true');
    item('Assets').focus();
    await userEvent.keyboard(' ');
    await userEvent.keyboard('{Shift>}{ArrowDown}{/Shift}');
    expect(onSelectedChange).toHaveBeenLastCalledWith(['assets', 'liabilities']);
    await userEvent.keyboard(' ');
    expect(onSelectedChange).toHaveBeenLastCalledWith(['assets']);
  });

  it('opens and closes on a press when nothing is selectable', async () => {
    render(<Tree aria-label="Accounts" items={ACCOUNTS} selectionMode="none" />);
    await userEvent.click(item('Assets'));
    expect(item('Assets')).toHaveAttribute('aria-expanded', 'true');
    expect(item('Assets')).not.toHaveAttribute('aria-selected');
  });

  it('opens with the chevron without selecting', async () => {
    const onSelectedChange = vi.fn();
    render(<Tree aria-label="Accounts" items={ACCOUNTS} onSelectedChange={onSelectedChange} />);
    const chevron = item('Assets').querySelector('[data-part="chevron"]');
    if (!(chevron instanceof HTMLElement)) throw new Error('no chevron');
    await userEvent.click(chevron);
    expect(item('Assets')).toHaveAttribute('aria-expanded', 'true');
    expect(onSelectedChange).not.toHaveBeenCalled();
  });

  it('loads children when a branch first opens, busy while it loads', async () => {
    let finish: (nodes: TreeNode[]) => void = () => undefined;
    const loadChildren = vi.fn(
      () =>
        new Promise<TreeNode[]>((done) => {
          finish = done;
        }),
    );
    render(
      <Tree
        aria-label="Folders"
        items={[{ id: 'contracts', label: 'Contracts', hasChildren: true }]}
        loadChildren={loadChildren}
      />,
    );
    item('Contracts').focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(loadChildren).toHaveBeenCalledTimes(1);
    expect(item('Contracts')).toHaveAttribute('aria-busy', 'true');
    act(() => {
      finish([{ id: 'nda', label: 'NDA 2026.pdf' }]);
    });
    await waitFor(() => {
      expect(item('NDA 2026.pdf')).toHaveAttribute('aria-level', '2');
    });
    expect(item('Contracts')).not.toHaveAttribute('aria-busy');
    // Closing and opening again uses the loaded children.
    await userEvent.keyboard('{ArrowLeft}{ArrowRight}');
    expect(loadChildren).toHaveBeenCalledTimes(1);
  });

  it('shows a failed load as a row that tries again with Enter', async () => {
    const loadChildren = vi
      .fn<(node: TreeNode) => Promise<TreeNode[]>>()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce([{ id: 'q1', label: 'Q1 statements' }]);
    render(
      <Tree
        aria-label="Folders"
        items={[{ id: 'statements', label: 'Statements', hasChildren: true }]}
        defaultExpanded={['statements']}
        loadChildren={loadChildren}
      />,
    );
    const error = await screen.findByRole('treeitem', { name: /Could not load/ });
    error.focus();
    await userEvent.keyboard('{Enter}');
    expect(await screen.findByRole('treeitem', { name: 'Q1 statements' })).toBeInTheDocument();
    expect(loadChildren).toHaveBeenCalledTimes(2);
  });
});
