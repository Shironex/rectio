import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { TemplateViewer } from '@/components/templates/viewer/template-viewer';
import { previewBase, previewPages } from '@/lib/previews';
import { CATEGORY_LABELS, readTemplates } from '@/lib/templates';

interface Props {
  params: Promise<{ name: string }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return readTemplates().map((template) => ({ name: template.name }));
}

function find(name: string) {
  const template = readTemplates().find((t) => t.name === name);
  if (template === undefined) notFound();
  return template;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const template = find((await params).name);
  return {
    title: `${template.title} template, live`,
    description: template.description,
  };
}

/** One template, running live in the viewer. */
export default async function TemplatePreviewPage({ params }: Props) {
  const template = find((await params).name);
  return (
    <TemplateViewer
      template={{
        name: template.name,
        title: template.title,
        category: CATEGORY_LABELS[template.category],
        command: template.command,
        docsHref: template.href,
        base: previewBase(template.name),
        pages: previewPages(template.name, template.pages),
      }}
    />
  );
}
