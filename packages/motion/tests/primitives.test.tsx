import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@rectio/ui';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AlertDialogContent, CopyButton } from '../src/index';

/** Pretends to be a browser that can animate, with the system's reduced motion set or not. */
function browser({ reduce }: { reduce: boolean }) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches: reduce && query.includes('prefers-reduced-motion: reduce'),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
  Object.defineProperty(Element.prototype, 'animate', {
    configurable: true,
    value: vi.fn(() => ({ cancel: vi.fn(), finished: Promise.resolve(), stop: vi.fn() })),
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
  Reflect.deleteProperty(Element.prototype, 'animate');
});

function DeleteInvoice() {
  return (
    <AlertDialog>
      <AlertDialogTrigger>Delete</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete invoice 2041?</AlertDialogTitle>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep invoice</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

describe('motioned AlertDialogContent', () => {
  it('opens on the script entrance, still an alert dialog focused on the safe action', async () => {
    browser({ reduce: false });
    render(<DeleteInvoice />);
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    const dialog = await screen.findByRole('alertdialog', { name: 'Delete invoice 2041?' });
    expect(dialog).toHaveAttribute('data-motion');
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Keep invoice' })).toHaveFocus();
    });
  });

  it('is the plain content under reduced motion', async () => {
    browser({ reduce: true });
    render(<DeleteInvoice />);
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    const dialog = await screen.findByRole('alertdialog');
    expect(dialog).not.toHaveAttribute('data-motion');
  });
});

describe('motioned CopyButton', () => {
  it('copies and springs the check in, saying Copied', async () => {
    browser({ reduce: false });
    const writeText = vi.fn(() => Promise.resolve());
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    render(<CopyButton value="INV-2041" label="Copy reference" />);
    const button = screen.getByRole('button', { name: 'Copy reference' });
    expect(button).toHaveAttribute('data-motion');
    await userEvent.click(button);
    expect(writeText).toHaveBeenCalledWith('INV-2041');
    expect(screen.getByRole('status')).toHaveTextContent('Copied');
    expect(button.querySelector('[data-part="icons"]')).not.toBeNull();
    Reflect.deleteProperty(navigator, 'clipboard');
  });

  it('is the plain button under reduced motion', () => {
    browser({ reduce: true });
    render(<CopyButton value="INV-2041" />);
    expect(screen.getByRole('button', { name: 'Copy' })).not.toHaveAttribute('data-motion');
  });
});
