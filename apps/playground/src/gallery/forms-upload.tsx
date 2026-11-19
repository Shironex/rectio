import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  FileDropzone,
  FileItem,
  FileList,
  FileProgress,
  FileUpload,
  FileUploadTrigger,
  type FileUploadEntry,
} from '@rectio/ui';

import { Row, Section } from './specimen';

const MB = 1024 * 1024;
const noop = () => undefined;

const DONE: FileUploadEntry = {
  id: 'd',
  name: 'taxi-receipt-0412.jpg',
  size: 612_000,
  type: 'image/jpeg',
  status: 'done',
};

/** One row per state, with realistic finance attachments. */
const ROWS: FileUploadEntry[] = [
  { id: 'q', name: 'march-card-statement.csv', size: 48_200, type: 'text/csv', status: 'queued' },
  {
    id: 'u',
    name: 'invoice-INV-2041.pdf',
    size: 1.4 * MB,
    type: 'application/pdf',
    status: 'uploading',
    progress: 42,
  },
  DONE,
  {
    id: 'e',
    name: 'supplier-contract-signed-final-version.pdf',
    size: 4.2 * MB,
    type: 'application/pdf',
    status: 'error',
    error: 'The connection dropped. Try again.',
  },
];

function Receipts({
  disabled = false,
  invalid = false,
  rows = [],
}: {
  disabled?: boolean;
  invalid?: boolean;
  rows?: FileUploadEntry[];
}) {
  return (
    <Field className="w-full max-w-md" disabled={disabled} invalid={invalid}>
      <FieldLabel>Receipts</FieldLabel>
      <FileUpload
        accept=".pdf,.png,.jpg"
        maxSize={10 * MB}
        files={rows}
        disabled={disabled}
        onRemove={noop}
        onRetry={noop}
      >
        <FileDropzone />
        {rows.length > 0 && (
          <FileList aria-label="Attached receipts">
            {rows.map((row) => (
              <FileItem key={row.id} file={row} />
            ))}
          </FileList>
        )}
      </FileUpload>
      <FieldDescription>PDF, PNG or JPG, up to 10 MB each.</FieldDescription>
      <FieldError>Attach at least one receipt for expenses over €25.</FieldError>
    </Field>
  );
}

function Photo({ disabled = false, invalid = false }: { disabled?: boolean; invalid?: boolean }) {
  return (
    <Field className="w-56" disabled={disabled} invalid={invalid}>
      <FieldLabel>Profile photo</FieldLabel>
      <FileUpload accept="image/png,image/jpeg" maxSize={2 * MB} multiple={false}>
        <FileUploadTrigger>Upload photo</FileUploadTrigger>
      </FileUpload>
      <FieldDescription>PNG or JPG, up to 2 MB.</FieldDescription>
      <FieldError>photo.heic is not an accepted type (PNG, JPG).</FieldError>
    </Field>
  );
}

/** Dropzone, compact trigger, rows in every status and the bare progress bar. */
export function FileUploadSection() {
  return (
    <Section
      title="File upload"
      note="A dropzone for documents, a compact trigger for one avatar or attachment. The app owns the upload; rows show its status in words. Drag-over is shot live."
    >
      <Row label="Dropzone">
        <Receipts />
      </Row>
      <Row label="With files">
        <Receipts rows={ROWS} />
      </Row>
      <Row label="Invalid">
        <Receipts invalid />
      </Row>
      <Row label="Disabled">
        <Receipts disabled />
      </Row>
      <Row label="Compact trigger">
        <Photo />
        <Photo invalid />
        <Photo disabled />
      </Row>
      <Row label="Single attachment">
        <div className="w-full max-w-md">
          <FileList aria-label="Attachment">
            <FileItem file={DONE} onRemove={noop} />
          </FileList>
        </div>
      </Row>
      <Row label="Progress bar">
        <div className="flex w-64 flex-col gap-3">
          <FileProgress value={0} aria-label="Upload not started" />
          <FileProgress value={42} aria-label="Upload 42 percent" />
          <FileProgress value={100} aria-label="Upload complete" />
        </div>
      </Row>
    </Section>
  );
}
