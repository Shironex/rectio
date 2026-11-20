'use client';

import { MoonIcon, PaletteIcon, SunIcon } from '@phosphor-icons/react';
import {
  Button,
  Menu,
  MenuContent,
  MenuGroup,
  MenuRadioGroup,
  MenuRadioItem,
  MenuTrigger,
} from '@rectio/ui';

import { MODES, type ModeId } from './appearance-script';
import { setAppearance, useAppearance } from './use-appearance';

/** The mode (system, light or dark) in one small menu. */
export function ThemeMenu() {
  const { mode } = useAppearance();
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
