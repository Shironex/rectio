'use client';

import { Kbd, KbdCombo } from '@rectio/ui';

export default function KbdDemo() {
  return (
    <div className="flex flex-col items-center gap-4 text-sm text-fg-muted">
      <span className="flex items-center gap-3">
        Search everything <KbdCombo keys={['⌘', 'K']} />
      </span>
      <span className="flex items-center gap-3">
        Approve selected <KbdCombo keys={['⇧', 'A']} separator="+" />
      </span>
      <span>
        Press <Kbd size="sm">Esc</Kbd> to close any panel.
      </span>
    </div>
  );
}
