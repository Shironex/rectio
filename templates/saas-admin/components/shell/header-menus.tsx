'use client';

import {
  ChatCircleTextIcon,
  GearSixIcon,
  KeyboardIcon,
  MoonIcon,
  PaletteIcon,
  QuestionIcon,
  SignOutIcon,
  SparkleIcon,
  SunIcon,
  UserCircleIcon,
} from '@phosphor-icons/react';
import {
  Avatar,
  Button,
  Menu,
  MenuContent,
  MenuGroup,
  MenuItem,
  MenuLinkItem,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuSub,
  MenuSubContent,
  MenuSubTrigger,
  MenuTrigger,
  useToast,
} from '@rectio/ui';
import Link from 'next/link';

import { CURRENT_USER } from '@/data/workspace';
import { MODES, THEMES, type ModeId, type ThemeId } from '../appearance-script';
import { setAppearance, useAppearance } from '../use-appearance';
import { icon } from './icon';

function AppearanceRadios() {
  const { theme, mode } = useAppearance();
  return (
    <>
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
    </>
  );
}

/** The small appearance control in the header: theme and mode in one menu. */
export function AppearanceMenu({ className }: { className?: string }) {
  const { mode } = useAppearance();
  return (
    <Menu>
      <MenuTrigger
        render={
          <Button variant="ghost" iconOnly aria-label="Appearance" className={className ?? ''}>
            {icon(mode === 'dark' ? MoonIcon : mode === 'light' ? SunIcon : PaletteIcon)}
          </Button>
        }
      />
      <MenuContent align="end" className="min-w-48">
        <AppearanceRadios />
      </MenuContent>
    </Menu>
  );
}

/** The account: initials on the trigger, the profile, settings, appearance and sign out. */
export function AccountMenu({ onShowShortcuts }: { onShowShortcuts: () => void }) {
  const { theme, mode } = useAppearance();
  const toast = useToast();
  const summary = `${THEMES.find((t) => t.value === theme)?.label ?? ''}, ${MODES.find((m) => m.value === mode)?.label.toLowerCase() ?? ''}`;
  return (
    <Menu>
      <MenuTrigger
        render={
          <Button variant="ghost" iconOnly aria-label={`Account, ${CURRENT_USER.name}`}>
            <Avatar name={CURRENT_USER.name} size="md" aria-hidden />
          </Button>
        }
      />
      <MenuContent align="end" className="min-w-60">
        <div className="flex flex-col px-3 pt-2 pb-2.5">
          <span className="text-sm font-medium text-fg">{CURRENT_USER.name}</span>
          <span className="text-sm text-fg-muted">{CURRENT_USER.email}</span>
        </div>
        <MenuSeparator />
        <MenuLinkItem icon={icon(UserCircleIcon)} render={<Link href="/settings" />}>
          Profile
        </MenuLinkItem>
        <MenuLinkItem icon={icon(GearSixIcon)} render={<Link href="/settings/workspace" />}>
          Workspace settings
        </MenuLinkItem>
        <MenuSub>
          <MenuSubTrigger icon={icon(PaletteIcon)}>
            Appearance
            <span className="ms-2 truncate text-sm text-fg-subtle">{summary}</span>
          </MenuSubTrigger>
          <MenuSubContent className="min-w-44">
            <AppearanceRadios />
          </MenuSubContent>
        </MenuSub>
        <MenuItem icon={icon(KeyboardIcon)} onClick={onShowShortcuts}>
          Keyboard shortcuts
        </MenuItem>
        <MenuLinkItem icon={icon(SparkleIcon)} render={<Link href="/whats-new" />}>
          What’s new
        </MenuLinkItem>
        <MenuSeparator />
        <MenuItem
          icon={icon(QuestionIcon)}
          onClick={() => {
            toast.add({ title: 'Help center', description: 'Point this at your own guides.' });
          }}
        >
          Help center
        </MenuItem>
        <MenuItem
          icon={icon(ChatCircleTextIcon)}
          onClick={() => {
            toast.add({ title: 'Contact support', description: 'We reply within a business day.' });
          }}
        >
          Contact support
        </MenuItem>
        <MenuSeparator />
        <MenuLinkItem icon={icon(SignOutIcon)} render={<Link href="/sign-in" />}>
          Sign out
        </MenuLinkItem>
      </MenuContent>
    </Menu>
  );
}
