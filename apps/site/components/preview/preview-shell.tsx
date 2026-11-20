'use client';

import { Tabs } from '@base-ui/react/tabs';
import { ThemeScope, cn } from '@rectio/ui';
import { useState, type ReactNode } from 'react';

import { MODES, type Mode } from '@/lib/site';
import { useSiteMode } from '@/lib/use-site-mode';

import { Segmented } from '../segmented';

type Variant = 'plain' | 'motion';

const TAB =
  'h-8 cursor-pointer border-b-2 border-transparent px-1 text-sm font-medium text-fg-muted transition-colors duration-fast ease-standard pointer-fine:hover:text-fg data-active:border-accent data-active:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus';

/**
 * A live preview with its code. The preview sits in its own theme scope, so its mode switches
 * without touching the page; it starts on the page's own.
 */
export function PreviewShell({
  plain,
  motion,
  code,
  motionCode,
  importLine,
  align = 'center',
}: {
  plain: ReactNode;
  /** The motion add-on's variant, when the component has one. Rendered live. */
  motion?: ReactNode;
  code: ReactNode;
  /** The motion variant's demo code, shown in the Code tab while the variant is on. */
  motionCode?: ReactNode;
  /** How the motion variant is imported, shown when it has no demo code of its own. */
  importLine?: string | undefined;
  align?: 'center' | 'start' | undefined;
}) {
  const siteMode = useSiteMode();
  const [mode, setMode] = useState<Mode | null>(null);
  const [variant, setVariant] = useState<Variant>('plain');
  const shownMode = mode ?? siteMode;
  const isMotion = variant === 'motion' && motion !== undefined;

  return (
    <Tabs.Root
      defaultValue="preview"
      className="not-prose my-6 overflow-hidden rounded-panel border border-line bg-surface"
    >
      {/* One wrapping row: on phones the switches fall to a second line instead of scrolling away. */}
      <div className="flex flex-wrap items-center gap-2 border-b border-line px-3 py-2">
        <Tabs.List aria-label="Preview or code" className="me-auto flex gap-4">
          <Tabs.Tab value="preview" className={TAB}>
            Preview
          </Tabs.Tab>
          <Tabs.Tab value="code" className={TAB}>
            Code
          </Tabs.Tab>
        </Tabs.List>
        {motion !== undefined && (
          <Segmented
            label="Variant"
            value={variant}
            onChange={setVariant}
            options={[
              { value: 'plain', label: 'Plain' },
              { value: 'motion', label: 'Motion' },
            ]}
          />
        )}
        <Segmented
          label="Preview mode"
          value={shownMode}
          onChange={setMode}
          options={MODES.map((m) => ({ value: m, label: m === 'light' ? 'Light' : 'Dark' }))}
        />
      </div>
      <Tabs.Panel value="preview" keepMounted>
        <ThemeScope
          mode={shownMode}
          className={cn(
            'flex min-h-44 flex-wrap gap-4 overflow-x-auto bg-surface-canvas p-4 text-fg *:max-w-full *:min-w-0 sm:p-8',
            align === 'center' ? 'items-center justify-center' : 'items-start',
          )}
        >
          {isMotion ? motion : plain}
        </ThemeScope>
      </Tabs.Panel>
      <Tabs.Panel value="code" className="max-h-128 overflow-auto">
        {isMotion ? (motionCode ?? <MotionImport importLine={importLine} />) : code}
      </Tabs.Panel>
    </Tabs.Root>
  );
}

/** A motion variant without a demo file of its own: the usage is the plain one, from another path. */
function MotionImport({ importLine }: { importLine: string | undefined }) {
  return (
    <div className="flex flex-col gap-3 p-6">
      <p className="max-w-prose text-sm text-fg-muted">
        The usage is the same as the plain example, from another import path.
      </p>
      {importLine !== undefined && (
        <code className="w-fit rounded-control border border-line bg-surface-sunken px-2 py-1 font-mono text-sm text-fg">
          {importLine}
        </code>
      )}
    </div>
  );
}
