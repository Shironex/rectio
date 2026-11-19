'use client';

import { CheckIcon, GithubLogoIcon, LinkedinLogoIcon, XLogoIcon } from '@phosphor-icons/react';
import {
  Container,
  Em,
  Faq,
  FeatureBento,
  HeroWordCycle,
  LogoStrip,
  Section,
  SectionHeader,
  SiteFooter,
  SiteHeader,
  TestimonialQuote,
} from '@rectio/blocks/marketing/motion';
import { AvatarGroup } from '@rectio/ui';

import { BETA_QUOTE, BETA_TEAMS, FAQ, HERO_WORDS, STEPS } from '@/data/launch';
import { JOIN, NAV, SITE, STORAGE } from '@/data/site';
import { useStored } from '@/lib/stored';

import { Brand } from './brand';
import { Panel } from './panel';
import { ThemeSwitch } from './theme-switch';
import { EvidenceCard, InterviewBoard, SearchCard, TagCloud } from './visuals';
import { WaitlistForm } from './waitlist';

/** Placeholder profiles: point these at your own accounts. */
const SOCIAL = [
  { label: 'Quarry on LinkedIn', href: 'https://www.linkedin.com', icon: <LinkedinLogoIcon /> },
  { label: 'Quarry on X', href: 'https://x.com', icon: <XLogoIcon /> },
  { label: 'Quarry on GitHub', href: 'https://github.com', icon: <GithubLogoIcon /> },
];

const EARLY_ACCESS = [
  'Six months free for your whole team',
  'A direct line to the people building it',
  'Your call tools connected for you',
];

function ReadersCard() {
  return (
    <div className="flex flex-col items-start gap-3">
      <AvatarGroup
        label="Readers"
        size="md"
        spacing="spaced"
        max={4}
        items={['Ines Moreau', 'Jun Park', 'Ada Novak', 'Tomas Berg', 'Lea Fischer'].map(
          (name) => ({
            name,
          }),
        )}
      />
      <span className="text-sm whitespace-nowrap text-fg-muted">23 readers, 4 editors</span>
    </div>
  );
}

/** The whole launch page: one long scroll from the promise to the waitlist. */
export function LaunchPage() {
  const joined = typeof useStored(STORAGE.waitlist) === 'string';
  return (
    <>
      <a
        href="#main"
        className="sr-only z-50 rounded-control bg-surface-overlay px-4 py-2 text-fg shadow-overlay focus:not-sr-only focus:fixed focus:start-4 focus:top-4"
      >
        Skip to content
      </a>
      <SiteHeader brand={<Brand />} brandLabel={`${SITE.name} home`} links={NAV} primary={JOIN} />
      <main id="main" className="flex-1">
        <HeroWordCycle
          className="from-accent-subtle/40"
          eyebrow={SITE.launch}
          before="Every customer interview, turned into"
          words={HERO_WORDS}
          description="Quarry transcribes your calls, finds the themes and lets anyone on the team cite the exact moment a customer said it."
          primary={JOIN}
          secondary={{ label: 'See how it works', href: '#how' }}
          visual={<InterviewBoard className="pb-16" />}
        />
        <LogoStrip
          title="Product teams testing Quarry in private beta"
          logos={BETA_TEAMS.slice(0, 4).map((name) => ({ name }))}
        />
        <div id="product">
          <FeatureBento
            title={
              <>
                Stop quoting the loudest person. <Em>Quote your customers.</Em>
              </>
            }
            description="Every tile is a piece of the product. Pick a theme in the board above and the interview follows."
            items={[
              {
                id: 'evidence',
                title: 'Evidence with a source',
                description:
                  'Claims gather the quotes behind them, and show how strong the case is.',
                size: 'wide',
                tone: 'sunken',
                visual: (
                  <Panel>
                    <EvidenceCard />
                  </Panel>
                ),
              },
              {
                id: 'search',
                title: 'Find any moment',
                description: 'Search what was said, not what was noted.',
                visual: (
                  <Panel compact>
                    <SearchCard />
                  </Panel>
                ),
              },
              {
                id: 'themes',
                title: 'Themes that surface',
                description: 'Tags gather across calls into themes you can rank.',
                tone: 'sunken',
                visual: <TagCloud />,
              },
              {
                id: 'readers',
                title: 'Free for everyone who reads',
                description: 'Engineers, sales and leadership read and cite evidence at no cost.',
                size: 'wide',
                tone: 'sunken',
                visual: (
                  <Panel compact>
                    <ReadersCard />
                  </Panel>
                ),
              },
            ]}
          />
        </div>
        <Section id="how" width="wide" labelledBy="how-title">
          <h2 id="how-title" className="sr-only">
            How it works
          </h2>
          <ol className="grid gap-12 md:grid-cols-3 md:gap-8">
            {STEPS.map((step, index) => (
              <li key={step.id} className="flex flex-col gap-4 border-t border-line-strong pt-6">
                <span className="numeric text-sm text-fg-muted">
                  Step {String(index + 1).padStart(2, '0')}
                </span>
                <h3 className="font-display text-5xl font-strong tracking-tight text-fg">
                  {step.verb}.
                </h3>
                <p className="max-w-xs text-lg text-pretty text-fg-muted">{step.text}</p>
              </li>
            ))}
          </ol>
        </Section>
        <TestimonialQuote
          testimonial={BETA_QUOTE}
          metric={{ value: '3×', label: 'more customer quotes in roadmap reviews' }}
        />
        <Section id="waitlist" tone="panel" width="wide" labelledBy="waitlist-title">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
            <div className="flex flex-col gap-6 lg:col-span-6">
              <SectionHeader
                id="waitlist-title"
                size="xl"
                title={
                  joined ? (
                    <>
                      You are <Em>on the list</Em>
                    </>
                  ) : (
                    <>
                      Get in <Em>before the doors open</Em>
                    </>
                  )
                }
                description="Early access opens in January in waves of about two hundred teams. The list goes in order."
              />
              <ul className="flex flex-col gap-3">
                {EARLY_ACCESS.map((item) => (
                  <li key={item} className="flex items-center gap-3 text-lg text-fg">
                    <CheckIcon aria-hidden weight="bold" className="size-5 shrink-0 text-accent" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <Panel className="lg:col-span-5 lg:col-start-8">
              <WaitlistForm />
            </Panel>
          </div>
        </Section>
        <div id="faq">
          <Faq title="Before you join" items={FAQ} defaultOpen={['q1']} />
        </div>
      </main>
      <SiteFooter
        layout="minimal"
        brand={<Brand />}
        brandLabel={`${SITE.name} home`}
        social={SOCIAL}
        legal={[{ label: SITE.email, href: `mailto:${SITE.email}` }]}
        copyright={`© 2026 ${SITE.legalName}`}
      />
      <section aria-labelledby="appearance-title">
        <Container width="wide" className="flex flex-wrap items-center gap-4 pb-10">
          <h2 id="appearance-title" className="text-sm text-fg-muted">
            Appearance
          </h2>
          <ThemeSwitch />
        </Container>
      </section>
    </>
  );
}
