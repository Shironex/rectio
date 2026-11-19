'use client';

import { FileDropzone, FileItem, FileList } from '@rectio/motion';
import { Field, FieldDescription, FieldError, FieldLabel, FileUpload } from '@rectio/ui';

import { useReceipts } from './file-upload';

export default function FileUploadMotionDemo() {
  const upload = useReceipts();

  return (
    <Field className="w-full max-w-md" invalid={upload.rejected.length > 0}>
      <FieldLabel>Receipts</FieldLabel>
      <FileUpload {...upload.rootProps}>
        <FileDropzone />
        {/* Kept mounted while empty, so the last row can still play its exit. */}
        <FileList aria-label="Attached receipts">
          {upload.files.map((file) => (
            <FileItem key={file.id} file={file} />
          ))}
        </FileList>
      </FileUpload>
      <FieldDescription>PDF, PNG or JPG, up to 10 MB each, five files at most.</FieldDescription>
      <FieldError>{upload.rejected.join(' ')}</FieldError>
    </Field>
  );
}
