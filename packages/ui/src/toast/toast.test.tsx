import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { ToastProvider, useToast } from './toast';

function SaveButton({ onUndo }: { onUndo: () => void }) {
  const toast = useToast();
  const [rows, setRows] = useState(['Lufthansa']);
  return (
    <>
      <p data-testid="rows">{rows.join(', ')}</p>
      <button
        type="button"
        onClick={() => {
          setRows((list) => [...list, 'Figma']);
          const id = toast.add({
            type: 'success',
            title: 'Expense added',
            description: 'Figma, €75.00',
            actionProps: {
              children: 'Undo',
              onClick: () => {
                setRows((list) => list.filter((name) => name !== 'Figma'));
                onUndo();
                toast.close(id);
              },
            },
          });
        }}
      >
        Save
      </button>
      <button
        type="button"
        onClick={() => {
          toast.add({ type: 'error', title: 'Could not save', description: 'Try again.' });
        }}
      >
        Fail
      </button>
    </>
  );
}

describe('Toast', () => {
  it('shows a success toast whose Undo reverts the change and closes it', async () => {
    const onUndo = vi.fn();
    render(
      <ToastProvider>
        <SaveButton onUndo={onUndo} />
      </ToastProvider>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByTestId('rows')).toHaveTextContent('Lufthansa, Figma');
    expect(await screen.findByText('Expense added')).toBeInTheDocument();
    expect(screen.getByText('Figma, €75.00')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(onUndo).toHaveBeenCalledOnce();
    expect(screen.getByTestId('rows')).toHaveTextContent('Lufthansa');
    await waitFor(() => {
      expect(screen.queryByText('Expense added')).not.toBeInTheDocument();
    });
  });

  it('closes with the dismiss button', async () => {
    render(
      <ToastProvider>
        <SaveButton onUndo={vi.fn()} />
      </ToastProvider>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Fail' }));
    expect(await screen.findByText('Could not save')).toBeInTheDocument();
    // Base UI hides the close button from screen readers until focus enters the stack (F6).
    await userEvent.click(screen.getByLabelText('Dismiss'));
    await waitFor(() => {
      expect(screen.queryByText('Could not save')).not.toBeInTheDocument();
    });
  });

  it('closes by itself after the timeout', async () => {
    render(
      <ToastProvider timeout={50}>
        <SaveButton onUndo={vi.fn()} />
      </ToastProvider>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Fail' }));
    expect(await screen.findByText('Could not save')).toBeInTheDocument();
    // Generous: a cold test worker can be slow to fire the first timer.
    await waitFor(
      () => {
        expect(screen.queryByText('Could not save')).not.toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  });
});
