'use client';

import { TestimonialMarquee } from '@rectio/blocks/marketing/motion';

const TESTIMONIALS = [
  {
    id: 'a',
    quote: 'Approvals that used to take a week now take an afternoon.',
    name: 'Ines Vargas',
    role: 'Head of Finance',
    company: 'Brightwater',
  },
  {
    id: 'b',
    quote: 'The ledger always balances. I stopped checking.',
    name: 'Tomas Berg',
    role: 'Controller',
    company: 'Halden',
  },
  {
    id: 'c',
    quote: 'Our auditors asked who built the export. We did not have to.',
    name: 'Mara Ohlsson',
    role: 'CFO',
    company: 'Kestrel',
  },
];

export default function TestimonialsMarqueeMotionDemo() {
  return (
    <div className="w-full">
      <TestimonialMarquee title="Finance teams say it best" testimonials={TESTIMONIALS} />
    </div>
  );
}
