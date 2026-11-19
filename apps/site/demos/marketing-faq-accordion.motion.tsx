'use client';

import { Faq } from '@rectio/blocks/marketing/motion';

const ITEMS = [
  {
    id: 'trial',
    question: 'Is there a free trial?',
    answer: 'Yes. Start free, no card needed, and keep going on a plan when you are ready.',
  },
  {
    id: 'data',
    question: 'Where is my data kept?',
    answer: 'In the EU, encrypted at rest and in transit. You can export everything at any time.',
  },
  {
    id: 'cancel',
    question: 'Can I cancel at any time?',
    answer: 'Yes. Export your data and leave whenever you like.',
  },
];

export default function FaqAccordionMotionDemo() {
  return (
    <div className="w-full">
      <Faq title="Questions, answered" items={ITEMS} defaultOpen={['trial']} />
    </div>
  );
}
