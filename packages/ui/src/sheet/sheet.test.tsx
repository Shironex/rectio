import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { Button } from '../button/button';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  type SheetSide,
} from './sheet';

function renderSheet(side: SheetSide) {
  render(
    <Sheet side={side}>
      <SheetTrigger render={<Button />}>Filters</SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Filter invoices</SheetTitle>
          <SheetDescription>Narrow the list by status and date.</SheetDescription>
        </SheetHeader>
        <SheetBody>
          <input aria-label="Customer" />
        </SheetBody>
        <SheetFooter>
          <Button>Apply</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>,
  );
  return screen.getByRole('button', { name: 'Filters' });
}

describe('Sheet', () => {
  it.each(['right', 'left', 'bottom'] as const)(
    'opens from the %s as a named modal dialog',
    async (side) => {
      const trigger = renderSheet(side);
      await userEvent.click(trigger);
      const sheet = await screen.findByRole('dialog', { name: 'Filter invoices' });
      expect(sheet).toHaveAccessibleDescription('Narrow the list by status and date.');
      expect(sheet).toHaveAttribute('data-side', side);
      await waitFor(() => {
        expect(sheet).toContainElement(document.activeElement as HTMLElement);
      });
    },
  );

  it('closes on Escape and returns focus to the trigger', async () => {
    const trigger = renderSheet('right');
    await userEvent.click(trigger);
    await screen.findByRole('dialog');
    await userEvent.keyboard('{Escape}');
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    expect(trigger).toHaveFocus();
  });

  it('has a named close button', async () => {
    renderSheet('bottom');
    await userEvent.click(screen.getByRole('button', { name: 'Filters' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Close' }));
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('takes the width of its size on a side edge', async () => {
    render(
      <Sheet side="right" defaultOpen>
        <SheetContent size="lg">
          <SheetTitle>Ticket</SheetTitle>
        </SheetContent>
      </Sheet>,
    );
    const panel = await screen.findByRole('dialog');
    expect(panel.className).toContain('w-(--rx-sheet-width-lg)');
  });
});
