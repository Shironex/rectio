'use client';

import {
  ActionLink,
  CtaBand,
  Em,
  Faq,
  FeatureBento,
  FeatureRows,
  HeroFloating,
  LogoStrip,
  StatRow,
  TestimonialGrid,
} from '@rectio/blocks/marketing/motion';

import { CUSTOMERS } from '@/components/brand';
import { Panel } from '@/components/panel';
import {
  AvailabilityCard,
  ClockInCard,
  ConfirmedCard,
  CoverageCard,
  HoursCard,
  OpenShiftBoard,
  PublishedCard,
  RequestCard,
  SwapCard,
  TimeOffCard,
} from '@/components/visuals/cards';
import { WeekSchedule } from '@/components/visuals/week-schedule';
import { FAQ, STATS, TESTIMONIALS } from '@/data/marketing';
import { DEMO, START } from '@/data/site';

export function HomePage() {
  return (
    <>
      <HeroFloating
        className="from-accent-subtle/40"
        title={
          <>
            Next week&apos;s rota, <Em>out by Thursday</Em>
          </>
        }
        description="Rostra turns your team's availability into a fair rota, then handles swaps and time off in the app."
        primary={START}
        secondary={DEMO}
        visual={<WeekSchedule className="rounded-none border-0" />}
        cards={[
          { id: 'published', position: 'top-end', content: <PublishedCard /> },
          { id: 'clock', position: 'bottom-start', content: <ClockInCard /> },
        ]}
      />
      <LogoStrip
        title="Cafés, clinics, shops and warehouses plan their week on Rostra"
        logos={CUSTOMERS}
        variant="marquee"
      />
      <FeatureBento
        eyebrow="Product"
        title={<>Everything a shift week needs, in one place</>}
        description="Each tile is the real product. Claim a shift, flip a switch, see the week fill up."
        items={[
          {
            id: 'open',
            title: 'Gaps fill themselves',
            description: 'Post an open shift; the first qualified person claims it.',
            size: 'wide',
            tone: 'sunken',
            visual: <OpenShiftBoard />,
          },
          {
            id: 'clock',
            title: 'Swaps, approved on the bus',
            description: 'Only qualified people can swap, and you approve in a tap.',
            visual: (
              <Panel compact>
                <SwapCard />
              </Panel>
            ),
          },
          {
            id: 'availability',
            title: 'Availability, kept current',
            description: 'People set when they can work; the rota builder respects it.',
            size: 'tall',
            tone: 'sunken',
            visual: <AvailabilityCard />,
          },
          {
            id: 'published',
            title: 'One tap to publish',
            visual: (
              <Panel compact>
                <PublishedCard />
              </Panel>
            ),
          },
          {
            id: 'confirmed',
            title: 'Know it is covered',
            visual: (
              <Panel compact>
                <ConfirmedCard />
              </Panel>
            ),
          },
          {
            id: 'coverage',
            title: 'Short days, flagged early',
            description: 'Coverage per day against what each day needs, before anyone notices.',
            size: 'wide',
            tone: 'sunken',
            visual: (
              <Panel>
                <CoverageCard />
              </Panel>
            ),
          },
        ]}
      />
      <StatRow
        lead={
          <>
            Managers get their <Em>Sundays back</Em>, and teams stop asking who is on.
          </>
        }
        stats={STATS}
        locale="en-GB"
        tone="plain"
      />
      <FeatureRows
        rows={[
          {
            id: 'requests',
            title: 'Swaps and time off, settled in the app',
            description:
              'Requests arrive with the rota beside them, so you approve in a tap instead of checking three chats.',
            points: [
              'Only qualified people can swap',
              'Approved time off blocks the rota',
              'Everyone notified at once',
            ],
            action: { label: 'See how requests work', href: '/features#requests' },
            visual: (
              <Panel>
                <div className="flex flex-col gap-5">
                  <RequestCard />
                  <TimeOffCard />
                </div>
              </Panel>
            ),
          },
          {
            id: 'hours',
            title: 'Know the hours before payroll does',
            description:
              'Hours, breaks and overtime add up as you plan, against the budget you set for each site.',
            points: ['Labour budget per site', 'Rest rules checked as you plan'],
            action: { label: 'See hours and budgets', href: '/features#hours' },
            visual: (
              <Panel>
                <HoursCard />
              </Panel>
            ),
          },
        ]}
      />
      <TestimonialGrid
        eyebrow="Customers"
        title={<>Teams that stopped texting about shifts</>}
        testimonials={TESTIMONIALS.slice(0, 5)}
      />
      <Faq
        title="Questions, answered"
        description="Anything else? A person replies within one working day."
        items={FAQ}
        defaultOpen={['f1']}
        aside={
          <ActionLink
            action={{ label: 'Talk to us', href: '/contact' }}
            variant="secondary"
            size="md"
            arrow
          />
        }
      />
      <CtaBand
        layout="split"
        title={
          <>
            Publish your first rota <Em>this afternoon</Em>
          </>
        }
        description="Free for teams of up to ten. No card, and your data exports in one click."
        primary={START}
        secondary={DEMO}
      />
    </>
  );
}
