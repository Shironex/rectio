'use client';

import { THEMES } from '@/lib/site';
import { setSiteTheme, useSiteTheme } from '@/lib/use-site-theme';

import { Segmented } from './segmented';

/** Switches the whole site between the two shipped themes. */
export function ThemeSwitch({ size = 'sm' }: { size?: 'sm' | 'md' }) {
  const { theme } = useSiteTheme();
  return (
    <Segmented
      label="Site theme"
      size={size}
      value={theme}
      options={THEMES.map((t) => ({ value: t.id, label: t.name }))}
      onChange={(next, origin) => {
        setSiteTheme(next, origin);
      }}
    />
  );
}
