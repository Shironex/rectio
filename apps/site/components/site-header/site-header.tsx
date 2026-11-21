import Link from 'next/link';

import { Wordmark } from '@/components/wordmark';
import { SITE_LINKS } from '@/lib/layout.shared';
import { repoUrl } from '@/lib/site';

import { GithubMark } from './github-mark';
import { ICON_LINK, MobileMenu, NavLink, NAV_LINK, SearchButton, ThemeToggle } from './parts';

/**
 * The bar over the landing, the templates and the changelog: the docs header's look, drawn by the
 * server with a few small client parts (search, mode, menu), so these pages do not carry the docs
 * layout's navigation code. The docs keep their own layout.
 */
export function SiteHeader() {
  return (
    <header id="nd-nav" className="sticky top-0 z-40 h-14">
      <div className="relative border-b bg-fd-background/80 backdrop-blur-lg">
        <nav
          aria-label="Site"
          className="mx-auto flex h-14 w-full max-w-7xl items-center px-4 sm:px-8"
        >
          <Link href="/" className="inline-flex items-center gap-2.5 font-semibold">
            <Wordmark />
          </Link>
          <ul className="flex flex-row items-center gap-2 px-6 max-sm:hidden">
            {SITE_LINKS.map((link) => (
              <li key={link.url} className="list-none text-sm">
                <NavLink link={link} className={NAV_LINK} />
              </li>
            ))}
          </ul>
          <div className="flex flex-1 flex-row items-center justify-end gap-1.5 max-lg:hidden">
            <SearchButton variant="full" />
            <ThemeToggle />
            <a
              href={repoUrl}
              target="_blank"
              rel="noreferrer noopener"
              aria-label="GitHub"
              className={ICON_LINK}
            >
              <GithubMark />
            </a>
          </div>
          <div className="ms-auto -me-1.5 flex flex-row items-center lg:hidden">
            <SearchButton variant="icon" />
            <MobileMenu />
          </div>
        </nav>
      </div>
    </header>
  );
}
