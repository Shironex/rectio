'use client';

import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  FileDropzone,
  FileItem,
  FileList,
  FileUpload,
  useFileUpload,
  type FileUploadEntry,
  type FileUploadTask,
} from '@rectio/ui';
import { useState } from 'react';

export const MAX_SIZE = 10 * 1024 * 1024;
export const ACCEPT = '.pdf,.png,.jpg';

/** A receipt saved with the expense earlier, so the list opens with one finished row. */
export const SAVED: FileUploadEntry[] = [
  {
    id: 'saved-1',
    name: 'lufthansa-fra-waw.pdf',
    size: 184_320,
    type: 'application/pdf',
    status: 'done',
  },
];

const tried = new WeakSet<File>();

/**
 * Stands in for the app's upload: reports progress in steps and resolves. Files over 2 MB fail on
 * their first try, so the error row and Retry can be seen. A real app sends the file with `fetch`
 * or XHR and passes `signal` along.
 */
export function simulateUpload(file: File, { onProgress, signal }: FileUploadTask) {
  const failOnce = file.size > 2 * 1024 * 1024 && !tried.has(file);
  tried.add(file);
  return new Promise<void>((resolve, reject) => {
    let percent = 0;
    const timer = setInterval(() => {
      percent = Math.min(100, percent + 8 + Math.random() * 14);
      if (failOnce && percent > 60) {
        clearInterval(timer);
        reject(new Error('The connection dropped. Try again.'));
        return;
      }
      onProgress(percent);
      if (percent >= 100) {
        clearInterval(timer);
        resolve();
      }
    }, 160);
    signal.addEventListener('abort', () => {
      clearInterval(timer);
    });
  });
}

/**
 * The upload state plus the rejection messages, shown in the FieldError until the next file is
 * accepted. The root announces rejections too; the error keeps them on screen.
 */
export function useReceipts() {
  const upload = useFileUpload({ upload: simulateUpload, initialFiles: SAVED });
  const [rejected, setRejected] = useState<string[]>([]);
  const rootProps = {
    ...upload.rootProps,
    accept: ACCEPT,
    maxSize: MAX_SIZE,
    maxFiles: 5,
    onFilesAdded: (files: File[]) => {
      setRejected([]);
      upload.addFiles(files);
    },
    onRejected: (rejections: { message: string }[]) => {
      setRejected(rejections.map((rejection) => rejection.message));
    },
  };
  return { files: upload.files, rejected, rootProps };
}

export default function FileUploadDemo() {
  const upload = useReceipts();

  return (
    <Field className="w-full max-w-md" invalid={upload.rejected.length > 0}>
      <FieldLabel>Receipts</FieldLabel>
      <FileUpload {...upload.rootProps}>
        <FileDropzone />
        {upload.files.length > 0 && (
          <FileList aria-label="Attached receipts">
            {upload.files.map((file) => (
              <FileItem key={file.id} file={file} />
            ))}
          </FileList>
        )}
      </FileUpload>
      <FieldDescription>PDF, PNG or JPG, up to 10 MB each, five files at most.</FieldDescription>
      <FieldError>{upload.rejected.join(' ')}</FieldError>
    </Field>
  );
}
