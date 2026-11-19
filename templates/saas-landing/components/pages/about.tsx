'use client';

import { ArrowRightIcon } from '@phosphor-icons/react';
import { CtaBand, Em, Prose, Section, SectionHeader, Team } from '@rectio/blocks/marketing/motion';
import { Badge, cn, Stat, StatGroup } from '@rectio/ui';

import { PageIntro } from '@/components/page-intro';
import { COMPANY_FACTS, OPENINGS, TEAM, VALUES } from '@/data/company';
import { SITE } from '@/data/site';

export function AboutPage() {
  return (
    <>
      <PageIntro
        title={
          <>
            We build the rota we <Em>wished we had</Em>
          </>
        }
        description="Rostra started in a café back office in 2021. Today forty people in Dublin and across Europe build it."
      />
      <Section width="wide" labelledBy="story-title" className="pt-0 sm:pt-0">
        <div className="grid gap-12 lg:grid-cols-12 lg:items-start">
          <div className="flex flex-col gap-6 lg:col-span-6">
            <SectionHeader id="story-title" title="Why Rostra exists" size="md" />
            <Prose>
              <p>
                Hanna Virtanen ran rotas for forty cafés. Every Sunday she rebuilt the week in a
                spreadsheet, and every Monday half of it changed in a group chat.
              </p>
              <p>
                She and Daniel Osei wrote the first version of Rostra for one café. It did three
                things: collect availability, publish the week to everyone&apos;s phone, and let
                people swap without a call. It still does those three things first.
              </p>
              <p>
                We are funded by our customers and a small group of operators who have run shift
                teams themselves. We plan to stay that way.
              </p>
            </Prose>
          </div>
          <StatGroup aria-label="Rostra at a glance" className="lg:col-span-5 lg:col-start-8">
            {COMPANY_FACTS.map((fact) => (
              <Stat key={fact.label} label={fact.label} value={fact.value} size="lg" />
            ))}
          </StatGroup>
        </div>
      </Section>
      <Team
        eyebrow="Team"
        title={
          <>
            People who have <Em>worked the Saturday shift</Em>
          </>
        }
        description="Most of us have run or worked a rota. It shows in what we build and what we leave out."
        values={VALUES}
        members={TEAM}
      />
      <Section width="wide" labelledBy="jobs-title">
        <SectionHeader
          id="jobs-title"
          title="Open roles"
          description="Remote across Europe or from our Dublin office. Write to us about any role: every reply includes the salary range."
        />
        <ul className="mt-10 flex flex-col divide-y divide-line border-y border-line">
          {OPENINGS.map((role) => (
            <li key={role.id}>
              <a
                href={`mailto:${SITE.email.sales}?subject=${encodeURIComponent(role.title)}`}
                className={cn(
                  'group flex flex-col gap-2 py-5 text-fg sm:flex-row sm:items-center sm:gap-6',
                  'outline-offset-2 focus-visible:outline-2 focus-visible:outline-focus',
                )}
              >
                <span className="flex-1 text-lg font-medium pointer-fine:group-hover:underline">
                  {role.title}
                </span>
                <span className="flex items-center gap-3 text-sm text-fg-muted">
                  <Badge>{role.team}</Badge>
                  {role.place}
                  <ArrowRightIcon
                    aria-hidden
                    weight="bold"
                    className="size-4 text-fg transition-transform duration-fast ease-standard motion-reduce:transition-none pointer-fine:group-hover:translate-x-0.5"
                  />
                </span>
              </a>
            </li>
          ))}
        </ul>
      </Section>
      <CtaBand
        tone="tinted"
        layout="split"
        title="Questions about Rostra or a role?"
        description="Write to us. A person, not a bot, replies within one working day."
        primary={{ label: 'Contact us', href: '/contact' }}
      />
    </>
  );
}
