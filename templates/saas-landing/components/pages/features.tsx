'use client';

import {
  CtaBand,
  Em,
  FeatureIconGrid,
  FeatureRows,
  HeroSplit,
  Section,
  SectionHeader,
  TestimonialQuote,
} from '@rectio/blocks/marketing/motion';

import { Panel } from '@/components/panel';
import {
  AvailabilityCard,
  HoursCard,
  OpenShiftBoard,
  SwapCard,
  TimeOffCard,
} from '@/components/visuals/cards';
import { WeekSchedule } from '@/components/visuals/week-schedule';
import { ICON_FEATURES, TESTIMONIALS } from '@/data/marketing';
import { DEMO, START } from '@/data/site';

const FEATURED = TESTIMONIALS.find((t) => t.id === 't4') ?? TESTIMONIALS[0];

export function FeaturesPage() {
  return (
    <>
      <HeroSplit
        eyebrow="Features"
        title={
          <>
            From availability to payroll, <Em>one calm week</Em>
          </>
        }
        description="Plan the rota, fill the gaps and approve the changes without leaving Rostra."
        primary={START}
        secondary={DEMO}
        visual={<WeekSchedule />}
      />
      <FeatureIconGrid
        title="Built for the way shift teams work"
        description="The parts a manager uses every week, and the parts the team uses every day."
        features={ICON_FEATURES}
        columns={3}
      />
      <FeatureRows
        title="Plan the week, then fill the gaps"
        rows={[
          {
            id: 'availability',
            title: 'Collect availability once',
            description:
              'People set the hours they can work and the days they cannot. The rota builder only offers shifts that fit.',
            points: ['Recurring and one-off availability', 'Preferred hours per person'],
            visual: <AvailabilityCard />,
          },
          {
            id: 'gaps',
            title: 'Fill the gaps without a group chat',
            description:
              'Short days show up on the coverage line. Post them as open shifts and the first qualified person claims each one.',
            points: ['Claim limits per person', 'Pay rate shown on every shift'],
            visual: <OpenShiftBoard />,
          },
        ]}
      />
      <Section labelledBy="after-title">
        <SectionHeader
          id="after-title"
          title={
            <>
              After the rota is out, <Em>it stays right</Em>
            </>
          }
          description="Swaps and time off arrive with the rota beside them, and hours add up against each site's budget as the week changes."
        />
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div id="requests" className="flex flex-col gap-3">
            <h3 className="text-lg font-strong text-fg">Swaps in a tap</h3>
            <Panel className="flex-1">
              <SwapCard />
            </Panel>
          </div>
          <div className="flex flex-col gap-3">
            <h3 className="text-lg font-strong text-fg">Time off, approved in place</h3>
            <Panel className="flex-1">
              <TimeOffCard />
            </Panel>
          </div>
          <div id="hours" className="flex flex-col gap-3 md:col-span-2 lg:col-span-1">
            <h3 className="text-lg font-strong text-fg">Hours against budget</h3>
            <Panel className="flex-1">
              <HoursCard />
            </Panel>
          </div>
        </div>
      </Section>
      {FEATURED !== undefined && (
        <TestimonialQuote
          testimonial={FEATURED}
          metric={{ value: '−19%', label: 'overtime in the first quarter on Rostra' }}
          tone="tinted"
        />
      )}
      <CtaBand
        title="See it with your own rota"
        description="A 30 minute call with someone who has run a shift team."
        primary={DEMO}
        secondary={START}
      />
    </>
  );
}
