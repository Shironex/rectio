import { readTemplate } from '@/lib/templates';

import { TemplateFrame } from './template-frame';

/** The top of a template's docs page: its desktop capture with the phone capture beside it. */
export function TemplateShots({ name }: { name: string }) {
  const template = readTemplate(name);
  return (
    <figure className="not-prose my-8">
      <TemplateFrame template={template} phone eager />
      <figcaption className="mt-3 text-sm text-fg-muted">
        The first page of the template on desktop and on a phone. Switch this page to light or dark
        to see both.
      </figcaption>
    </figure>
  );
}
