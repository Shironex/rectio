import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { Button } from '../button/button';
import {
  Menu,
  MenuCheckboxItem,
  MenuContent,
  MenuGroup,
  MenuItem,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuSub,
  MenuSubContent,
  MenuSubTrigger,
  MenuTrigger,
} from './menu';

function InvoiceMenu({ onDuplicate }: { onDuplicate: () => void }) {
  const [showVoided, setShowVoided] = useState(false);
  const [sort, setSort] = useState('due');
  return (
    <Menu>
      <MenuTrigger render={<Button variant="secondary" />}>Actions</MenuTrigger>
      <MenuContent>
        <MenuItem shortcut="mod+d" onClick={onDuplicate}>
          Duplicate
        </MenuItem>
        <MenuItem tone="danger">Void invoice</MenuItem>
        <MenuSeparator />
        <MenuCheckboxItem checked={showVoided} onCheckedChange={setShowVoided}>
          Show voided
        </MenuCheckboxItem>
        <MenuGroup label="Sort by">
          <MenuRadioGroup value={sort} onValueChange={setSort}>
            <MenuRadioItem value="due">Due date</MenuRadioItem>
            <MenuRadioItem value="amount">Amount</MenuRadioItem>
          </MenuRadioGroup>
        </MenuGroup>
        <MenuSub>
          <MenuSubTrigger>Export</MenuSubTrigger>
          <MenuSubContent>
            <MenuItem>CSV</MenuItem>
            <MenuItem>PDF</MenuItem>
          </MenuSubContent>
        </MenuSub>
      </MenuContent>
    </Menu>
  );
}

describe('Menu', () => {
  it('opens from the keyboard and runs an item with Enter', async () => {
    const onDuplicate = vi.fn();
    render(<InvoiceMenu onDuplicate={onDuplicate} />);
    const trigger = screen.getByRole('button', { name: 'Actions' });
    trigger.focus();
    await userEvent.keyboard('{ArrowDown}');
    await screen.findByRole('menu');
    await waitFor(() => {
      expect(screen.getByRole('menuitem', { name: /Duplicate/ })).toHaveFocus();
    });
    await userEvent.keyboard('{Enter}');
    expect(onDuplicate).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });
    expect(trigger).toHaveFocus();
  });

  it('declares item shortcuts for assistive tech', async () => {
    render(<InvoiceMenu onDuplicate={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Actions' }));
    expect(await screen.findByRole('menuitem', { name: /Duplicate/ })).toHaveAttribute(
      'aria-keyshortcuts',
      'Control+D',
    );
  });

  it('toggles checkbox items and picks radio items without closing', async () => {
    render(<InvoiceMenu onDuplicate={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Actions' }));
    const voided = await screen.findByRole('menuitemcheckbox', { name: 'Show voided' });
    expect(voided).toHaveAttribute('aria-checked', 'false');
    await userEvent.click(voided);
    expect(voided).toHaveAttribute('aria-checked', 'true');
    const amount = screen.getByRole('menuitemradio', { name: 'Amount' });
    await userEvent.click(amount);
    expect(amount).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('menuitemradio', { name: 'Due date' })).toHaveAttribute(
      'aria-checked',
      'false',
    );
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('names groups and opens a submenu with ArrowRight', async () => {
    render(<InvoiceMenu onDuplicate={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Actions' }));
    expect(await screen.findByRole('group', { name: 'Sort by' })).toBeInTheDocument();
    const exportItem = screen.getByRole('menuitem', { name: 'Export' });
    exportItem.focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(await screen.findByRole('menuitem', { name: 'CSV' })).toBeInTheDocument();
  });
});
