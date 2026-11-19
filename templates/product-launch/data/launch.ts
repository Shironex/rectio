import type { FaqItem, Testimonial } from '@rectio/blocks/marketing';

/** The launch page's copy and the sample interview its visuals show. Invented, deterministic. */

export const INTERVIEW = {
  title: 'Interview with Sofie Lund',
  meta: 'Head of operations, Brightvale, 38 min',
  lines: [
    {
      id: 'l1',
      time: '04:12',
      theme: 'invites',
      before: 'We tried to roll it out, but ',
      highlight: 'every invite had to go through IT',
      after: ', so people just stopped asking.',
    },
    {
      id: 'l2',
      time: '11:47',
      theme: 'pricing',
      before: 'Honestly the price was fine. ',
      highlight: 'Paying per seat for viewers felt unfair',
      after: ' though.',
    },
    {
      id: 'l3',
      time: '19:05',
      theme: 'search',
      before: 'When a question comes up in planning, ',
      highlight: 'nobody can find the call where we heard it',
      after: '.',
    },
    {
      id: 'l4',
      time: '27:30',
      theme: 'invites',
      before: 'If I could ',
      highlight: 'add my team myself',
      after: ', we would have switched last spring.',
    },
  ],
} as const;

export const THEMES_FOUND = [
  { id: 'invites', label: 'Invites need IT', quotes: 14 },
  { id: 'search', label: 'Past calls are lost', quotes: 11 },
  { id: 'pricing', label: 'Viewer seats feel unfair', quotes: 7 },
  { id: 'export', label: 'Wants a slide export', quotes: 5 },
] as const;

export const HERO_WORDS = ['evidence', 'decisions', 'roadmaps'] as const;

export const STEPS = [
  {
    id: 'record',
    verb: 'Record',
    text: 'Join calls with one click or drop in recordings. Transcripts land in minutes, speakers named.',
  },
  {
    id: 'tag',
    verb: 'Tag',
    text: 'Highlight a line and tag it. Quarry suggests themes as quotes pile up across interviews.',
  },
  {
    id: 'cite',
    verb: 'Cite',
    text: 'Paste evidence into a spec or a slide. Every quote links back to the moment it was said.',
  },
] as const;

export const BETA_QUOTE: Testimonial = {
  id: 'b1',
  quote: 'Our roadmap review used to be opinions. Now every slide has three customers saying it.',
  name: 'Kwame Asante',
  role: 'Director of product',
  company: 'Fernhill',
};

export const BETA_TEAMS = [
  'Fernhill',
  'Brightvale',
  'Okapi Health',
  'Nordlys',
  'Tessera',
  'Cobalt Row',
] as const;

export const ROLES = [
  { value: 'pm', label: 'Product manager' },
  { value: 'research', label: 'User researcher' },
  { value: 'design', label: 'Designer' },
  { value: 'founder', label: 'Founder' },
  { value: 'other', label: 'Something else' },
] as const;

export const FAQ: readonly FaqItem[] = [
  {
    id: 'q1',
    question: 'When does early access open?',
    answer: 'In January 2027, in waves of about two hundred teams. The waitlist goes in order.',
  },
  {
    id: 'q2',
    question: 'What will it cost?',
    answer:
      'Early access is free for six months. After that, editors pay and anyone who only reads evidence is free.',
  },
  {
    id: 'q3',
    question: 'Where are recordings stored?',
    answer: 'In the EU, encrypted at rest. You can delete a recording and keep only its quotes.',
  },
  {
    id: 'q4',
    question: 'Which call tools does it join?',
    answer:
      'Zoom, Google Meet and Microsoft Teams at launch, plus uploads of any audio or video file.',
  },
];
