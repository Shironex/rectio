import type { TemplateCategory } from '@rectio/registry';

export type { TemplateCategory };

/** Category names as the site shows them. Typed by the registry, so a new category must be named. */
export const CATEGORY_LABELS: Record<TemplateCategory, string> = {
  app: 'App',
  dashboard: 'Dashboard',
  marketing: 'Marketing',
  docs: 'Docs',
};
export const TEMPLATE_CATEGORIES = Object.keys(CATEGORY_LABELS) as TemplateCategory[];

/** What the site shows of a template: its manifest and where its screenshots are served. */
export interface SiteTemplate {
  name: string;
  title: string;
  description: string;
  category: TemplateCategory;
  pages: string[];
  uses: string[];
  /** The template's docs page. */
  href: string;
  /** The live viewer: the real app in a frame. */
  previewHref: string;
  command: string;
  shots: { light: string; dark: string; phone: string | undefined };
}
