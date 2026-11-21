import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Button } from '../button/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  type AlertDialogTone,
} from './alert-dialog';

function renderDelete({
  onAction,
  onOpenChange,
  tone,
  cancel = true,
}: {
  onAction?: () => unknown;
  onOpenChange?: (open: boolean) => void;
  tone?: AlertDialogTone;
  cancel?: boolean;
} = {}) {
  render(
    <AlertDialog {...(onOpenChange === undefined ? {} : { onOpenChange })}>
      <AlertDialogTrigger render={<Button variant="danger" />}>Delete</AlertDialogTrigger>
      <AlertDialogContent {...(tone === undefined ? {} : { tone })}>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete invoice 2041?</AlertDialogTitle>
          <AlertDialogDescription>The invoice and its payments are removed.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {cancel && <AlertDialogCancel>Keep invoice</AlertDialogCancel>}
          <AlertDialogAction {...(onAction === undefined ? {} : { onAction })}>
            Delete invoice
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>,
  );
  return screen.getByRole('button', { name: 'Delete' });
}

describe('AlertDialog', () => {
  it('opens as a named alert dialog with the focus on the safe action', async () => {
    await userEvent.click(renderDelete());
    const dialog = await screen.findByRole('alertdialog', { name: 'Delete invoice 2041?' });
    expect(dialog).toHaveAccessibleDescription('The invoice and its payments are removed.');
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Keep invoice' })).toHaveFocus();
    });
    // No corner close button: the answers are the ways out.
    expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument();
  });

  it('cancels with the safe action and returns focus to the trigger', async () => {
    const onAction = vi.fn();
    const trigger = renderDelete({ onAction });
    await userEvent.click(trigger);
    await userEvent.click(await screen.findByRole('button', { name: 'Keep invoice' }));
    await waitFor(() => {
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });
    expect(onAction).not.toHaveBeenCalled();
    expect(trigger).toHaveFocus();
  });

  it('cancels on Escape', async () => {
    await userEvent.click(renderDelete());
    await screen.findByRole('alertdialog');
    await userEvent.keyboard('{Escape}');
    await waitFor(() => {
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });
  });

  it('runs the action and closes, telling onOpenChange', async () => {
    const onAction = vi.fn();
    const onOpenChange = vi.fn();
    await userEvent.click(renderDelete({ onAction, onOpenChange }));
    await userEvent.click(await screen.findByRole('button', { name: 'Delete invoice' }));
    expect(onAction).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });
    expect(onOpenChange).toHaveBeenLastCalledWith(false, expect.anything());
  });

  it('stays open and busy while an async action runs, and closes when it resolves', async () => {
    let resolve: () => void = () => undefined;
    const onAction = () =>
      new Promise<void>((done) => {
        resolve = done;
      });
    await userEvent.click(renderDelete({ onAction }));
    const action = await screen.findByRole('button', { name: 'Delete invoice' });
    await userEvent.click(action);
    expect(action).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    resolve();
    await waitFor(() => {
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });
  });

  it('stays open when an async action fails', async () => {
    const onAction = () => Promise.reject(new Error('offline'));
    await userEvent.click(renderDelete({ onAction }));
    const action = await screen.findByRole('button', { name: 'Delete invoice' });
    await userEvent.click(action);
    await waitFor(() => {
      expect(action).not.toHaveAttribute('aria-busy');
    });
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
  });

  it('draws the action by tone: outlined danger, or primary for a warning', async () => {
    await userEvent.click(renderDelete({ tone: 'warning' }));
    const dialog = await screen.findByRole('alertdialog');
    expect(dialog).toHaveAttribute('data-tone', 'warning');
    expect(screen.getByRole('button', { name: 'Delete invoice' })).toHaveAttribute(
      'data-variant',
      'primary',
    );
  });

  it('focuses the first answer when there is no safe action', async () => {
    await userEvent.click(renderDelete({ cancel: false, tone: 'neutral' }));
    await screen.findByRole('alertdialog');
    expect(document.querySelector('[data-part="icon"]')).toBeNull();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Delete invoice' })).toHaveFocus();
    });
  });
});
