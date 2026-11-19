import { Badge } from '@rectio/ui';
import Link from 'next/link';

import { CATEGORY_LABELS, readTemplates } from '@/lib/templates';

import { TemplateFrame } from './template-frame';

/** Every template on the docs index: capture, name, category and one sentence each. */
export function TemplateGrid() {
  const templates = readTemplates();
  return (
    <ul className="not-prose my-8 grid gap-8 sm:grid-cols-2">
      {templates.map((template) => (
        <li key={template.name} className="group relative flex flex-col gap-4">
          <TemplateFrame template={template} />
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-strong text-fg">
                <Link
                  href={template.href}
                  className="after:absolute after:inset-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus"
                >
                  {template.title}
                </Link>
              </h2>
              <Badge>{CATEGORY_LABELS[template.category]}</Badge>
            </div>
            <p className="text-sm text-fg-muted">{template.description}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
