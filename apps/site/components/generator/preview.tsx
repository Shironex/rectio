'use client';

import { MoonIcon, SunIcon } from '@phosphor-icons/react';
import { Tabs, TabsList, TabsPanel, TabsTab, ThemeScope, cn } from '@rectio/ui';
import { useState } from 'react';

import { Segmented } from '@/components/segmented';

import { PREVIEW_ID } from './model';
import { OverlaysScreen } from './preview-overlays';
import { DashboardScreen, FinanceScreen, FormsScreen } from './preview-screens';

export type PreviewMode = 'light' | 'dark';

const SCREENS = [
  { value: 'dashboard', label: 'Dashboard' },
  { value: 'forms', label: 'Forms' },
  { value: 'overlays', label: 'Overlays' },
  { value: 'finance', label: 'Finance' },
] as const;

const MODE_OPTIONS = [
  {
    value: 'light',
    label: (
      <>
        <SunIcon aria-hidden weight="bold" className="size-3.5" />
        Light
      </>
    ),
  },
  {
    value: 'dark',
    label: (
      <>
        <MoonIcon aria-hidden weight="bold" className="size-3.5" />
        Dark
      </>
    ),
  },
] as const;

/**
 * Real kit screens under the generated theme. The theme arrives as scoped CSS for one data-theme
 * id, so only this container changes: the page around it keeps the site theme. The screens never
 * re-render on a theme change; only the style element does.
 */
export function Preview({
  css,
  mode,
  onModeChange,
  stale,
}: {
  css: string;
  mode: PreviewMode;
  onModeChange: (mode: PreviewMode) => void;
  /** The newest inputs are still resolving. */
  stale: boolean;
}) {
  const [screen, setScreen] = useState<string>('dashboard');
  return (
    <Tabs
      value={screen}
      onValueChange={(value) => {
        setScreen(value as string);
      }}
      className="flex min-w-0 flex-col gap-3"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <TabsList aria-label="Preview screen" className="min-w-0">
          {SCREENS.map((s) => (
            <TabsTab key={s.value} value={s.value}>
              {s.label}
            </TabsTab>
          ))}
        </TabsList>
        <div className="flex items-center gap-2">
          <span aria-hidden className="text-sm text-fg-muted">
            Preview in
          </span>
          <Segmented
            label="Preview mode"
            value={mode}
            options={MODE_OPTIONS}
            onChange={onModeChange}
            touch
          />
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <ThemeScope
        theme={PREVIEW_ID}
        mode={mode}
        aria-label={`Preview of the theme, ${mode} mode`}
        role="region"
        aria-busy={stale}
        className={cn(
          'min-w-0 overflow-x-auto rounded-panel border border-line-strong',
          'outline-offset-2 focus-visible:outline-2 focus-visible:outline-focus',
        )}
      >
        <TabsPanel value="dashboard">
          <DashboardScreen />
        </TabsPanel>
        <TabsPanel value="forms">
          <FormsScreen />
        </TabsPanel>
        <TabsPanel value="overlays">
          <OverlaysScreen mode={mode} />
        </TabsPanel>
        <TabsPanel value="finance">
          <FinanceScreen />
        </TabsPanel>
      </ThemeScope>
    </Tabs>
  );
}
