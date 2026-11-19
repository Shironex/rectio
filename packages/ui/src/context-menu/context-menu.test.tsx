import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { MenuItem } from '../menu/menu';
import { ContextMenu, ContextMenuContent, ContextMenuTrigger } from './context-menu';

describe('ContextMenu', () => {
  it('opens a menu of the shared items on right click', async () => {
    const onOpen = vi.fn();
    render(
      <ContextMenu>
        <ContextMenuTrigger>INV-2041</ContextMenuTrigger>
        <ContextMenuContent>
          <MenuItem onClick={onOpen}>Open invoice</MenuItem>
          <MenuItem>Copy number</MenuItem>
        </ContextMenuContent>
      </ContextMenu>,
    );
    fireEvent.contextMenu(screen.getByText('INV-2041'));
    expect(await screen.findByRole('menu')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('menuitem', { name: 'Open invoice' }));
    expect(onOpen).toHaveBeenCalledTimes(1);
  });
});
