import { CaretUpDownIcon, CheckIcon, GlobeSimpleIcon } from '@phosphor-icons/react';
import { Menu, MenuContent, MenuLinkItem, MenuTrigger, cn } from '@rectio/ui';
import type { ReactNode } from 'react';

import { mergeMessages } from '../lib/messages';

export interface DocsVersion {
  /** Unique, such as "2.x". */
  value: string;
  /** As shown, such as "v2.4". */
  label: string;
  /** Where that version's docs live. */
  href: string;
  /** A word after the label, such as "Latest" or "Legacy". */
  note?: string | undefined;
}

export interface DocsLanguage {
  /** A BCP 47 tag, such as "de" or "pt-BR". */
  value: string;
  /** The language's own name, such as "Deutsch". */
  label: string;
  href: string;
}

const TRIGGER = cn(
  'relative inline-flex h-(--rx-button-height-sm) cursor-pointer items-center gap-1.5 rounded-control px-2 text-sm font-medium text-fg-muted',
  'transition-colors duration-fast ease-standard pointer-fine:hover:bg-surface-hover pointer-fine:hover:text-fg',
  'data-popup-open:bg-surface-hover data-popup-open:text-fg',
  'outline-offset-2 focus-visible:outline-2 focus-visible:outline-focus',
  'pointer-coarse:h-(--rx-button-height-touch)',
);

function Choices<T extends { value: string; label: string; href: string }>({
  items,
  current,
  note,
  lang,
}: {
  items: readonly T[];
  current: string;
  note?: (item: T) => ReactNode;
  lang?: boolean;
}) {
  return items.map((item) => {
    const active = item.value === current;
    return (
      <MenuLinkItem
        key={item.value}
        href={item.href}
        aria-current={active ? 'page' : undefined}
        lang={lang === true ? item.value : undefined}
        hrefLang={lang === true ? item.value : undefined}
        hint={note?.(item)}
        icon={active ? <CheckIcon weight="bold" className="text-accent-strong" /> : <span />}
      >
        {item.label}
      </MenuLinkItem>
    );
  });
}

export interface VersionSwitcherProps {
  versions: readonly DocsVersion[];
  /** The `value` of the version being read. */
  current: string;
  /** Accessible name prefix of the button. Default "Version". */
  label?: string;
  /** The block's words; pass the keys you change. See `VERSION_SWITCHER_MESSAGES`. */
  messages?: Partial<VersionSwitcherMessages>;
  className?: string;
}

export interface VersionSwitcherMessages {
  /** Accessible name of the button, given the version shown: "Version: v2.4". */
  button: (version: string) => string;
}

export const VERSION_SWITCHER_MESSAGES: VersionSwitcherMessages = {
  button: (version) => `Version: ${version}`,
};

/** Which version of the docs is shown, and links to the others. */
export function VersionSwitcher({
  versions,
  current,
  label,
  messages,
  className,
}: VersionSwitcherProps) {
  const m = mergeMessages(VERSION_SWITCHER_MESSAGES, messages);
  const active = versions.find((version) => version.value === current);
  return (
    <Menu>
      <MenuTrigger
        aria-label={
          label === undefined
            ? m.button(active?.label ?? current)
            : `${label}: ${active?.label ?? current}`
        }
        data-slot="version-switcher"
        className={cn(TRIGGER, 'font-mono', className)}
      >
        {active?.label ?? current}
        <CaretUpDownIcon aria-hidden weight="bold" className="size-3.5 text-fg-subtle" />
      </MenuTrigger>
      <MenuContent align="start">
        <Choices items={versions} current={current} note={(version) => version.note} />
      </MenuContent>
    </Menu>
  );
}

export interface LanguageSwitcherProps {
  languages: readonly DocsLanguage[];
  /** The `value` of the language being read. */
  current: string;
  label?: string;
  /** Show only the globe on narrow headers. Default false. */
  compact?: boolean;
  /** The block's words; pass the keys you change. See `LANGUAGE_SWITCHER_MESSAGES`. */
  messages?: Partial<LanguageSwitcherMessages>;
  className?: string;
}

export interface LanguageSwitcherMessages {
  /** Accessible name of the button, given the language shown: "Language: Deutsch". */
  button: (language: string) => string;
}

export const LANGUAGE_SWITCHER_MESSAGES: LanguageSwitcherMessages = {
  button: (language) => `Language: ${language}`,
};

/**
 * The language of the docs. Each choice is written in its own language and marked with its
 * language tag, so a screen reader pronounces it correctly.
 */
export function LanguageSwitcher({
  languages,
  current,
  label,
  compact = false,
  messages,
  className,
}: LanguageSwitcherProps) {
  const m = mergeMessages(LANGUAGE_SWITCHER_MESSAGES, messages);
  const active = languages.find((language) => language.value === current);
  return (
    <Menu>
      <MenuTrigger
        aria-label={
          label === undefined
            ? m.button(active?.label ?? current)
            : `${label}: ${active?.label ?? current}`
        }
        data-slot="language-switcher"
        className={cn(TRIGGER, className)}
      >
        <GlobeSimpleIcon aria-hidden weight="bold" className="size-4" />
        {!compact && <span>{active?.label ?? current}</span>}
        {!compact && (
          <CaretUpDownIcon aria-hidden weight="bold" className="size-3.5 text-fg-subtle" />
        )}
      </MenuTrigger>
      <MenuContent align="end">
        <Choices items={languages} current={current} lang />
      </MenuContent>
    </Menu>
  );
}
