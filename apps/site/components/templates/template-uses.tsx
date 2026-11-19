import { existsSync } from 'node:fs';
import { join } from 'node:path';

import Link from 'next/link';

import { readTemplate } from '@/lib/templates';

const DOCS = join(process.cwd(), 'content', 'docs');

/** The docs page of a registry item, if it has one: components, finance or marketing blocks. */
function docsHref(item: string): string | undefined {
  for (const folder of ['components', 'blocks', join('blocks', 'marketing')]) {
    if (existsSync(join(DOCS, folder, `${item}.mdx`))) {
      return `/docs/${folder.split('\\').join('/')}/${item}`;
    }
  }
  return undefined;
}

const GROUPS = [
  { key: 'components', title: 'Components' },
  { key: 'blocks', title: 'Blocks' },
  { key: 'motion', title: 'Motion' },
  { key: 'other', title: 'Helpers' },
] as const;
type Group = (typeof GROUPS)[number]['key'];

/** The kit items a template imports, grouped, each linked to its docs page. */
export function TemplateUses({ name }: { name: string }) {
  const template = readTemplate(name);
  const grouped = new Map<Group, { item: string; href: string | undefined }[]>();
  for (const item of template.uses) {
    const motion = item.startsWith('motion-');
    const base = motion ? item.slice('motion-'.length) : item;
    const href = docsHref(base);
    const group: Group = motion
      ? 'motion'
      : href?.startsWith('/docs/components/') === true
        ? 'components'
        : href === undefined
          ? 'other'
          : 'blocks';
    grouped.set(group, [...(grouped.get(group) ?? []), { item, href }]);
  }
  return (
    <div className="not-prose flex flex-col gap-5">
      {GROUPS.filter((g) => grouped.has(g.key)).map((group) => (
        <div key={group.key} className="flex flex-col gap-2">
          <h3 className="text-sm font-strong text-fg">{group.title}</h3>
          <ul className="flex flex-wrap gap-2">
            {grouped.get(group.key)?.map(({ item, href }) => (
              <li key={item}>
                {href === undefined ? (
                  <span className="inline-flex h-8 items-center rounded-control border border-line px-2.5 font-mono text-sm text-fg-muted">
                    {item}
                  </span>
                ) : (
                  <Link
                    href={href}
                    className="inline-flex h-8 items-center rounded-control border border-line px-2.5 font-mono text-sm text-fg transition-colors duration-fast ease-standard pointer-coarse:h-11 pointer-fine:hover:border-line-strong pointer-fine:hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-focus"
                  >
                    {item}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
