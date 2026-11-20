import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { CommandMenu, CommandMenuTrigger, filterCommands, type CommandGroup } from './command-menu';
import { fuzzyMatch, fuzzyScore } from './fuzzy';

function groups(onSelect: (id: string) => void): CommandGroup[] {
  const item = (id: string, label: string, keywords?: string[]) => ({
    id,
    label,
    ...(keywords === undefined ? {} : { keywords }),
    onSelect: () => {
      onSelect(id);
    },
  });
  return [
    {
      label: 'Go to',
      items: [
        item('overview', 'Overview'),
        item('invoices', 'Invoices', ['receivables', 'AR']),
        item('payables', 'Payables', ['bills']),
      ],
    },
    {
      label: 'Actions',
      items: [item('new-invoice', 'New invoice'), item('export', 'Export ledger')],
    },
  ];
}

describe('fuzzy matching', () => {
  it('finds characters in order, not necessarily together', () => {
    expect(fuzzyMatch('nwinv', 'New invoice')).not.toBeNull();
    expect(fuzzyMatch('xyz', 'New invoice')).toBeNull();
  });

  it('ignores case and accents and returns matched positions', () => {
    expect(fuzzyMatch('ZAL', 'Zaliczka')?.indices).toEqual([0, 1, 2]);
    expect(fuzzyMatch('zoltan', 'Zóltan')).not.toBeNull();
  });

  it('ranks word starts and runs above scattered hits', () => {
    const start = fuzzyMatch('inv', 'Invoices')?.score ?? 0;
    const inside = fuzzyMatch('inv', 'Reinvest')?.score ?? 0;
    const scattered = fuzzyMatch('inv', 'Ignore new values')?.score ?? 0;
    expect(start).toBeGreaterThan(inside);
    expect(inside).toBeGreaterThan(scattered);
  });

  it('matches keywords below an equal label match', () => {
    expect(fuzzyScore('bills', 'Payables', ['bills'])).not.toBeNull();
    expect(fuzzyScore('bills', 'Payables', ['bills'])?.indices).toEqual([]);
  });

  it('filters groups, drops empty ones and sorts best first', () => {
    const result = filterCommands(groups(vi.fn()), 'inv');
    expect(result.map((group) => group.label)).toEqual(['Go to', 'Actions']);
    expect(result[0]?.items.map((r) => r.item.id)).toEqual(['invoices']);
    expect(filterCommands(groups(vi.fn()), 'zzz')).toEqual([]);
  });
});

/** The dialog is open and its field has focus, ready for keys. */
async function ready() {
  const input = await screen.findByRole('combobox', { name: 'Command menu' });
  await waitFor(() => {
    expect(input).toHaveFocus();
  });
  return input;
}

describe('CommandMenu', () => {
  it('opens from its trigger with the search field focused and groups named', async () => {
    render(
      <CommandMenu groups={groups(vi.fn())}>
        <CommandMenuTrigger />
      </CommandMenu>,
    );
    await userEvent.click(screen.getByRole('button', { name: /Search/ }));
    const dialog = await screen.findByRole('dialog', { name: 'Command menu' });
    const input = within(dialog).getByRole('combobox', { name: 'Command menu' });
    await waitFor(() => {
      expect(input).toHaveFocus();
    });
    expect(within(dialog).getByRole('group', { name: 'Go to' })).toBeInTheDocument();
    expect(within(dialog).getAllByRole('option')).toHaveLength(5);
  });

  it('opens with the shortcut, filters, and runs the highlighted command with Enter', async () => {
    const onSelect = vi.fn();
    render(<CommandMenu groups={groups(onSelect)} />);
    await userEvent.keyboard('{Control>}k{/Control}');
    const dialog = await screen.findByRole('dialog', { name: 'Command menu' });
    await ready();
    await userEvent.keyboard('nwinv');
    expect(
      within(dialog)
        .getAllByRole('option')
        .map((o) => o.textContent),
    ).toEqual(['New invoice']);
    await userEvent.keyboard('{Enter}');
    expect(onSelect).toHaveBeenCalledWith('new-invoice');
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('moves the highlight with the arrow keys', async () => {
    const onSelect = vi.fn();
    render(<CommandMenu groups={groups(onSelect)} defaultOpen />);
    await ready();
    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Overview' })).toHaveAttribute('data-highlighted');
    });
    await userEvent.keyboard('{ArrowDown}');
    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Invoices' })).toHaveAttribute('data-highlighted');
    });
    await userEvent.keyboard('{Enter}');
    expect(onSelect).toHaveBeenCalledWith('invoices');
  });

  it('says so when nothing matches, and starts empty again next time', async () => {
    const onOpenChange = vi.fn();
    render(<CommandMenu groups={groups(vi.fn())} defaultOpen onOpenChange={onOpenChange} />);
    await ready();
    await userEvent.keyboard('qqq');
    expect(await screen.findByText('No results for “qqq”')).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    await userEvent.keyboard('{Control>}k{/Control}');
    const input = await screen.findByRole('combobox', { name: 'Command menu' });
    expect(input).toHaveValue('');
  });

  it('runs a command on click', async () => {
    const onSelect = vi.fn();
    render(<CommandMenu groups={groups(onSelect)} defaultOpen />);
    await userEvent.click(await screen.findByRole('option', { name: 'Payables' }));
    expect(onSelect).toHaveBeenCalledWith('payables');
  });
});

describe('CommandMenu scroll cue', () => {
  /** Gives the list a fixed box, since jsdom lays nothing out. */
  function sized(list: HTMLElement, scrollHeight: number, clientHeight: number) {
    Object.defineProperty(list, 'scrollHeight', { configurable: true, value: scrollHeight });
    Object.defineProperty(list, 'clientHeight', { configurable: true, value: clientHeight });
  }

  it('fades the edge that hides rows, and only that one', async () => {
    render(<CommandMenu groups={groups(vi.fn())} defaultOpen />);
    const dialog = await screen.findByRole('dialog', { name: 'Command menu' });
    const list = dialog.querySelector<HTMLElement>('[data-slot="command-list"]');
    if (list === null) throw new Error('no list');
    expect(list).not.toHaveAttribute('data-overflow-start');
    expect(list).not.toHaveAttribute('data-overflow-end');

    sized(list, 600, 300);
    list.scrollTop = 0;
    list.dispatchEvent(new Event('scroll'));
    await waitFor(() => {
      expect(list).toHaveAttribute('data-overflow-end');
    });
    expect(list).not.toHaveAttribute('data-overflow-start');

    list.scrollTop = 150;
    list.dispatchEvent(new Event('scroll'));
    await waitFor(() => {
      expect(list).toHaveAttribute('data-overflow-start');
    });
    expect(list).toHaveAttribute('data-overflow-end');

    list.scrollTop = 300;
    list.dispatchEvent(new Event('scroll'));
    await waitFor(() => {
      expect(list).not.toHaveAttribute('data-overflow-end');
    });
    expect(list).toHaveAttribute('data-overflow-start');
  });

  it('uses masks, not a moving overlay, so there is nothing to animate', async () => {
    render(<CommandMenu groups={groups(vi.fn())} defaultOpen />);
    const dialog = await screen.findByRole('dialog', { name: 'Command menu' });
    const list = dialog.querySelector('[data-slot="command-list"]');
    expect(list?.className).toContain('data-overflow-end:mask-b-from-85%');
    expect(list?.className).not.toMatch(/transition|animate/);
  });
});
