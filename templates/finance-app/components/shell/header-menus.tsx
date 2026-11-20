'use client';

import {
  BellIcon,
  GearSixIcon,
  KeyboardIcon,
  MoonIcon,
  PaletteIcon,
  SignOutIcon,
  SunIcon,
  UserCircleIcon,
} from '@phosphor-icons/react';
import {
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
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
  initials,
} from '@rectio/ui';
import Link from 'next/link';
import { useState } from 'react';

import { CURRENT_USER } from '@/data/company';
import { NOTIFICATIONS } from '@/data/notifications';
import { MODES, type ModeId } from '../appearance-script';
import { setAppearance, useAppearance } from '../use-appearance';
import { icon } from './icon';

/** The bell: a dot on the trigger while something is unread, a short list, and the way to it. */
export function Notifications() {
  const [read, setRead] = useState(false);
  const unread = read ? 0 : NOTIFICATIONS.filter((n) => n.unread).length;
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            iconOnly
            aria-label={unread === 0 ? 'Notifications' : `Notifications, ${String(unread)} new`}
            className="relative"
          >
            {icon(BellIcon)}
            {unread > 0 && (
              <span
                aria-hidden
                className="absolute end-2 top-2 size-2 rounded-full bg-accent ring-2 ring-surface-canvas"
              />
            )}
          </Button>
        }
      />
      <PopoverContent align="end" className="w-88 max-w-(--available-width) p-0">
        <div className="flex items-baseline justify-between gap-4 px-4 pt-3 pb-2">
          <PopoverTitle>Notifications</PopoverTitle>
          <button
            type="button"
            aria-disabled={unread === 0}
            onClick={() => {
              setRead(true);
            }}
            className="cursor-pointer rounded-control text-sm text-accent-strong pointer-coarse:py-3 hover:underline focus-visible:outline-2 focus-visible:outline-focus aria-disabled:cursor-default aria-disabled:text-fg-disabled aria-disabled:no-underline"
          >
            Mark all read
          </button>
        </div>
        <ul className="flex flex-col border-t border-line">
          {NOTIFICATIONS.map((n) => {
            const isNew = n.unread && !read;
            return (
              <li key={n.id} className="not-last:border-b not-last:border-line">
                <Link
                  href={n.href}
                  className="flex gap-3 px-4 py-3 hover:bg-surface-hover focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus"
                >
                  <span
                    aria-hidden
                    className={`mt-1.5 size-2 shrink-0 rounded-full ${isNew ? 'bg-accent' : 'bg-transparent'}`}
                  />
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="text-sm font-medium text-fg">
                      {isNew && <span className="sr-only">New: </span>}
                      {n.title}
                    </span>
                    <span className="text-sm text-fg-muted">{n.detail}</span>
                    <span className="text-xs text-fg-subtle">{n.time}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

function AppearanceRadios() {
  const { mode } = useAppearance();
  return (
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
  );
}

/** The small appearance control in the header: the mode in one menu. */
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
  const { mode } = useAppearance();
  const summary = MODES.find((m) => m.value === mode)?.label ?? '';
  return (
    <Menu>
      <MenuTrigger
        render={
          <Button variant="ghost" iconOnly aria-label={`Account, ${CURRENT_USER.name}`}>
            <span
              aria-hidden
              className="flex size-7 items-center justify-center rounded-full bg-accent-subtle text-xs font-strong text-accent-strong"
            >
              {initials(CURRENT_USER.name)}
            </span>
          </Button>
        }
      />
      <MenuContent align="end" className="min-w-60">
        <div className="flex flex-col px-3 pt-2 pb-2.5">
          <span className="text-sm font-medium text-fg">{CURRENT_USER.name}</span>
          <span className="text-sm text-fg-muted">{CURRENT_USER.email}</span>
        </div>
        <MenuSeparator />
        <MenuLinkItem icon={icon(UserCircleIcon)} render={<Link href="/settings#team" />}>
          Profile
        </MenuLinkItem>
        <MenuLinkItem icon={icon(GearSixIcon)} render={<Link href="/settings" />}>
          Settings
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
        <MenuSeparator />
        <MenuLinkItem icon={icon(SignOutIcon)} render={<Link href="/sign-in" />}>
          Sign out
        </MenuLinkItem>
      </MenuContent>
    </Menu>
  );
}
