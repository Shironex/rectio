import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../alert-dialog/alert-dialog';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '../dialog/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '../popover/popover';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '../sheet/sheet';
import { isModalDialogOpen } from './modal-dialog';

describe('isModalDialogOpen', () => {
  it('is false with nothing open', () => {
    render(<button type="button">Page</button>);
    expect(isModalDialogOpen()).toBe(false);
  });

  it('sees an open dialog, and not once it has closed', async () => {
    render(
      <Dialog>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent>
          <DialogTitle>Settings</DialogTitle>
        </DialogContent>
      </Dialog>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Open' }));
    await screen.findByRole('dialog', { name: 'Settings' });
    expect(isModalDialogOpen()).toBe(true);
    await userEvent.keyboard('{Escape}');
    await waitFor(() => {
      expect(isModalDialogOpen()).toBe(false);
    });
  });

  it('sees an open alert dialog', async () => {
    render(
      <AlertDialog>
        <AlertDialogTrigger>Delete</AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogTitle>Delete this chat?</AlertDialogTitle>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
        </AlertDialogContent>
      </AlertDialog>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    await screen.findByRole('alertdialog', { name: 'Delete this chat?' });
    expect(isModalDialogOpen()).toBe(true);
  });

  it('sees an open sheet', async () => {
    render(
      <Sheet side="left">
        <SheetTrigger>Chats</SheetTrigger>
        <SheetContent>
          <SheetTitle>Chats</SheetTitle>
        </SheetContent>
      </Sheet>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Chats' }));
    await screen.findByRole('dialog', { name: 'Chats' });
    expect(isModalDialogOpen()).toBe(true);
  });

  it('ignores a popover, which is a dialog role but not modal', async () => {
    render(
      <Popover>
        <PopoverTrigger>Filters</PopoverTrigger>
        <PopoverContent aria-label="Filters">Pick a period</PopoverContent>
      </Popover>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Filters' }));
    await screen.findByText('Pick a period');
    expect(document.querySelector('[role="dialog"][data-open]')).not.toBeNull();
    expect(isModalDialogOpen()).toBe(false);
  });
});
