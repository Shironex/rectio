import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';

import type { FileUploadEntry } from './file-validation';

/** What the app's upload function is handed for one file. */
export interface FileUploadTask {
  /** Report progress from 0 to 100. Calls after the upload was removed are ignored. */
  onProgress: (percent: number) => void;
  /** Aborts when the user removes the file or the component unmounts. Pass it to `fetch`. */
  signal: AbortSignal;
}

export interface UseFileUploadOptions {
  /**
   * Sends one file. Resolve when the server has it; reject with an Error whose message the user
   * can act on ("The server refused files over 10 MB"). Without it, files stay queued and the app
   * moves them along with `updateFile`.
   */
  upload?: (file: File, task: FileUploadTask) => Promise<void>;
  /** False keeps one file: a new one replaces the last, as for an avatar. */
  multiple?: boolean;
  /** Entries already uploaded, such as attachments saved with the record. */
  initialFiles?: FileUploadEntry[];
}

const clamp = (value: number) => Math.min(100, Math.max(0, value));

/**
 * Local state for FileUpload: a list of entries, an upload per file when `upload` is given, and the
 * callbacks to spread on the root. The component itself never sends anything; this hook only calls
 * the function the app passes.
 *
 * ```tsx
 * const upload = useFileUpload({ upload: (file, { onProgress, signal }) => send(file, onProgress, signal) });
 * <FileUpload {...upload.rootProps} accept=".pdf" maxSize={10 * 1024 * 1024}>...</FileUpload>
 * ```
 */
export function useFileUpload({
  upload,
  multiple = true,
  initialFiles = [],
}: UseFileUploadOptions = {}) {
  const [files, setFiles] = useState<FileUploadEntry[]>(initialFiles);
  const prefix = useId();
  const counter = useRef(0);
  const controllers = useRef(new Map<string, AbortController>());
  // Read through a ref so an inline upload function does not change the callbacks' identity.
  const send = useRef(upload);
  useEffect(() => {
    send.current = upload;
  }, [upload]);

  const updateFile = useCallback((id: string, patch: Partial<FileUploadEntry>) => {
    setFiles((list) => list.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)));
  }, []);

  const abort = useCallback((id: string) => {
    controllers.current.get(id)?.abort();
    controllers.current.delete(id);
  }, []);

  const start = useCallback(
    (entry: FileUploadEntry) => {
      const run = send.current;
      if (run === undefined || entry.file === undefined) return;
      abort(entry.id);
      const controller = new AbortController();
      controllers.current.set(entry.id, controller);
      const { signal } = controller;
      updateFile(entry.id, { status: 'uploading', progress: 0, error: undefined });
      run(entry.file, {
        signal,
        onProgress: (percent) => {
          if (!signal.aborted) updateFile(entry.id, { progress: clamp(percent) });
        },
      }).then(
        () => {
          if (signal.aborted) return;
          controllers.current.delete(entry.id);
          updateFile(entry.id, { status: 'done', progress: 100 });
        },
        (reason: unknown) => {
          if (signal.aborted) return;
          controllers.current.delete(entry.id);
          updateFile(entry.id, {
            status: 'error',
            error: reason instanceof Error ? reason.message : undefined,
          });
        },
      );
    },
    [abort, updateFile],
  );

  const addFiles = useCallback(
    (added: readonly File[]) => {
      const entries = added.map<FileUploadEntry>((file) => {
        counter.current += 1;
        return {
          id: `${prefix}${String(counter.current)}`,
          name: file.name,
          size: file.size,
          type: file.type,
          status: 'queued',
          file,
        };
      });
      if (multiple) {
        setFiles((list) => [...list, ...entries]);
      } else {
        for (const id of controllers.current.keys()) abort(id);
        setFiles(entries.slice(0, 1));
      }
      for (const entry of multiple ? entries : entries.slice(0, 1)) start(entry);
      return entries;
    },
    [abort, multiple, prefix, start],
  );

  const removeFile = useCallback(
    (entry: FileUploadEntry | string) => {
      const id = typeof entry === 'string' ? entry : entry.id;
      abort(id);
      setFiles((list) => list.filter((item) => item.id !== id));
    },
    [abort],
  );

  const retryFile = useCallback(
    (entry: FileUploadEntry | string) => {
      const id = typeof entry === 'string' ? entry : entry.id;
      const found = files.find((item) => item.id === id);
      if (found !== undefined) start(found);
    },
    [files, start],
  );

  const clear = useCallback(() => {
    for (const id of controllers.current.keys()) abort(id);
    setFiles([]);
  }, [abort]);

  useEffect(() => {
    const running = controllers.current;
    return () => {
      for (const controller of running.values()) controller.abort();
      running.clear();
    };
  }, []);

  const rootProps = useMemo(
    () => ({ files, multiple, onFilesAdded: addFiles, onRemove: removeFile, onRetry: retryFile }),
    [files, multiple, addFiles, removeFile, retryFile],
  );

  return { files, addFiles, removeFile, retryFile, updateFile, clear, rootProps };
}
