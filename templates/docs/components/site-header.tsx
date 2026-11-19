import { GithubLogoIcon } from '@phosphor-icons/react/ssr';
import type { DocsNavSection } from '@rectio/blocks/docs';

import { SITE } from '@/data/site';

import { DocsHeader, DocsSidebar, LanguageSwitcher, VersionSwitcher } from './blocks';
import { Brand } from './brand';
import { SiteSearch } from './search';
import { ThemeMenu } from './theme-menu';

const iconLink =
  'inline-flex size-9 items-center justify-center rounded-control text-fg-muted transition-colors duration-fast ease-standard pointer-fine:hover:bg-surface-hover pointer-fine:hover:text-fg pointer-coarse:size-(--rx-button-height-touch) outline-offset-2 focus-visible:outline-2 focus-visible:outline-focus';

/** The bar on every page: brand, top links, search, version, language, theme and the repository. */
export function SiteHeader({
  sections,
  currentHref,
}: {
  sections: DocsNavSection[];
  currentHref: string;
}) {
  return (
    <DocsHeader
      brand={<Brand />}
      brandLabel={`${SITE.name} docs home`}
      links={SITE.links}
      currentHref={currentHref}
      search={<SiteSearch />}
      mobileNav={
        <DocsSidebar
          sections={sections}
          currentHref={currentHref}
          footer={
            <div className="flex flex-wrap gap-2 border-t border-line pt-4">
              <VersionSwitcher versions={SITE.versions} current={SITE.versions[0]?.value ?? ''} />
              {SITE.languages.length > 1 && (
                <LanguageSwitcher
                  languages={SITE.languages}
                  current={SITE.languages[0]?.value ?? ''}
                />
              )}
            </div>
          }
        />
      }
      actions={
        <>
          <span className="hidden items-center gap-1 lg:flex">
            <VersionSwitcher versions={SITE.versions} current={SITE.versions[0]?.value ?? ''} />
            {SITE.languages.length > 1 && (
              <LanguageSwitcher
                languages={SITE.languages}
                current={SITE.languages[0]?.value ?? ''}
                compact
              />
            )}
          </span>
          <ThemeMenu />
          <a
            href={SITE.repository}
            target="_blank"
            rel="noreferrer"
            aria-label={`${SITE.name} on GitHub`}
            className={`${iconLink} max-sm:hidden`}
          >
            <GithubLogoIcon aria-hidden weight="bold" className="size-4.5" />
          </a>
        </>
      }
    />
  );
}
