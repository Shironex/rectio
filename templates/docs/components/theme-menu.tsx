'use client';

import { MoonIcon, PaletteIcon, SunIcon } from '@phosphor-icons/react';
import {
  Button,
  Menu,
  MenuContent,
  MenuGroup,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuTrigger,
} from '@rectio/ui';

import { MODES, THEMES, type ModeId, type ThemeId } from './appearance-script';
import { setAppearance, useAppearance } from './use-appearance';

/** Theme (default or ledger) and mode (system, light or dark) in one small menu. */
export function ThemeMenu() {
  const { theme, mode } = useAppearance();
  const Icon = mode === 'dark' ? MoonIcon : mode === 'light' ? SunIcon : PaletteIcon;
  return (
    <Menu>
      <MenuTrigger
        render={
          <Button variant="ghost" iconOnly aria-label="Appearance">
            <Icon aria-hidden weight="bold" className="size-4" />
          </Button>
        }
      />
      <MenuContent align="end" className="min-w-48">
        <MenuGroup label="Theme">
          <MenuRadioGroup
            value={theme}
            onValueChange={(value: ThemeId) => {
              setAppearance({ theme: value });
            }}
          >
            {THEMES.map((t) => (
              <MenuRadioItem key={t.value} value={t.value} closeOnClick={false}>
                {t.label}
              </MenuRadioItem>
            ))}
          </MenuRadioGroup>
        </MenuGroup>
        <MenuSeparator />
        <MenuGroup label="Mode">
          <MenuRadioGroup
            value={mode}
            onValueChange={(value: ModeId) => {
              setAppearance({ mode: value });
            }}
          >
            {MODES.map((m) => (
              <MenuRadioItem key={m.value} value={m.value} closeOnClick={false}>
                {m.label}
              </MenuRadioItem>
            ))}
          </MenuRadioGroup>
        </MenuGroup>
      </MenuContent>
    </Menu>
  );
}
