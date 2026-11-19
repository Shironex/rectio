'use client';

import { DesktopIcon, MoonIcon, SunIcon } from '@phosphor-icons/react';
import { ToggleGroup } from '@rectio/motion';
import { Toggle } from '@rectio/ui';

import { MODES, setThemeChoice, THEMES, useThemeChoice, type ModePreference } from '@/lib/theme';

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

/** The theme and colour mode for the whole site, remembered for the next visit. */
export function ThemeSwitch() {
  const choice = useThemeChoice();
  return (
    <div className="flex flex-wrap items-center gap-2">
      <ToggleGroup
        size="md"
        aria-label="Theme"
        value={[choice.theme]}
        onValueChange={(value) => {
          const theme = THEMES.find((t) => t.id === value[0]);
          if (theme !== undefined) setThemeChoice({ ...choice, theme: theme.id });
        }}
      >
        {THEMES.map((theme) => (
          <Toggle key={theme.id} value={theme.id}>
            {theme.label}
          </Toggle>
        ))}
      </ToggleGroup>
      <ToggleGroup
        size="md"
        aria-label="Colour mode"
        value={[choice.mode]}
        onValueChange={(value) => {
          const mode = MODES.find((m) => m === value[0]);
          if (mode !== undefined) setThemeChoice({ ...choice, mode });
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
    </div>
  );
}
