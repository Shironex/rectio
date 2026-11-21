'use client';

import { CaretDownIcon, MagnifyingGlassIcon, MoonIcon, SunIcon } from '@phosphor-icons/react';
import { useSearchContext } from 'fumadocs-ui/contexts/search';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useId, useRef, useState, useSyncExternalStore } from 'react';

import { SITE_LINKS, type SiteLink } from '@/lib/layout.shared';
import { repoUrl } from '@/lib/site';

import { GithubMark } from './github-mark';
import { setSiteMode, useSiteMode } from '@/lib/use-site-mode';

/** Fumadocs' rule for an active link: the same path, or below it for a nested link. */
function isActive(link: SiteLink, pathname: string) {
  if (link.active === 'none') return false;
  const path = pathname.replace(/\/$/, '') || '/';
  return path === link.url || (link.active === 'nested-url' && path.startsWith(`${link.url}/`));
}

export function NavLink({
  link,
  className,
  onClick,
}: {
  link: SiteLink;
  className: string;
  onClick?: () => void;
}) {
  const active = isActive(link, usePathname());
  return (
    <Link
      href={link.url}
      data-active={active}
      aria-current={active ? 'page' : undefined}
      className={className}
      {...(onClick === undefined ? {} : { onClick })}
    >
      {link.text}
    </Link>
  );
}

/** Opens the site search: the wide field on desktop, an icon on smaller screens. */
export function SearchButton({ variant }: { variant: 'full' | 'icon' }) {
  const { setOpenSearch, hotKey, open } = useSearchContext();
  const common = {
    type: 'button' as const,
    'aria-haspopup': 'dialog' as const,
    'aria-expanded': open,
    onClick: () => {
      setOpenSearch(true);
    },
  };
  if (variant === 'icon')
    return (
      <button
        {...common}
        aria-label="Open Search"
        className="inline-flex items-center justify-center rounded-control p-2 text-sm font-medium transition-colors duration-fast hover:bg-fd-accent hover:text-fd-accent-foreground focus-visible:ring-2 focus-visible:ring-fd-ring focus-visible:outline-none [&_svg]:size-4.5"
      >
        <MagnifyingGlassIcon aria-hidden />
      </button>
    );
  return (
    <button
      {...common}
      className="inline-flex w-full max-w-60 items-center gap-2 rounded-full border bg-fd-secondary/50 p-1.5 ps-2.5 text-sm text-fd-muted-foreground transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground focus-visible:ring-2 focus-visible:ring-fd-ring focus-visible:outline-none"
    >
      <MagnifyingGlassIcon aria-hidden className="size-4" />
      Search
      <span className="ms-auto inline-flex gap-0.5">
        {hotKey.map((key, i) => (
          <kbd key={i} className="rounded-control border bg-fd-background px-1.5">
            {key.display}
          </kbd>
        ))}
      </span>
    </button>
  );
}

const noop = () => () => undefined;

/** Light or dark, switched with the same circle as the mode switch on the landing. */
export function ThemeToggle() {
  const mode = useSiteMode();
  const { setTheme } = useTheme();
  // Neither half is lit until the client knows the mode, as the server cannot.
  const mounted = useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
  const item = (active: boolean) =>
    `size-6.5 rounded-full p-1.5 ${active ? 'bg-fd-accent text-fd-accent-foreground' : 'text-fd-muted-foreground'}`;
  return (
    <button
      type="button"
      aria-label="Toggle Theme"
      data-theme-toggle=""
      onClick={(event) => {
        const box = event.currentTarget.getBoundingClientRect();
        setSiteMode(mode === 'light' ? 'dark' : 'light', setTheme, {
          x: box.left + box.width / 2,
          y: box.top + box.height / 2,
        });
      }}
      className="inline-flex items-center overflow-hidden rounded-full border p-1 focus-visible:ring-2 focus-visible:ring-fd-ring focus-visible:outline-none"
    >
      <SunIcon aria-hidden weight="fill" className={item(mounted && mode === 'light')} />
      <MoonIcon aria-hidden weight="fill" className={item(mounted && mode === 'dark')} />
    </button>
  );
}

export const NAV_LINK =
  'inline-flex items-center gap-1 p-2 text-fd-muted-foreground transition-colors hover:text-fd-accent-foreground focus-visible:ring-2 focus-visible:ring-fd-ring focus-visible:outline-none data-[active=true]:text-fd-primary';

export const ICON_LINK =
  'inline-flex items-center justify-center rounded-control p-1.5 text-sm font-medium transition-colors duration-fast hover:bg-fd-accent hover:text-fd-accent-foreground focus-visible:ring-2 focus-visible:ring-fd-ring focus-visible:outline-none [&_svg]:size-5';

/**
 * The menu below lg: a disclosure that drops the links and settings under the bar. It closes on a
 * link, on Escape, and on a press outside the header.
 */
export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const id = useId();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const header = ref.current?.closest('header');
    const onPointer = (event: PointerEvent) => {
      if (header != null && !header.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('pointerdown', onPointer);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('pointerdown', onPointer);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);
  const close = () => {
    setOpen(false);
  };
  return (
    <div ref={ref} className="contents">
      <button
        type="button"
        aria-label="Toggle Menu"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => {
          setOpen((value) => !value);
        }}
        className={ICON_LINK}
      >
        <CaretDownIcon aria-hidden className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <div
        id={id}
        hidden={!open}
        className="absolute inset-x-0 top-full rounded-b-panel border-b bg-fd-background shadow-overlay"
      >
        <div className="mx-auto flex max-w-7xl flex-col px-4 pt-2 pb-4 sm:flex-row sm:px-8 sm:items-center sm:justify-end">
          {SITE_LINKS.map((link) => (
            <NavLink
              key={link.url}
              link={link}
              onClick={close}
              className="inline-flex items-center gap-2 py-1.5 transition-colors hover:text-fd-popover-foreground/50 focus-visible:ring-2 focus-visible:ring-fd-ring focus-visible:outline-none data-[active=true]:font-medium data-[active=true]:text-fd-primary sm:hidden"
            />
          ))}
          <div className="-ms-1.5 flex flex-row items-center gap-2 max-sm:mt-2">
            <a
              href={repoUrl}
              target="_blank"
              rel="noreferrer noopener"
              aria-label="GitHub"
              onClick={close}
              className={ICON_LINK}
            >
              <GithubMark />
            </a>
            <div role="separator" className="flex-1" />
            <ThemeToggle />
          </div>
        </div>
      </div>
    </div>
  );
}
