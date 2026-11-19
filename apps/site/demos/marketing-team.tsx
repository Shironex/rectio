'use client';

import { Team } from '@rectio/blocks/marketing';

const MEMBERS = [
  {
    id: 'ada',
    name: 'Ada Lindqvist',
    role: 'Co-founder, CEO',
    bio: 'Spent ten years closing books before building the tool she wanted.',
    links: [{ label: 'Profile', href: '#profile-ada' }],
  },
  {
    id: 'jon',
    name: 'Jon Reyes',
    role: 'Co-founder, CTO',
    bio: 'Leads the engineering that keeps every sum exact.',
  },
  {
    id: 'sofia',
    name: 'Sofia Novak',
    role: 'Head of Design',
    bio: 'Makes dense screens feel calm.',
  },
];

const VALUES = [
  { id: 'exact', title: 'Exact', description: 'Every amount is right to the cent.' },
  { id: 'open', title: 'Open', description: 'Open formats and a full export, always.' },
];

export default function TeamDemo() {
  return (
    <div className="w-full">
      <Team
        eyebrow="About"
        title="A small team that cares about the books"
        members={MEMBERS}
        values={VALUES}
      />
    </div>
  );
}
