'use client';

import { PromptInput, type FileUploadEntry } from '@rectio/ui';
import { useEffect, useRef, useState } from 'react';

/** Enter sends, Shift Enter adds a line; Send turns into Stop while the fake reply streams. */
export default function PromptInputDemo() {
  const [status, setStatus] = useState<'idle' | 'streaming'>('idle');
  const [files, setFiles] = useState<FileUploadEntry[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(
    () => () => {
      clearTimeout(timer.current);
    },
    [],
  );
  return (
    <div className="w-full max-w-xl">
      <PromptInput
        status={status}
        maxLength={500}
        attachments={files}
        onAttach={(added) => {
          setFiles((all) => [
            ...all,
            ...added.map((file) => ({
              id: `${file.name}-${String(file.size)}`,
              name: file.name,
              size: file.size,
              status: 'done' as const,
            })),
          ]);
        }}
        onRemoveAttachment={(file) => {
          setFiles((all) => all.filter((f) => f.id !== file.id));
        }}
        onSubmit={() => {
          setFiles([]);
          setStatus('streaming');
          timer.current = setTimeout(() => {
            setStatus('idle');
          }, 2500);
        }}
        onStop={() => {
          clearTimeout(timer.current);
          setStatus('idle');
        }}
        hint="Check figures before you send them on."
      />
    </div>
  );
}
