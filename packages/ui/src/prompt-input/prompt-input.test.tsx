import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { FileUploadEntry } from '../file-upload/file-upload';
import { PromptInput } from './prompt-input';

describe('PromptInput', () => {
  it('sends with Enter, adds a line with Shift Enter, empties and keeps focus', async () => {
    const onSubmit = vi.fn();
    render(<PromptInput onSubmit={onSubmit} />);
    const field = screen.getByRole('textbox', { name: 'Message' });
    await userEvent.type(field, 'First line{Shift>}{Enter}{/Shift}second line');
    expect(field).toHaveValue('First line\nsecond line');
    await userEvent.keyboard('{Enter}');
    expect(onSubmit).toHaveBeenCalledWith('First line\nsecond line', []);
    expect(field).toHaveValue('');
    expect(field).toHaveFocus();
  });

  it('never sends while an input method is composing', () => {
    const onSubmit = vi.fn();
    render(<PromptInput onSubmit={onSubmit} defaultValue="にほん" />);
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter', isComposing: true });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('keeps the text when onSubmit returns false', async () => {
    render(<PromptInput onSubmit={() => false} defaultValue="Keep me" />);
    await userEvent.click(screen.getByRole('button', { name: 'Send' }));
    expect(screen.getByRole('textbox')).toHaveValue('Keep me');
  });

  it('waits on an empty field and while a reply streams, and offers Stop', async () => {
    const onSubmit = vi.fn();
    const onStop = vi.fn();
    const { rerender } = render(<PromptInput onSubmit={onSubmit} />);
    expect(screen.getByRole('button', { name: 'Send' })).toHaveAttribute('aria-disabled', 'true');
    rerender(
      <PromptInput onSubmit={onSubmit} onStop={onStop} status="streaming" defaultValue="Next" />,
    );
    const field = screen.getByRole('textbox');
    await userEvent.type(field, 'Next question{Enter}');
    expect(onSubmit).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Stop' }));
    expect(onStop).toHaveBeenCalledOnce();
    expect(field).toHaveFocus();
  });

  it('sends only with Ctrl or Cmd when submitKey is mod-enter', async () => {
    const onSubmit = vi.fn();
    render(<PromptInput onSubmit={onSubmit} submitKey="mod-enter" />);
    await userEvent.type(screen.getByRole('textbox'), 'Hi{Enter}');
    expect(onSubmit).not.toHaveBeenCalled();
    await userEvent.keyboard('{Control>}{Enter}{/Control}');
    expect(onSubmit).toHaveBeenCalledWith('Hi', []);
  });

  it('attaches files through the file upload parts and waits for uploads before sending', async () => {
    const onAttach = vi.fn();
    const onRemove = vi.fn();
    const uploading: FileUploadEntry = {
      id: 'a',
      name: 'q3.csv',
      size: 2048,
      status: 'uploading',
      progress: 40,
    };
    const { container, rerender } = render(
      <PromptInput
        onSubmit={vi.fn()}
        onAttach={onAttach}
        onRemoveAttachment={onRemove}
        attachments={[uploading]}
        defaultValue="See file"
      />,
    );
    expect(screen.getByRole('list', { name: 'Attached files' })).toHaveTextContent('q3.csv');
    expect(screen.getByText('Waiting for uploads')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send' })).toHaveAttribute('aria-disabled', 'true');

    const input = container.querySelector<HTMLInputElement>('input[type="file"]');
    if (input === null) throw new Error('no file input');
    await userEvent.upload(input, new File(['x'], 'ledger.pdf', { type: 'application/pdf' }));
    expect(onAttach).toHaveBeenCalledWith([expect.objectContaining({ name: 'ledger.pdf' })]);

    rerender(
      <PromptInput
        onSubmit={vi.fn()}
        onAttach={onAttach}
        onRemoveAttachment={onRemove}
        attachments={[{ ...uploading, status: 'done' }]}
        defaultValue="See file"
      />,
    );
    expect(screen.getByRole('button', { name: 'Send' })).not.toHaveAttribute(
      'aria-disabled',
      'true',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Remove q3.csv' }));
    expect(onRemove).toHaveBeenCalledOnce();
  });

  it('shows how many characters are left near the limit', async () => {
    render(<PromptInput onSubmit={vi.fn()} maxLength={100} />);
    expect(screen.queryByText(/left/)).not.toBeInTheDocument();
    await userEvent.type(screen.getByRole('textbox'), 'x'.repeat(95));
    expect(screen.getByText('5 characters left')).toBeInTheDocument();
  });

  it('describes the field with its hint', () => {
    render(<PromptInput onSubmit={() => undefined} hint="You are offline." disabled />);
    expect(screen.getByRole('textbox')).toHaveAccessibleDescription('You are offline.');
  });
});
