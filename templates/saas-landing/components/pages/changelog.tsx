'use client';

import { formatDate, Newsletter, Section } from '@rectio/blocks/marketing/motion';
import { Badge, Timeline, TimelineItem, type BadgeTone } from '@rectio/ui';

import { PageIntro } from '@/components/page-intro';
import { RELEASES, type ReleaseKind } from '@/data/company';
import { subscribe } from '@/lib/forms';

const KIND_TONE: Record<ReleaseKind, BadgeTone> = {
  New: 'info',
  Improved: 'positive',
  Fixed: 'neutral',
};

export function ChangelogPage() {
  return (
    <>
      <PageIntro
        title="Changelog"
        description="What shipped, when. New releases every few weeks, small fixes every day."
      />
      <Section width="wide" label="Releases" className="pt-0 sm:pt-0">
        <div className="grid gap-12 lg:grid-cols-12">
          <Timeline className="lg:col-span-8">
            {RELEASES.map((release, index) => (
              <TimelineItem
                key={release.version}
                id={`v${release.version.replace('.', '-')}`}
                tone={index === 0 ? 'accent' : 'neutral'}
                time={{ dateTime: release.date, label: formatDate(release.date, 'en-GB') }}
                title={<span className="numeric text-fg-muted">Version {release.version}</span>}
              >
                <div className="flex flex-col gap-4 pt-2 pb-6">
                  <h2 className="font-display text-2xl font-strong tracking-tight text-fg">
                    {release.title}
                  </h2>
                  <p className="max-w-prose text-lg text-pretty text-fg-muted">{release.summary}</p>
                  <ul className="flex flex-col gap-2.5">
                    {release.changes.map((change) => (
                      <li key={change.text} className="flex items-start gap-3 text-base text-fg">
                        <Badge
                          tone={KIND_TONE[change.kind]}
                          className="w-20 shrink-0 justify-center"
                        >
                          {change.kind}
                        </Badge>
                        <span className="text-pretty">{change.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </TimelineItem>
            ))}
          </Timeline>
          <aside className="lg:col-span-4">
            <div className="flex flex-col gap-4 rounded-panel border border-line bg-surface-sunken p-6 lg:sticky lg:top-24">
              <Newsletter
                layout="compact"
                title="Release notes by email"
                description="One short email when a release ships. Nothing else."
                onSubscribe={subscribe}
              />
            </div>
          </aside>
        </div>
      </Section>
    </>
  );
}
