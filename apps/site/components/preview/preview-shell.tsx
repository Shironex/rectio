'use client';

import { Tabs } from '@base-ui/react/tabs';
import { LockSimpleIcon } from '@phosphor-icons/react';
import { ThemeScope, cn } from '@rectio/ui';
import { useState, type ReactNode } from 'react';

import { MODES, THEMES, type Mode, type ThemeId } from '@/lib/site';
import { useSiteTheme } from '@/lib/use-site-theme';

import { ProBadge } from '../pro-badge';
import { Segmented } from '../segmented';

type Variant = 'plain' | 'motion';

const TAB =
  'h-8 cursor-pointer border-b-2 border-transparent px-1 text-sm font-medium text-fg-muted transition-colors duration-fast ease-standard pointer-fine:hover:text-fg data-active:border-accent data-active:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus';

/**
 * A live preview with its code. The preview sits in its own theme scope, so its theme and mode
 * switch without touching the page; it starts on the page's own.
 */
export function PreviewShell({
  plain,
  motion,
  code,
  importLine,
  align = 'center',
}: {
  plain: ReactNode;
  /** The motion add-on's variant, when the component has one. Rendered live; its source is Pro. */
  motion?: ReactNode;
  code: ReactNode;
  /** How the motion variant is imported, shown in place of its source. */
  importLine?: string | undefined;
  align?: 'center' | 'start' | undefined;
}) {
  const site = useSiteTheme();
  const [theme, setTheme] = useState<ThemeId | null>(null);
  const [mode, setMode] = useState<Mode | null>(null);
  const [variant, setVariant] = useState<Variant>('plain');
  const shownTheme = theme ?? site.theme;
  const shownMode = mode ?? site.mode;
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
          label="Preview theme"
          value={shownTheme}
          onChange={setTheme}
          options={THEMES.map((t) => ({ value: t.id, label: t.name }))}
        />
        <Segmented
          label="Preview mode"
          value={shownMode}
          onChange={setMode}
          options={MODES.map((m) => ({ value: m, label: m === 'light' ? 'Light' : 'Dark' }))}
        />
      </div>
      <Tabs.Panel value="preview" keepMounted>
        <ThemeScope
          theme={shownTheme}
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
        {isMotion ? <LockedSource importLine={importLine} /> : code}
      </Tabs.Panel>
    </Tabs.Root>
  );
}

function LockedSource({ importLine }: { importLine: string | undefined }) {
  return (
    <div className="flex flex-col gap-3 p-6">
      <p className="flex items-center gap-2 text-sm font-medium text-fg">
        <LockSimpleIcon aria-hidden weight="bold" className="size-4 text-fg-muted" />
        The motion variant is part of rectio Pro
        <ProBadge />
      </p>
      <p className="max-w-prose text-sm text-fg-muted">
        The preview is the real component. Its source comes with a Pro license and is not shown
        here; the usage is the same as the plain example, from another import path.
      </p>
      {importLine !== undefined && (
        <code className="w-fit rounded-control border border-line bg-surface-sunken px-2 py-1 font-mono text-sm text-fg">
          {importLine}
        </code>
      )}
    </div>
  );
}
