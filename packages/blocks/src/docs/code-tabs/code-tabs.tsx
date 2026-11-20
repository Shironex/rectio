import { Tabs, TabsPanel, TabsTab, cn } from '@rectio/ui';
import type { ReactNode } from 'react';

import { mergeMessages } from '../lib/messages';
import { CodeBlock } from '../code-block/code-block';
import type { CodeLine } from '../code-block/code-block.logic';
import { useDocsParts } from '../lib/parts';
import {
  PACKAGE_MANAGERS,
  toPackageManager,
  usePersistentChoice,
  type PackageManager,
} from './code-tabs.logic';

export interface CodeTab {
  /** The tab's label, such as a file name or a language. */
  label: string;
  /** Stable value for the remembered choice. Defaults to the label. */
  value?: string | undefined;
  code?: string | undefined;
  tokens?: readonly CodeLine[] | undefined;
  lang?: string | undefined;
  highlight?: readonly number[] | string | undefined;
  lineNumbers?: boolean | undefined;
  /** A small icon before the label. */
  icon?: ReactNode;
}

export interface CodeTabsProps {
  items: readonly CodeTab[];
  /**
   * Remembers the reader's pick across pages, and keeps every tab set with the same key on the
   * same tab, such as every TypeScript and JavaScript pair on the site.
   */
  storageKey?: string | undefined;
  /** The tab shown before the reader picks one. Default the first. */
  defaultValue?: string | undefined;
  /** Accessible name of the tab list, such as "Language". */
  label?: string | undefined;
  /** Something at the end of the tab row, such as a caption. */
  aside?: ReactNode;
  /** The block's words; pass the keys you change. See `CODE_TABS_MESSAGES`. */
  messages?: Partial<CodeTabsMessages> | undefined;
  className?: string | undefined;
}

export interface CodeTabsMessages {
  /** Accessible name of the tab list. */
  label: string;
}

export const CODE_TABS_MESSAGES: CodeTabsMessages = { label: 'Code examples' };

/**
 * The same example in several forms (languages, frameworks, files) as tabs over one code frame.
 * With a `storageKey` the reader's choice sticks across pages and every matching set follows it.
 */
export function CodeTabs({
  items,
  storageKey,
  defaultValue,
  label,
  aside,
  messages,
  className,
}: CodeTabsProps) {
  const m = mergeMessages(CODE_TABS_MESSAGES, messages);
  const { TabsList } = useDocsParts();
  const values = items.map((item) => item.value ?? item.label);
  const [value, setValue] = usePersistentChoice(
    storageKey,
    values,
    defaultValue ?? values[0] ?? '',
  );
  return (
    <Tabs
      value={value}
      onValueChange={(next) => {
        setValue(String(next));
      }}
      data-slot="code-tabs"
      className={cn(
        'min-w-0 overflow-hidden rounded-panel border border-line bg-code-background',
        className,
      )}
    >
      <div className="flex items-end gap-2 border-b border-line ps-2 pe-3">
        <TabsList aria-label={label ?? m.label} className="min-w-0 flex-1 border-b-0">
          {items.map((item, index) => (
            <TabsTab key={values[index]} value={values[index]} className="font-mono">
              {item.icon}
              {item.label}
            </TabsTab>
          ))}
        </TabsList>
        {aside !== undefined && (
          <div className="flex h-(--rx-tabs-height) shrink-0 items-center text-xs text-fg-muted">
            {aside}
          </div>
        )}
      </div>
      {items.map((item, index) => (
        <TabsPanel
          key={values[index]}
          value={values[index]}
          className="pt-0 focus-visible:rounded-none focus-visible:-outline-offset-2"
        >
          <CodeBlock
            framed={false}
            code={item.code}
            tokens={item.tokens}
            lang={item.lang}
            highlight={item.highlight}
            lineNumbers={item.lineNumbers}
          />
        </TabsPanel>
      ))}
    </Tabs>
  );
}

export interface InstallTabsProps {
  /**
   * The command in npm's words, such as `npm install @halyard/core` or `npx halyard init`. The
   * other package managers' commands are written from it.
   */
  command: string;
  /** Which managers to offer, in order. Default npm, pnpm, yarn and bun. */
  managers?: readonly PackageManager[] | undefined;
  /** Shared by every install block, so the reader picks their package manager once. */
  storageKey?: string | undefined;
  label?: string | undefined;
  /** The block's words; pass the keys you change. See `INSTALL_TABS_MESSAGES`. */
  messages?: Partial<InstallTabsMessages> | undefined;
  className?: string | undefined;
}

export interface InstallTabsMessages {
  /** Accessible name of the tab list. */
  label: string;
}

export const INSTALL_TABS_MESSAGES: InstallTabsMessages = { label: 'Package manager' };

/**
 * Package manager tabs: one npm command shown as npm, pnpm, yarn and bun. The reader's pick is
 * remembered across pages and every install block on the site follows it.
 */
export function InstallTabs({
  command,
  managers = PACKAGE_MANAGERS,
  storageKey = 'rectio-docs-package-manager',
  label,
  messages,
  className,
}: InstallTabsProps) {
  const m = mergeMessages(INSTALL_TABS_MESSAGES, messages);
  return (
    <CodeTabs
      label={label ?? m.label}
      storageKey={storageKey}
      className={className}
      items={managers.map((pm) => ({
        label: pm,
        value: pm,
        lang: 'sh',
        code: toPackageManager(command, pm),
      }))}
    />
  );
}
