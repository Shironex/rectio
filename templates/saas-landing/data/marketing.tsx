import {
  BellRingingIcon,
  CalendarDotsIcon,
  ClockCountdownIcon,
  DeviceMobileIcon,
  PlugsConnectedIcon,
  ScalesIcon,
} from '@phosphor-icons/react';
import type { FaqItem, IconFeature, Stat, Testimonial } from '@rectio/blocks/marketing';

/**
 * The marketing copy the pages share. Every figure, name and company here is an invented sample;
 * replace them with your own before launch.
 */

export const STATS: readonly Stat[] = [
  {
    id: 'teams',
    value: 3180,
    format: 'number',
    label: 'shift teams plan their week on Rostra',
    suffix: '+',
  },
  { id: 'shifts', value: 4730000, format: 'compact', label: 'shifts scheduled last year' },
  {
    id: 'hours',
    value: 5.5,
    format: 'number',
    fractionDigits: 1,
    label: 'hours a week managers get back, the median',
    suffix: ' h',
  },
];

export const ICON_FEATURES: readonly IconFeature[] = [
  {
    id: 'builder',
    icon: <CalendarDotsIcon weight="duotone" />,
    title: 'Rota builder',
    description: 'Drag shifts onto the week, copy last week, or start from a template per site.',
  },
  {
    id: 'fair',
    icon: <ScalesIcon weight="duotone" />,
    title: 'Fair by default',
    description: 'Weekends and late shifts spread evenly, with the balance shown per person.',
  },
  {
    id: 'mobile',
    icon: <DeviceMobileIcon weight="duotone" />,
    title: 'In every pocket',
    description: 'People see their shifts, swap and ask for time off from the app.',
  },
  {
    id: 'reminders',
    icon: <BellRingingIcon weight="duotone" />,
    title: 'Reminders that land',
    description: 'A nudge the evening before a shift, and a note when the rota changes.',
  },
  {
    id: 'hours',
    icon: <ClockCountdownIcon weight="duotone" />,
    title: 'Hours and breaks',
    description: 'Rest rules and overtime checked as you plan, not after payroll.',
  },
  {
    id: 'integrations',
    icon: <PlugsConnectedIcon weight="duotone" />,
    title: 'Payroll ready',
    description: 'Approved hours export to your payroll tool at the end of each period.',
  },
];

export const TESTIMONIALS: readonly Testimonial[] = [
  {
    id: 't1',
    quote:
      'Sunday evenings used to be rota night. Now the week is out by Thursday and nobody texts me.',
    name: 'Hannah Okoye',
    role: 'General manager',
    company: 'Harbour Street Café',
  },
  {
    id: 't2',
    quote: 'Swaps sort themselves out. I approve them on the bus.',
    name: 'Luke Hartley',
    role: 'Floor lead',
    company: 'Copperleaf',
  },
  {
    id: 't3',
    quote: 'Our nurses finally see who is on before they ask. The ward phone is quiet.',
    name: 'Dr Sunniva Berg',
    role: 'Clinic director',
    company: 'Linden Clinics',
  },
  {
    id: 't4',
    quote:
      'Overtime fell by a fifth in the first quarter, mostly from seeing it before it happened.',
    name: 'Rashid Haddad',
    role: 'Operations director',
    company: 'Northgate Logistics',
  },
  {
    id: 't5',
    quote: 'The open shift board fills gaps faster than any group chat we tried.',
    name: 'Lucía Ferrer',
    role: 'Store manager',
    company: 'Alder & Finch',
  },
  {
    id: 't6',
    quote: 'Setup took one afternoon. The first rota went out the same day.',
    name: 'Callum Reid',
    role: 'Owner',
    company: 'Saltmarsh Bakery',
  },
];

export const FAQ: readonly FaqItem[] = [
  {
    id: 'f1',
    question: 'How long does it take to set up?',
    answer:
      'Most teams import their people from a spreadsheet and publish a first rota the same afternoon. Templates for cafés, clinics, retail and warehouses get you most of the way.',
  },
  {
    id: 'f2',
    question: 'Do my staff need to install anything?',
    answer:
      'They can use the app on iOS or Android, or open their schedule in any browser. Shift reminders arrive by push notification, email or text, whichever they choose.',
  },
  {
    id: 'f3',
    question: 'Can Rostra handle several sites?',
    answer:
      'Yes. Each site has its own rota, roles and opening hours, and people who work at more than one site see all their shifts in one place.',
  },
  {
    id: 'f4',
    question: 'Does it work with our payroll?',
    answer:
      'Approved hours export as a file every payroll tool reads, and the Business plan syncs directly with the most common ones.',
  },
  {
    id: 'f5',
    question: 'What happens when the trial ends?',
    answer:
      'Nothing is deleted. Teams of up to ten stay on the free plan; bigger teams pick a plan or export everything in one click.',
  },
];
