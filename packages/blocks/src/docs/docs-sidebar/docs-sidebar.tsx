import { Collapsible } from '@base-ui/react/collapsible';
import { ArrowUpRightIcon, CaretRightIcon } from '@phosphor-icons/react';
import { cn } from '@rectio/ui';
import { useId, type ReactNode } from 'react';

import { DocsBadge, badgeFrom } from '../lib/badge';
import { isSamePage, trailTo, type DocsNavItem, type DocsNavSection } from '../lib/docs';
import { DocsLink, linkFocus } from '../lib/link';
import { useCloseNav } from '../lib/nav-context';

export interface DocsSidebarProps {
  sections: readonly DocsNavSection[];
  /** The current page's path: its link is marked `aria-current="page"` and its groups start open. */
  currentHref: string;
  /** Name of the navigation landmark. Default "Docs". */
  label?: string;
  /** Called after any link press, such as closing the phone sheet the sidebar sits in. */
  onNavigate?: (() => void) | undefined;
  /** Something above the tree, such as a version switcher. */
  header?: ReactNode;
  /** Something below the tree, such as a link to the changelog or a status note. */
  footer?: ReactNode;
  className?: string;
}

const ROW = cn(
  'group/row relative flex w-full min-h-8 items-center gap-2 px-2.5 py-1 text-start text-base text-fg-muted',
  'transition-colors duration-fast ease-standard pointer-fine:hover:bg-surface-hover pointer-fine:hover:text-fg',
  'pointer-coarse:min-h-(--rx-control-height-touch)',
  linkFocus,
);

const CURRENT =
  'aria-[current=page]:bg-(--rx-sidebar-item-active) aria-[current=page]:font-medium aria-[current=page]:text-accent-strong';

/**
 * The docs navigation: titled sections, nested pages that open and close, the current page marked,
 * and New or Beta badges. Groups on the path to the current page start open; every other group
 * keeps whatever the reader chose. Lay it in `DocsLayout`'s `sidebar`, which also shows it in a
 * sheet on phones.
 */
export function DocsSidebar({
  sections,
  currentHref,
  label = 'Docs',
  onNavigate,
  header,
  footer,
  className,
}: DocsSidebarProps) {
  const trail = new Set(trailTo(sections, currentHref));
  const closeNav = useCloseNav();
  const navigate = onNavigate ?? closeNav ?? undefined;
  return (
    <nav
      aria-label={label}
      data-slot="docs-sidebar"
      className={cn('flex flex-col gap-6', className)}
    >
      {header}
      {sections.map((section, index) => (
        <Section
          key={section.title ?? `section-${String(index)}`}
          section={section}
          currentHref={currentHref}
          trail={trail}
          onNavigate={navigate}
        />
      ))}
      {footer}
    </nav>
  );
}

function Section({
  section,
  currentHref,
  trail,
  onNavigate,
}: {
  section: DocsNavSection;
  currentHref: string;
  trail: Set<DocsNavItem>;
  onNavigate: (() => void) | undefined;
}) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1">
      {section.title !== undefined && (
        <h2
          id={id}
          className="px-2.5 pb-1.5 text-xs font-strong tracking-caps text-fg-muted uppercase"
        >
          {section.title}
        </h2>
      )}
      <Items
        items={section.items}
        currentHref={currentHref}
        trail={trail}
        onNavigate={onNavigate}
        labelledBy={section.title === undefined ? undefined : id}
      />
    </div>
  );
}

function Items({
  items,
  currentHref,
  trail,
  onNavigate,
  labelledBy,
  nested = false,
}: {
  items: readonly DocsNavItem[];
  currentHref: string;
  trail: Set<DocsNavItem>;
  onNavigate: (() => void) | undefined;
  labelledBy?: string | undefined;
  nested?: boolean;
}) {
  return (
    <ul
      aria-labelledby={labelledBy}
      className={cn('flex flex-col gap-px', nested && 'ms-3.5 mt-px border-s border-line ps-2')}
    >
      {items.map((item) => (
        <li key={`${item.title}-${item.href ?? ''}`}>
          {item.items === undefined || item.items.length === 0 ? (
            <PageLink item={item} currentHref={currentHref} onNavigate={onNavigate} />
          ) : (
            <Group item={item} currentHref={currentHref} trail={trail} onNavigate={onNavigate} />
          )}
        </li>
      ))}
    </ul>
  );
}

