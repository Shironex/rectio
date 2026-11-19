import { readTemplate } from '@/lib/templates';

import { TemplateFrame } from './template-frame';

/** The top of a template's docs page: its desktop capture with the phone capture beside it. */
export function TemplateShots({ name }: { name: string }) {
  const template = readTemplate(name);
  return (
    <figure className="not-prose my-8">
      <TemplateFrame template={template} phone eager />
      <figcaption className="mt-3 text-sm text-fg-muted">
        The overview page in light and dark (it follows this page), and on a phone.
      </figcaption>
    </figure>
  );
}
