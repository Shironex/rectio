import { cn } from '@rectio/ui';

import type { SiteTemplate } from '@/lib/template-types';

/**
 * A template's screenshot in a window frame. Both the light and the dark capture are in the page;
 * CSS shows the one matching the page's mode (site.css, `.site-shot-*`), and the hidden one is
 * never fetched because it is lazy and not displayed.
 */
export function TemplateFrame({
  template,
  phone = false,
  eager = false,
  className,
}: {
  template: SiteTemplate;
  /** Lay the phone capture over the bottom corner, from the small breakpoint up. */
  phone?: boolean;
  /** Load at once, for a frame in the first viewport. */
  eager?: boolean;
  className?: string;
}) {
  const loading = eager ? 'eager' : 'lazy';
  const alt = `${template.title} template, overview page`;
  return (
    <div
      className={cn(
        'relative',
        phone && template.shots.phone !== undefined && 'sm:pe-12 sm:pb-10',
        className,
      )}
    >
      <div className="overflow-hidden rounded-panel border border-line-strong bg-surface-canvas shadow-overlay">
        <img
          src={template.shots.light}
          alt={alt}
          width={1440}
          height={900}
          loading={loading}
          decoding="async"
          className="site-shot-light block h-auto w-full"
        />
        <img
          src={template.shots.dark}
          alt={alt}
          width={1440}
          height={900}
          loading={loading}
          decoding="async"
          className="site-shot-dark block h-auto w-full"
        />
      </div>
      {phone && template.shots.phone !== undefined && (
        <div className="absolute end-0 bottom-0 hidden w-1/5 min-w-24 overflow-hidden rounded-panel border border-line-strong bg-surface-canvas shadow-overlay sm:block">
          <img
            src={template.shots.phone}
            alt={`${template.title} template on a phone`}
            width={390}
            height={844}
            loading={loading}
            decoding="async"
            className="block h-auto w-full"
          />
        </div>
      )}
    </div>
  );
}
