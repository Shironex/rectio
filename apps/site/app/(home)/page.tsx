import Link from 'next/link';

import { Bench } from '@/components/landing/bench';
import { ClosingBand } from '@/components/landing/closing-band';
import { CloseBooks } from '@/components/landing/close-books';
import { CurrencyGrid } from '@/components/landing/currency-grid';
import { currencies } from '@/components/landing/currencies';
import { Faq } from '@/components/landing/faq';
import { Footer } from '@/components/landing/footer';
import { Hero } from '@/components/landing/hero';
import { kitFacts } from '@/components/landing/kit-facts';
import { PlainVsMotion } from '@/components/landing/plain-vs-motion';
import { Pricing } from '@/components/landing/pricing';
import { RegistryDemo } from '@/components/landing/registry-demo';
import { StatRow } from '@/components/landing/stat-row';
import { Section, SectionIntro } from '@/components/landing/section';
import { ThemeCurtain } from '@/components/landing/theme-curtain';
import { ThemePacks } from '@/components/landing/theme-packs';
import { readoutValues } from '@/components/landing/theme-tokens';

const REGISTRY_POINTS = [
  ['Integrity checked', 'Every item is hashed; add stops before writing if anything is off.'],
  [
    'Edits respected',
    'A file you changed is never overwritten unless you pass the overwrite flag.',
  ],
  ['Agents included', 'rectio mcp lets a coding agent read items, tokens and docs.'],
] as const;

export default function Home() {
  const kit = kitFacts();
  const money = currencies();
  return (
    <>
      <div className="flex flex-col">
        <Hero kit={kit} />

        <CloseBooks />

        <Section id="kit" className="py-16 md:py-24" label="The kit in numbers">
          <StatRow kit={kit} />
        </Section>

        <Section className="py-16 md:py-24">
          <ThemeCurtain values={readoutValues()} />
        </Section>

        <Section className="py-8 md:py-12">
          <div className="site-panel flex flex-col gap-10 rounded-panel px-4 py-12 sm:px-8 md:px-12 md:py-16">
            <SectionIntro
              eyebrow="Live blocks"
              title={
                <>
                  <span className="font-regular">Live blocks,</span> not screenshots.
                </>
              }
            >
              Four of the {kit.blocks} pro finance blocks, running. Sort, filter, approve, add a
              line: what you try here is what you install.
            </SectionIntro>
            <Bench />
          </div>
        </Section>

        <Section className="flex flex-col gap-10 py-16 md:py-24">
          <SectionIntro
            eyebrow="CLI, registry and MCP"
            title={
              <>
                <span className="font-regular">One command,</span> and the block is yours.
              </>
            }
          >
            rectio installs source into your project, records what it wrote, and shows the diff when
            a new version lands.
          </SectionIntro>
          <RegistryDemo
            notes={
              <dl className="grid gap-5 sm:grid-cols-3 xl:grid-cols-1">
                {REGISTRY_POINTS.map(([term, text], i) => (
                  <div
                    key={term}
                    className={`site-reveal ${i === 0 ? '' : i === 1 ? 'site-step-1' : 'site-step-2'} flex flex-col gap-1`}
                  >
                    <dt className="text-base font-strong text-fg">{term}</dt>
                    <dd className="text-base text-fg-muted">{text}</dd>
                  </div>
                ))}
              </dl>
            }
          />
        </Section>

        <Section className="py-8 md:py-12">
          <div className="site-panel flex flex-col gap-10 rounded-panel px-4 py-12 sm:px-8 md:px-12 md:py-16">
            <SectionIntro
              eyebrow="Motion add-on"
              title={
                <>
                  <span className="font-regular">Plain where it should be still.</span> Motion where
                  it helps.
                </>
              }
            >
              The motion add-on has the same names and props as the plain components and costs{' '}
              {kit.motionKb} kB gzip. Choose per component by import path, and mix both on one
              screen.
            </SectionIntro>
            <PlainVsMotion />
          </div>
        </Section>

        <Section className="py-16 md:py-24">
          <div className="flex flex-col gap-10">
            <SectionIntro
              eyebrow="Currencies"
              title={
                <>
                  <span className="font-regular">{money.codes.length} currencies,</span> one Money
                  component.
                </>
              }
            >
              Money formats any currency the runtime knows, with the locale&apos;s grouping, a true
              minus sign and tabular figures. Search the list.
            </SectionIntro>
            <CurrencyGrid codes={money.codes} names={money.names} />
          </div>
        </Section>

        <Section className="py-8 md:py-12">
          <div className="site-panel flex flex-col gap-10 rounded-panel px-4 py-12 sm:px-8 md:px-12 md:py-16">
            <SectionIntro
              eyebrow="Theme packs"
              title={
                <>
                  <span className="font-regular">Themes are</span> token files.
                </>
              }
            >
              Two ship free with every component. Packs for charts and printed statements are next.
            </SectionIntro>
            <ThemePacks />
          </div>
        </Section>

        <Section id="pricing" className="flex flex-col gap-10 py-16 md:py-24">
          <SectionIntro
            eyebrow="Pricing"
            title={
              <>
                <span className="font-regular">Pay once.</span> Keep the source.
              </>
            }
          >
            The free tier is the whole component library. Pro adds motion, the finance blocks and
            theme packs.
          </SectionIntro>
          <Pricing blocks={kit.blocks} />
        </Section>

        <Section className="grid gap-10 py-16 md:py-24 lg:grid-cols-12">
          <div className="flex flex-col gap-6 lg:col-span-4">
            <SectionIntro eyebrow="FAQ" title="Questions" />
            <p className="site-reveal text-base text-fg-muted">
              Still unsure?{' '}
              <Link
                href="/docs"
                className="font-medium text-fg underline decoration-line-strong underline-offset-4 pointer-fine:hover:decoration-fg"
              >
                Read the docs
              </Link>{' '}
              or try every component there first.
            </p>
          </div>
          <div className="lg:col-span-8">
            <Faq />
          </div>
        </Section>

        <Section className="pt-8 pb-20 md:pb-28">
          <ClosingBand />
        </Section>
      </div>
      <Footer />
    </>
  );
}
