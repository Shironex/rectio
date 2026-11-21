import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { copyToClipboard } from './clipboard';
import { CopyButton } from './copy-button';

function clipboard(writeText: (text: string) => Promise<void>) {
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
}

/** Stands in for the legacy copy command, which jsdom lacks. */
function commandCopy(works: boolean) {
  const exec = vi.fn(() => works);
  Object.defineProperty(document, 'execCommand', { configurable: true, value: exec });
  return exec;
}

afterEach(() => {
  Reflect.deleteProperty(navigator, 'clipboard');
  vi.useRealTimers();
});

describe('CopyButton', () => {
  it('copies its value, says so, and goes back after a while', async () => {
    const writeText = vi.fn(() => Promise.resolve());
    clipboard(writeText);
    const onCopy = vi.fn();
    render(<CopyButton value="IE29 AIBK 9311 5212 3456 78" label="Copy IBAN" onCopy={onCopy} />);
    const button = screen.getByRole('button', { name: 'Copy IBAN' });
    vi.useFakeTimers({ shouldAdvanceTime: true });
    await userEvent.click(button);
    expect(writeText).toHaveBeenCalledWith('IE29 AIBK 9311 5212 3456 78');
    expect(onCopy).toHaveBeenCalledWith('IE29 AIBK 9311 5212 3456 78');
    expect(button).toHaveAttribute('data-copied');
    expect(screen.getByRole('status')).toHaveTextContent('Copied');
    act(() => {
      vi.advanceTimersByTime(2100);
    });
    expect(button).not.toHaveAttribute('data-copied');
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  it('reads the value at the moment of the press', async () => {
    const writeText = vi.fn(() => Promise.resolve());
    clipboard(writeText);
    let link = 'https://pay.example/inv/2040';
    render(<CopyButton value={() => link} label="Copy link" />);
    link = 'https://pay.example/inv/2041';
    await userEvent.click(screen.getByRole('button', { name: 'Copy link' }));
    expect(writeText).toHaveBeenCalledWith('https://pay.example/inv/2041');
  });

  it('keeps its name and width with a visible label', async () => {
    clipboard(() => Promise.resolve());
    render(<CopyButton value="sk_live_51" label="Copy key" copiedLabel="Key copied" showLabel />);
    const button = screen.getByRole('button', { name: 'Copy key' });
    await userEvent.click(button);
    expect(button).toHaveAccessibleName('Key copied');
  });

  it('reports a refused copy and stays as it was', async () => {
    clipboard(() => Promise.reject(new Error('denied')));
    // The copy command fails too.
    commandCopy(false);
    const onCopyError = vi.fn();
    render(<CopyButton value="secret" onCopyError={onCopyError} />);
    const button = screen.getByRole('button', { name: 'Copy' });
    await userEvent.click(button);
    expect(onCopyError).toHaveBeenCalledTimes(1);
    expect(button).not.toHaveAttribute('data-copied');
  });
});

describe('copyToClipboard', () => {
  it('falls back to the copy command without the Clipboard API, keeping the focus', async () => {
    const exec = commandCopy(true);
    render(<input aria-label="Reference" />);
    const input = screen.getByRole('textbox');
    input.focus();
    await copyToClipboard('INV-2041');
    expect(exec).toHaveBeenCalledWith('copy');
    expect(input).toHaveFocus();
    expect(document.querySelector('textarea')).toBeNull();
  });
});
