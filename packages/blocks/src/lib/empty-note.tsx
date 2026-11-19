import { TrayIcon, type Icon } from '@phosphor-icons/react';
import { EmptyState } from '@rectio/ui';
import type { ReactNode } from 'react';

/**
 * What a block shows with no data: a short title, the next step and, when given, the action that
 * takes it (such as a Create invoice button), in place of an empty chart or a table of zeros, so a
 * first day reads as a starting point rather than a broken screen. The small dashed EmptyState,
 * announced as a status because it replaces content that was loading.
 */
export function EmptyNote({
  title,
  action,
  icon: NoteIcon = TrayIcon,
  children,
}: {
  title: ReactNode;
  /** The first step, such as a button that creates the first record. */
  action?: ReactNode;
  /** A quiet glyph above the title, for the kind of record that is missing. */
  icon?: Icon;
  children?: ReactNode;
}) {
  return (
    <EmptyState
      role="status"
      size="sm"
      variant="dashed"
      className="py-10"
      icon={<NoteIcon aria-hidden weight="duotone" />}
      title={title}
      description={children}
      actions={action ?? undefined}
    />
  );
}
