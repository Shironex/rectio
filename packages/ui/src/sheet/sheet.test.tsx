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

  it('fills the screen at full size, on a side edge and on the bottom edge', async () => {
    const { unmount } = render(
      <Sheet side="right" defaultOpen>
        <SheetContent size="full">
          <SheetTitle>Ticket</SheetTitle>
        </SheetContent>
      </Sheet>,
    );
    const side = await screen.findByRole('dialog');
    expect(side.className).toContain('w-full');
    expect(side.className).toContain('max-w-none');
    unmount();
    render(
      <Sheet side="bottom" defaultOpen>
        <SheetContent size="full">
          <SheetTitle>Filters</SheetTitle>
        </SheetContent>
      </Sheet>,
    );
    const bottom = await screen.findByRole('dialog');
    expect(bottom.className).toContain('h-full');
    expect(bottom.className).toContain('max-h-none');
    expect(bottom.className).not.toContain('max-h-5/6');
  });

  it('keeps the parts of a full size sheet to a reading measure, and no other size', async () => {
    const parts = (size: 'full' | 'lg') => (
      <Sheet side="right" defaultOpen>
        <SheetContent size={size}>
          <SheetHeader data-testid="header">
            <SheetTitle>Invoice</SheetTitle>
          </SheetHeader>
          <SheetBody data-testid="body">Lines</SheetBody>
          <SheetFooter data-testid="footer">
            <Button>Send</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    );
    const { unmount } = render(parts('full'));
    await screen.findByRole('dialog');
    for (const id of ['header', 'body', 'footer']) {
      expect(screen.getByTestId(id).className).toContain('px-sheet');
    }
    unmount();
    render(parts('lg'));
    await screen.findByRole('dialog');
    expect(screen.getByTestId('body').className).not.toContain('px-sheet');
    expect(screen.getByTestId('body').className).toContain('px-5');
  });
});
