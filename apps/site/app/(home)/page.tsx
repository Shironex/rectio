import { Bento } from '@/components/landing/bento';
import { Faq } from '@/components/landing/faq';
import { Footer } from '@/components/landing/footer';
import { Hero } from '@/components/landing/hero';
import { PlainVsMotion } from '@/components/landing/plain-vs-motion';
import { Pricing } from '@/components/landing/pricing';
import { Principles } from '@/components/landing/principles';
import { Section, SectionIntro } from '@/components/landing/section';
import { Terminal } from '@/components/landing/terminal';
import { ThemeShowcase } from '@/components/landing/theme-showcase';
import { readoutValues } from '@/components/landing/theme-tokens';

export default function Home() {
  return (
    <>
      <div className="flex flex-col">
        <Hero />

        <Section className="flex flex-col gap-12 py-14 md:py-16">
          <SectionIntro title="The parts of finance UI that are easy to get wrong.">
            Amounts, currencies, periods, states and confirmation: live below, each accessible from
            the keyboard and themed by tokens alone.
          </SectionIntro>
          <Bento />
        </Section>

        <Section className="py-14 md:py-16">
          <ThemeShowcase values={readoutValues()} />
        </Section>

        <Section className="flex flex-col gap-12 py-14 md:py-16">
          <SectionIntro title="Plain where it should be still. Motion where it helps.">
            The motion add-on has the same names and props as the plain components. Choose per
            component by import path, and mix both on one screen.
          </SectionIntro>
          <PlainVsMotion />
        </Section>

        <Section className="grid gap-12 py-14 md:py-16 lg:grid-cols-12 lg:gap-16">
          <div className="flex min-w-0 flex-col gap-8 lg:col-span-5">
            <SectionIntro title="Source you own, from a registry you trust.">
              rectio installs components as files in your project, records what it wrote, and shows
              the diff when a new version lands.
            </SectionIntro>
            <dl className="flex flex-col gap-5">
              {[
                [
                  'Integrity checked',
                  'Every item is hashed; add stops before writing if anything is off.',
                ],
                ['Edits respected', 'A file you changed is never overwritten without --overwrite.'],
                ['Agents included', 'rectio mcp lets a coding agent read items, tokens and docs.'],
              ].map(([term, text], i) => (
                <div
                  key={term}
                  className={`site-reveal ${i === 0 ? '' : i === 1 ? 'site-step-1' : 'site-step-2'} flex flex-col gap-1`}
                >
                  <dt className="text-base font-strong text-fg">{term}</dt>
                  <dd className="text-base text-fg-muted">{text}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="site-reveal site-step-1 min-w-0 lg:col-span-7">
            <Terminal />
          </div>
        </Section>

        <Section className="py-14 md:py-16">
          <Principles />
        </Section>

        <Section id="pricing" className="flex flex-col gap-12 py-14 md:py-16">
          <SectionIntro title="Pay once.">
            The free tier is the whole component library. Pro adds motion, theme packs and the
            finance blocks as they ship.
          </SectionIntro>
          <Pricing />
        </Section>

        <Section className="grid gap-12 py-14 md:py-16 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <SectionIntro title="Questions" />
          </div>
          <div className="lg:col-span-8">
            <Faq />
          </div>
        </Section>
      </div>
      <Footer />
    </>
  );
}