function Label({ item }: { item: DocsNavItem }) {
  const badge = badgeFrom(item.badge);
  return (
    <>
      <span className="min-w-0 flex-1 truncate">{item.title}</span>
      {badge !== null && <DocsBadge tone={badge.tone}>{badge.label}</DocsBadge>}
      {item.external === true && (
        <ArrowUpRightIcon aria-hidden weight="bold" className="size-3.5 shrink-0 text-fg-subtle" />
      )}
    </>
  );
}

function PageLink({
  item,
  currentHref,
  onNavigate,
}: {
  item: DocsNavItem;
  currentHref: string;
  onNavigate: (() => void) | undefined;
}) {
  if (item.href === undefined) {
    return (
      <span className={cn(ROW, 'text-fg-subtle')}>
        <Label item={item} />
      </span>
    );
  }
  const current = item.external !== true && isSamePage(item.href, currentHref);
  return (
    <DocsLink
      href={item.href}
      external={item.external}
      aria-current={current ? 'page' : undefined}
      onClick={onNavigate}
      className={cn(ROW, CURRENT)}
    >
      <Label item={item} />
      {item.external === true && <span className="sr-only">(opens in a new tab)</span>}
    </DocsLink>
  );
}

function Group({
  item,
  currentHref,
  trail,
  onNavigate,
}: {
  item: DocsNavItem;
  currentHref: string;
  trail: Set<DocsNavItem>;
  onNavigate: (() => void) | undefined;
}) {
  const caret = (
    <CaretRightIcon
      aria-hidden
      weight="bold"
      className={cn(
        'size-3 shrink-0 text-fg-subtle transition-transform duration-base ease-standard motion-reduce:transition-none',
        'group-data-panel-open/toggle:rotate-90 rtl:-scale-x-100',
      )}
    />
  );
  const current = item.href !== undefined && isSamePage(item.href, currentHref);
  return (
    <Collapsible.Root defaultOpen={trail.has(item)}>
      {item.href === undefined ? (
        <Collapsible.Trigger className={cn(ROW, 'group/toggle cursor-pointer')}>
          <Label item={item} />
          {caret}
        </Collapsible.Trigger>
      ) : (
        <div className="flex items-center gap-px">
          <DocsLink
            href={item.href}
            aria-current={current ? 'page' : undefined}
            onClick={onNavigate}
            className={cn(ROW, CURRENT, 'flex-1')}
          >
            <Label item={item} />
          </DocsLink>
          <Collapsible.Trigger
            aria-label={`${item.title} pages`}
            className={cn(
              'group/toggle inline-flex size-8 shrink-0 cursor-pointer items-center justify-center text-fg-subtle',
              'pointer-fine:hover:bg-surface-hover pointer-fine:hover:text-fg pointer-coarse:size-(--rx-control-height-touch)',
              linkFocus,
            )}
          >
            {caret}
          </Collapsible.Trigger>
        </div>
      )}
      <Collapsible.Panel
        className={cn(
          'transition-[opacity,translate] duration-base ease-enter',
          'data-starting-style:-translate-y-(--rx-motion-distance-shift) data-starting-style:opacity-0',
          'data-ending-style:opacity-0 data-ending-style:duration-fast data-ending-style:ease-exit',
        )}
      >
        <Items
          items={item.items ?? []}
          currentHref={currentHref}
          trail={trail}
          onNavigate={onNavigate}
          nested
        />
      </Collapsible.Panel>
    </Collapsible.Root>
  );
}
