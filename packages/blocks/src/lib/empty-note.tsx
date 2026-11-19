import { EmptyState } from '@rectio/ui';
import type { ReactNode } from 'react';

/**
 * What a block shows with no data: a short title and the next step, in place of an empty chart or
 * a table of zeros, so a first day reads as a starting point rather than a broken screen. The
 * small dashed EmptyState, announced as a status because it replaces content that was loading.
 */
export function EmptyNote({ title, children }: { title: ReactNode; children?: ReactNode }) {
  return (
    <EmptyState
      role="status"
      size="sm"
      variant="dashed"
      className="py-10"
      title={title}
      description={children}
    />
  );
}
