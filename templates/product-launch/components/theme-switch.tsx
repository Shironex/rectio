'use client';

import { DesktopIcon, MoonIcon, SunIcon } from '@phosphor-icons/react';
import { ToggleGroup } from '@rectio/motion';
import { Toggle } from '@rectio/ui';

import { MODES, setThemeChoice, useThemeChoice, type ModePreference } from '@/lib/theme';

const MODE_ICON: Record<ModePreference, typeof SunIcon> = {
  system: DesktopIcon,
  light: SunIcon,
  dark: MoonIcon,
};

const MODE_LABEL: Record<ModePreference, string> = {
  system: 'Match system',
  light: 'Light',
  dark: 'Dark',
};

/** The colour mode for the whole site, remembered for the next visit. */
export function ThemeSwitch() {
  const choice = useThemeChoice();
  return (
    <ToggleGroup
      size="sm"
      aria-label="Colour mode"
      value={[choice.mode]}
      onValueChange={(value) => {
        const mode = MODES.find((m) => m === value[0]);
        if (mode !== undefined) setThemeChoice({ mode });
      }}
    >
      {MODES.map((mode) => {
        const Icon = MODE_ICON[mode];
        return (
          <Toggle key={mode} value={mode} iconOnly aria-label={MODE_LABEL[mode]}>
            <Icon aria-hidden weight="bold" className="size-4" />
          </Toggle>
        );
      })}
    </ToggleGroup>
  );
}
