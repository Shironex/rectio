import type { ReactNode } from 'react';

/**
 * What a block shows with no data: a short title and the next step, in place of an empty chart or
 * a table of zeros, so a first day reads as a starting point rather than a broken screen.
 */
export function EmptyNote({ title, children }: { title: ReactNode; children?: ReactNode }) {
  return (
    <div
      role="status"
      className="flex flex-col items-center gap-1 rounded-control border border-dashed border-line px-4 py-10 text-center text-sm text-fg-muted"
    >
      <p className="font-medium text-fg">{title}</p>
      {children !== undefined && <p>{children}</p>}
    </div>
  );
}
