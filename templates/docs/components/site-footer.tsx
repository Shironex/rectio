import { SITE } from '@/data/site';

/** The line under every page. */
export function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-6 text-sm text-fg-muted sm:px-8">
        <p>{SITE.name} is open source under the MIT license.</p>
        <p className="numeric">Version {SITE.versions[0]?.label}</p>
      </div>
    </footer>
  );
}
