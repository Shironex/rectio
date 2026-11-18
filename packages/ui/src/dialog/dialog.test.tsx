import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { Button } from '../button/button';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './dialog';

function renderDialog() {
  render(
    <Dialog>
      <DialogTrigger render={<Button />}>Add expense</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New expense</DialogTitle>
          <DialogDescription>Saved to the March report.</DialogDescription>
        </DialogHeader>
        <DialogBody>
          <input aria-label="Merchant" />
        </DialogBody>
        <DialogFooter>
          <Button>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>,
  );
  return screen.getByRole('button', { name: 'Add expense' });
}

describe('Dialog', () => {
  it('opens as a named, described modal dialog with focus inside', async () => {
    const trigger = renderDialog();
    await userEvent.click(trigger);
    const dialog = await screen.findByRole('dialog', { name: 'New expense' });
    expect(dialog).toHaveAccessibleDescription('Saved to the March report.');
    await waitFor(() => {
      expect(dialog).toContainElement(document.activeElement as HTMLElement);
    });
  });

  it('hides the rest of the page from assistive tech while open', async () => {
    // The Tab cycle itself runs through focus guards that jsdom does not redirect; the playground's
    // Playwright script checks it in a real browser.
    const trigger = renderDialog();
    await userEvent.click(trigger);
    await screen.findByRole('dialog');
    expect(trigger.closest('[aria-hidden="true"]')).not.toBeNull();
  });

  it('closes with Escape and gives focus back to the trigger', async () => {
    const trigger = renderDialog();
    await userEvent.click(trigger);
    await screen.findByRole('dialog');
    await userEvent.keyboard('{Escape}');
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    expect(trigger).toHaveFocus();
  });

  it('has a named close button', async () => {
    const trigger = renderDialog();
    await userEvent.click(trigger);
    await userEvent.click(await screen.findByRole('button', { name: 'Close' }));
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});
