'use client';

import {
  CtaBand,
  Em,
  FeatureIconGrid,
  FeatureRows,
  HeroSplit,
  TestimonialQuote,
} from '@rectio/blocks/marketing/motion';

import { Panel } from '@/components/panel';
import {
  AvailabilityCard,
  HoursCard,
  OpenShiftBoard,
  RequestCard,
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
        title="Plan the week in three steps"
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
      <section id="requests" aria-labelledby="requests-title" className="py-16 text-fg sm:py-24">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-12 lg:px-8">
          <div className="flex flex-col gap-4 lg:col-span-4">
            <h2
              id="requests-title"
              className="font-display text-3xl font-regular tracking-tight text-balance sm:text-4xl"
            >
              Requests, <Em>settled in a tap</Em>
            </h2>
            <p className="max-w-prose text-lg text-pretty text-fg-muted">
              Swaps and time off arrive with the rota beside them. Approve, decline, and everyone
              affected hears at once.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:col-span-8">
            <Panel>
              <SwapCard />
            </Panel>
            <Panel>
              <div className="flex flex-col gap-5">
                <RequestCard />
                <TimeOffCard />
              </div>
            </Panel>
          </div>
        </div>
      </section>
      <section id="hours" aria-labelledby="hours-title" className="pb-16 text-fg sm:pb-24">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-12 lg:px-8">
          <Panel className="lg:col-span-5">
            <HoursCard />
          </Panel>
          <div className="flex flex-col gap-4 lg:col-span-6 lg:col-start-7">
            <h2
              id="hours-title"
              className="font-display text-3xl font-regular tracking-tight text-balance sm:text-4xl"
            >
              Hours and budgets, <Em>before payroll</Em>
            </h2>
            <p className="max-w-prose text-lg text-pretty text-fg-muted">
              Each site gets a weekly labour budget. Rostra adds up hours, breaks and overtime as
              you plan and flags a shift that breaks a rest rule before it is published.
            </p>
          </div>
        </div>
      </section>
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
