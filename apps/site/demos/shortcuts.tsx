'use client';

import { Kbd, KbdShortcut } from '@rectio/ui';

const SHORTCUTS = [
  { action: 'New invoice', shortcut: 'mod+shift+i' },
  { action: 'Search pages and actions', shortcut: 'mod+k' },
  { action: 'Fold the sidebar', shortcut: 'mod+b' },
] as const;

export default function ShortcutsDemo() {
  return (
    <dl className="flex w-full max-w-sm flex-col gap-2 text-sm">
      {SHORTCUTS.map(({ action, shortcut }) => (
        <div key={action} className="flex items-center justify-between gap-6">
          <dt className="text-fg-muted">{action}</dt>
          <dd>
            <KbdShortcut shortcut={shortcut} />
          </dd>
        </div>
      ))}
      <div className="flex items-center justify-between gap-6">
        <dt className="text-fg-muted">Go to payables</dt>
        <dd className="flex items-center gap-1 text-fg-subtle">
          <Kbd>G</Kbd>
          then
          <Kbd>P</Kbd>
        </dd>
      </div>
    </dl>
  );
}
