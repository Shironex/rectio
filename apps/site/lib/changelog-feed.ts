/**
 * The changelog as an Atom feed, one entry per shipped release (the unreleased entry stays out).
 * Built as a static file with the rest of the site, so it lives at /changelog.xml under the base
 * path. Links in entries become absolute, as feed readers need.
 */
import { inlineParts, type SiteRelease } from './changelog.ts';

const escape = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function inlineHtml(text: string, siteUrl: string): string {
  return inlineParts(text)
    .map((part) => {
      if (part.kind === 'code') return `<code>${escape(part.value)}</code>`;
      if (part.kind === 'link') {
        const href = part.href.startsWith('/') ? `${siteUrl}${part.href}` : part.href;
        return `<a href="${escape(href)}">${escape(part.value)}</a>`;
      }
      return escape(part.value);
    })
    .join('');
}

function releaseHtml(release: SiteRelease, siteUrl: string): string {
  const summary = release.summary === undefined ? '' : `<p>${escape(release.summary)}</p>`;
  const groups = release.groups
    .map((group) => {
      const items = group.entries
        .map((entry) => {
          const points =
            entry.points.length === 0
              ? ''
              : `<ul>${entry.points.map((p) => `<li>${inlineHtml(p, siteUrl)}</li>`).join('')}</ul>`;
          return `<li>${inlineHtml(entry.text, siteUrl)}${points}</li>`;
        })
        .join('');
      return `<h3>${escape(group.label)}</h3><ul>${items}</ul>`;
    })
    .join('');
  return summary + groups;
}

export function changelogFeed(releases: readonly SiteRelease[], siteUrl: string): string {
  const page = `${siteUrl}/changelog`;
  const shipped = releases.filter((release) => release.date !== undefined);
  const updated = `${shipped[0]?.date ?? '2026-11-20'}T00:00:00Z`;
  const entries = shipped
    .map(
      (release) => `  <entry>
    <id>${page}#${release.id}</id>
    <title>${escape(release.title)}</title>
    <link rel="alternate" type="text/html" href="${page}#${release.id}"/>
    <updated>${String(release.date)}T00:00:00Z</updated>
    <content type="html">${escape(releaseHtml(release, siteUrl))}</content>
  </entry>`,
    )
    .join('\n');
  return `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <id>${page}</id>
  <title>rectio changelog</title>
  <subtitle>What changed in rectio: the kit, the templates, the themes, the CLI and the docs.</subtitle>
  <link rel="alternate" type="text/html" href="${page}"/>
  <link rel="self" type="application/atom+xml" href="${siteUrl}/changelog.xml"/>
  <updated>${updated}</updated>
  <author><name>rectio</name></author>
${entries}
</feed>
`;
}
