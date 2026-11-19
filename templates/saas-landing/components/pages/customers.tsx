'use client';

import { ArrowRightIcon } from '@phosphor-icons/react';
import {
  CtaBand,
  Em,
  LogoStrip,
  Section,
  SectionHeader,
  StatRow,
  TestimonialMarquee,
  TestimonialQuote,
} from '@rectio/blocks/marketing/motion';
import { cn } from '@rectio/ui';

import { CUSTOMERS } from '@/components/brand';
import { PageIntro } from '@/components/page-intro';
import { CASE_STUDIES, type CaseStudy } from '@/data/company';
import { STATS, TESTIMONIALS } from '@/data/marketing';
import { DEMO, START } from '@/data/site';

const LEAD = TESTIMONIALS.find((t) => t.id === 't3') ?? TESTIMONIALS[0];

function CaseStudyCard({ study }: { study: CaseStudy }) {
  const logo = CUSTOMERS.find((customer) => customer.name === study.company)?.logo;
  return (
    <li>
      <a
        href={study.href}
        className={cn(
          'group flex h-full flex-col gap-6 rounded-panel border border-line bg-surface p-6 text-fg',
          'transition-[border-color,box-shadow] duration-fast ease-standard',
          'pointer-fine:hover:border-line-strong pointer-fine:hover:shadow-raised',
          'outline-offset-2 focus-visible:outline-2 focus-visible:outline-focus',
        )}
      >
        <span className="flex items-center justify-between gap-3 text-fg">
          {logo ?? <span className="font-display text-lg font-strong">{study.company}</span>}
          <span className="text-sm text-fg-muted">{study.industry}</span>
        </span>
        <span className="flex flex-col gap-1">
          <span className="numeric font-display text-5xl font-strong tracking-tight text-accent-strong">
            {study.metric.value}
          </span>
          <span className="text-base text-fg-muted">{study.metric.label}</span>
        </span>
        <span className="mt-auto flex flex-col gap-4 border-t border-line pt-5">
          <span className="text-base text-pretty text-fg">{study.summary}</span>
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-fg">
            Read the story
            <span className="sr-only">: {study.company}</span>
            <ArrowRightIcon
              aria-hidden
              weight="bold"
              className="size-4 transition-transform duration-fast ease-standard pointer-fine:group-hover:translate-x-0.5"
            />
          </span>
        </span>
      </a>
    </li>
  );
}

export function CustomersPage() {
  return (
    <>
      <PageIntro
        title={
          <>
            Shift teams that <Em>plan with less noise</Em>
          </>
        }
        description="Cafés, clinics, shops and warehouses, from one site to forty. Here is what changed for them."
      />
      <LogoStrip logos={CUSTOMERS} className="pt-0" />
      <Section labelledBy="stories-title">
        <SectionHeader id="stories-title" title="Customer stories" />
        <ul className="mt-10 grid gap-4 md:grid-cols-3">
          {CASE_STUDIES.map((study) => (
            <CaseStudyCard key={study.id} study={study} />
          ))}
        </ul>
      </Section>
      {LEAD !== undefined && (
        <TestimonialQuote
          testimonial={LEAD}
          metric={{ value: '31%', label: 'fewer calls to the ward phone in six months' }}
          tone="tinted"
        />
      )}
      <StatRow stats={STATS} locale="en-GB" label="Rostra in numbers" />
      <TestimonialMarquee title="In their words" testimonials={TESTIMONIALS} />
      <CtaBand
        layout="split"
        title="Your team could be the next story"
        description="Start free today, or book a call and we will plan your first rota with you."
        primary={START}
        secondary={DEMO}
      />
    </>
  );
}
