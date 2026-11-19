'use client';

import { TestimonialQuote } from '@rectio/blocks/marketing/motion';

export default function TestimonialsQuoteMotionDemo() {
  return (
    <div className="w-full">
      <TestimonialQuote
        testimonial={{
          id: 'ines',
          quote: 'We closed March in three days. It used to take us nine.',
          name: 'Ines Vargas',
          role: 'Head of Finance',
          company: 'Brightwater',
        }}
        metric={{ value: '3 days', label: 'to close the month, down from 9' }}
      />
    </div>
  );
}
