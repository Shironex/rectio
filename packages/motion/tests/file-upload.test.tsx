import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { FileItem, FileList } from '../src/file-upload/file-upload';

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
    value: vi.fn(),
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
  Reflect.deleteProperty(Element.prototype, 'animate');
});

function Attachments() {
  const [files, setFiles] = useState([
    { id: 'a', name: 'invoice.pdf', size: 1024, status: 'done' as const },
    { id: 'b', name: 'receipt.png', size: 2048, status: 'uploading' as const, progress: 30 },
  ]);
  return (
    <FileList aria-label="Attachments">
      {files.map((file) => (
        <FileItem
          key={file.id}
          file={file}
          onRemove={(removed) => {
            setFiles((list) => list.filter((item) => item.id !== removed.id));
          }}
        />
      ))}
    </FileList>
  );
}

describe('motioned FileList', () => {
  it('marks the list and its rows in a browser that may animate', () => {
    browser({ reduce: false });
    const { container } = render(<Attachments />);
    // The list and both rows.
    expect(container.querySelectorAll('[data-motion]')).toHaveLength(3);
  });

  it('is the plain list under reduced motion', () => {
    browser({ reduce: true });
    const { container } = render(<Attachments />);
    expect(container.querySelectorAll('[data-motion]')).toHaveLength(0);
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('removes a row without the motion tokens, and moves focus to the next one', async () => {
    // No token stylesheet in the test DOM: no motion at all, never a guessed duration.
    browser({ reduce: false });
    render(<Attachments />);
    await userEvent.click(screen.getByRole('button', { name: 'Remove invoice.pdf' }));
    expect(screen.getByRole('button', { name: 'Remove receipt.png' })).toHaveFocus();
    await waitFor(() => {
      expect(screen.getAllByRole('listitem')).toHaveLength(1);
    });
  });
});
