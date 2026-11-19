import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Field, FieldDescription, FieldError, FieldLabel } from '../field/field';
import {
  FileDropzone,
  FileItem,
  FileList,
  FileUpload,
  FileUploadTrigger,
  describeAccept,
  formatFileSize,
  useFileUpload,
  validateFiles,
  type FileRejection,
  type FileUploadEntry,
  type UseFileUploadOptions,
} from './file-upload';

const MB = 1024 * 1024;

function makeFile(name: string, size: number, type: string) {
  const file = new File(['x'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
}

const fileInput = (container: HTMLElement) => {
  const input = container.querySelector<HTMLInputElement>('input[type="file"]');
  if (input === null) throw new Error('no file input');
  return input;
};

/** Drops files on an element the way a browser does, with `Files` in the transfer types. */
function drop(target: Element, files: File[]) {
  const dataTransfer = { files, types: ['Files'], dropEffect: 'none' };
  fireEvent.dragEnter(target, { dataTransfer });
  fireEvent.dragOver(target, { dataTransfer });
  fireEvent.drop(target, { dataTransfer });
}

describe('formatting and rules', () => {
  it('formats sizes with Intl in steps of 1024', () => {
    expect(formatFileSize(512, 'en')).toBe('512 bytes');
    expect(formatFileSize(12.4 * MB, 'en')).toBe('12.4 MB');
    expect(formatFileSize(10 * MB, 'en')).toBe('10 MB');
    expect(formatFileSize(12.4 * MB, 'pl')).toBe('12,4 MB');
  });

  it('names the accepted types in words', () => {
    expect(describeAccept('.pdf,image/png,.jpg,.jpeg')).toBe('PDF, PNG, JPG');
    expect(describeAccept('application/pdf,image/*')).toBe('PDF, images');
  });

  it('gives each rejected file one readable reason', () => {
    const { accepted, rejected } = validateFiles(
      [
        makeFile('invoice.exe', 100, 'application/x-msdownload'),
        makeFile('scan.pdf', 12.4 * MB, 'application/pdf'),
        makeFile('receipt.png', 200, 'image/png'),
        makeFile('second.png', 200, 'image/png'),
      ],
      { accept: '.pdf,.png,.jpg', maxSize: 10 * MB, maxFiles: 2, existing: 1, locale: 'en' },
    );
    expect(accepted.map((f) => f.name)).toEqual(['receipt.png']);
    expect(rejected.map((r) => [r.code, r.message])).toEqual([
      ['type', 'invoice.exe is not an accepted type (PDF, PNG, JPG).'],
      ['size', 'scan.pdf is 12.4 MB; the limit is 10 MB.'],
      ['count', 'second.png was not added; the limit is 2 files.'],
    ]);
  });

  it('matches wildcard MIME types and extensions regardless of case', () => {
    const { accepted } = validateFiles(
      [makeFile('Photo.JPG', 10, ''), makeFile('avatar.webp', 10, 'image/webp')],
      { accept: '.jpg,image/*' },
    );
    expect(accepted).toHaveLength(2);
  });

  it('takes one file at a time when multiple is off', () => {
    const { accepted, rejected } = validateFiles(
      [makeFile('a.png', 1, 'image/png'), makeFile('b.png', 1, 'image/png')],
      { multiple: false, existing: 1 },
    );
    expect(accepted.map((f) => f.name)).toEqual(['a.png']);
    expect(rejected[0]?.message).toBe('b.png was not added; choose one file at a time.');
  });
});

describe('FileDropzone', () => {
  it('is a button named by its FieldLabel, described by the description, opening the picker', async () => {
    const { container } = render(
      <Field>
        <FieldLabel>Receipts</FieldLabel>
        <FileUpload accept=".pdf">
          <FileDropzone />
        </FileUpload>
        <FieldDescription>PDF, up to 10 MB.</FieldDescription>
      </Field>,
    );
    const zone = screen.getByRole('button', { name: 'Receipts' });
    expect(zone).toHaveAccessibleDescription('PDF, up to 10 MB.');
    const click = vi.spyOn(fileInput(container), 'click');
    zone.focus();
    await userEvent.keyboard('{Enter}');
    expect(click).toHaveBeenCalledTimes(1);
    await userEvent.keyboard(' ');
    expect(click).toHaveBeenCalledTimes(2);
  });

  it('is named by its text without a Field', () => {
    render(
      <FileUpload>
        <FileDropzone />
      </FileUpload>,
    );
    expect(
      screen.getByRole('button', { name: 'Drop files here or click to choose' }),
    ).toBeInTheDocument();
  });

  it('passes picked files through the rules and announces both outcomes', () => {
    const onFilesAdded = vi.fn();
    const onRejected = vi.fn();
    const { container } = render(
      <FileUpload
        accept=".pdf,.png,.jpg"
        maxSize={10 * MB}
        locale="en"
        onFilesAdded={onFilesAdded}
        onRejected={onRejected}
      >
        <FileDropzone />
      </FileUpload>,
    );
    const good = makeFile('receipt.pdf', 2 * MB, 'application/pdf');
    const bad = makeFile('scan.pdf', 12.4 * MB, 'application/pdf');
    fireEvent.change(fileInput(container), { target: { files: [good, bad] } });
    expect(onFilesAdded).toHaveBeenCalledWith([good]);
    expect(onRejected.mock.calls[0]?.[0]).toEqual([
      { file: bad, code: 'size', message: 'scan.pdf is 12.4 MB; the limit is 10 MB.' },
    ]);
    expect(screen.getByRole('status')).toHaveTextContent(
      'receipt.pdf added. scan.pdf is 12.4 MB; the limit is 10 MB.',
    );
  });

  it('takes dropped files and shows the drag-over state in text, not only colour', () => {
    const onFilesAdded = vi.fn();
    render(
      <FileUpload onFilesAdded={onFilesAdded}>
        <FileDropzone />
      </FileUpload>,
    );
    const zone = screen.getByRole('button');
    const file = makeFile('receipt.pdf', 10, 'application/pdf');
    fireEvent.dragEnter(zone, { dataTransfer: { files: [file], types: ['Files'] } });
    expect(zone).toHaveAttribute('data-dragging');
    expect(zone).toHaveTextContent('Release to add the files');
    fireEvent.drop(zone, { dataTransfer: { files: [file], types: ['Files'] } });
    expect(zone).not.toHaveAttribute('data-dragging');
    expect(onFilesAdded).toHaveBeenCalledWith([file]);
  });

  it('counts existing files against maxFiles', () => {
    const onRejected = vi.fn<(rejections: FileRejection[]) => void>();
    const files: FileUploadEntry[] = [
      { id: '1', name: 'a.pdf', size: 1, status: 'done' },
      { id: '2', name: 'b.pdf', size: 1, status: 'done' },
    ];
    render(
      <FileUpload files={files} maxFiles={2} onRejected={onRejected}>
        <FileDropzone />
      </FileUpload>,
    );
    drop(screen.getByRole('button'), [makeFile('c.pdf', 1, 'application/pdf')]);
    expect(onRejected.mock.calls[0]?.[0][0]?.message).toBe(
      'c.pdf was not added; the limit is 2 files.',
    );
  });

  it('ignores drops and presses when the Field is disabled', () => {
    const onFilesAdded = vi.fn();
    render(
      <Field disabled>
        <FieldLabel>Receipts</FieldLabel>
        <FileUpload onFilesAdded={onFilesAdded}>
          <FileDropzone />
        </FileUpload>
      </Field>,
    );
    const zone = screen.getByRole('button', { name: 'Receipts' });
    expect(zone).toBeDisabled();
    drop(zone, [makeFile('a.pdf', 1, 'application/pdf')]);
    expect(onFilesAdded).not.toHaveBeenCalled();
  });

  it('shows the error and links it when the app marks the Field invalid', () => {
    render(
      <Field invalid>
        <FieldLabel>Receipts</FieldLabel>
        <FileUpload>
          <FileDropzone />
        </FileUpload>
        <FieldError>Attach at least one receipt.</FieldError>
      </Field>,
    );
    const zone = screen.getByRole('button', { name: 'Receipts' });
    expect(screen.getByText('Attach at least one receipt.')).toBeVisible();
    expect(zone).toHaveAttribute('aria-invalid', 'true');
    expect(zone).toHaveAttribute('data-invalid');
    expect(zone).toHaveAccessibleDescription('Attach at least one receipt.');
  });
});

describe('FileUploadTrigger', () => {
  it('is a compact button with the same picker and Field name', async () => {
    const { container } = render(
      <Field>
        <FieldLabel>Profile photo</FieldLabel>
        <FileUpload accept="image/*" multiple={false}>
          <FileUploadTrigger />
        </FileUpload>
      </Field>,
    );
    const trigger = screen.getByRole('button', { name: 'Profile photo' });
    expect(trigger).toHaveTextContent('Attach file');
    expect(fileInput(container)).not.toHaveAttribute('multiple');
    const click = vi.spyOn(fileInput(container), 'click');
    await userEvent.click(trigger);
    expect(click).toHaveBeenCalledTimes(1);
  });
});

const entries: FileUploadEntry[] = [
  { id: 'q', name: 'march.csv', size: 2048, type: 'text/csv', status: 'queued' },
  {
    id: 'u',
    name: 'invoice.pdf',
    size: 1.5 * MB,
    type: 'application/pdf',
    status: 'uploading',
    progress: 42,
  },
  { id: 'd', name: 'receipt.png', size: 300_000, type: 'image/png', status: 'done' },
  {
    id: 'e',
    name: 'scan.pdf',
    size: 4 * MB,
    type: 'application/pdf',
    status: 'error',
    error: 'The server refused the file.',
  },
];

describe('FileList and FileItem', () => {
  it('shows each state in words, with a named progress bar while uploading', () => {
    render(
      <FileUpload locale="en" onRemove={vi.fn()} onRetry={vi.fn()}>
        <FileList aria-label="Attachments">
          {entries.map((entry) => (
            <FileItem key={entry.id} file={entry} />
          ))}
        </FileList>
      </FileUpload>,
    );
    const list = screen.getByRole('list', { name: 'Attachments' });
    expect(list.children).toHaveLength(4);
    expect(screen.getByText('Waiting')).toBeInTheDocument();
    expect(screen.getByText('2 kB')).toBeInTheDocument();
    const bar = screen.getByRole('progressbar', { name: 'Uploading invoice.pdf' });
    expect(bar).toHaveAttribute('aria-valuenow', '42');
    expect(screen.getByText('42%')).toBeInTheDocument();
    expect(screen.getByText('Uploaded')).toBeInTheDocument();
    expect(screen.getByText('The server refused the file.')).toBeInTheDocument();
    // Retry only on the failed row, named after its file.
    expect(screen.getAllByRole('button', { name: /^Retry/ })).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Retry scan.pdf' })).toBeInTheDocument();
  });

  it('calls back with the entry on remove and retry, and moves focus to the next row', async () => {
    const onRemove = vi.fn();
    const onRetry = vi.fn();
    render(
      <FileUpload onRemove={onRemove} onRetry={onRetry}>
        <FileList>
          {entries.map((entry) => (
            <FileItem key={entry.id} file={entry} />
          ))}
        </FileList>
      </FileUpload>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Retry scan.pdf' }));
    expect(onRetry).toHaveBeenCalledWith(entries[3]);
    await userEvent.click(screen.getByRole('button', { name: 'Remove invoice.pdf' }));
    expect(onRemove).toHaveBeenCalledWith(entries[1]);
    expect(screen.getByRole('button', { name: 'Remove receipt.png' })).toHaveFocus();
    expect(screen.getByRole('status')).toHaveTextContent('invoice.pdf removed.');
  });

  it('hides the remove button when nobody handles it', () => {
    render(
      <FileList>
        <FileItem file={{ id: 'd', name: 'receipt.png', size: 300_000, status: 'done' }} />
      </FileList>,
    );
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});

function Uploader({ upload }: { upload: NonNullable<UseFileUploadOptions['upload']> }) {
  const state = useFileUpload({ upload });
  return (
    <FileUpload {...state.rootProps}>
      <FileDropzone />
      <FileList>
        {state.files.map((entry) => (
          <FileItem key={entry.id} file={entry} />
        ))}
      </FileList>
    </FileUpload>
  );
}

describe('useFileUpload', () => {
  it('runs the app upload, then announces the result and lets a failed file retry', async () => {
    let fail = true;
    const upload = vi.fn(() =>
      fail ? Promise.reject(new Error('Connection lost.')) : Promise.resolve(),
    );
    const { container } = render(<Uploader upload={upload} />);
    const file = makeFile('receipt.pdf', 10, 'application/pdf');
    await act(async () => {
      fireEvent.change(fileInput(container), { target: { files: [file] } });
      await Promise.resolve();
    });
    expect(await screen.findByText('Connection lost.')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(
      'receipt.pdf failed to upload. Connection lost.',
    );
    fail = false;
    await userEvent.click(screen.getByRole('button', { name: 'Retry receipt.pdf' }));
    expect(await screen.findByText('Uploaded')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('receipt.pdf uploaded.');
    });
    expect(upload).toHaveBeenCalledTimes(2);
  });

  it('aborts the upload when the file is removed', async () => {
    let signal: AbortSignal | undefined;
    const upload = vi.fn(
      (_file: File, task: { signal: AbortSignal }) =>
        new Promise<void>(() => {
          signal = task.signal;
        }),
    );
    const { container } = render(<Uploader upload={upload} />);
    fireEvent.change(fileInput(container), {
      target: { files: [makeFile('a.pdf', 10, 'application/pdf')] },
    });
    await userEvent.click(await screen.findByRole('button', { name: 'Remove a.pdf' }));
    expect(signal?.aborted).toBe(true);
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
    // The last row gone, focus returns to the dropzone.
    expect(screen.getByRole('button', { name: /Drop files/ })).toHaveFocus();
  });
});
