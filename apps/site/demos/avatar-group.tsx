'use client';

import { AvatarGroup } from '@rectio/ui';

const approvers = [
  { name: 'Ana Ruiz', status: 'online' as const },
  { name: 'Tomasz Nowak' },
  { name: 'Lena Fischer' },
  { name: 'Ivo Petrov' },
  { name: 'Mei Tanaka' },
  { name: 'Omar Haddad' },
];

export default function AvatarGroupDemo() {
  return (
    <div className="flex flex-col items-center gap-6">
      <AvatarGroup label="Approvers" items={approvers} max={4} size="lg" locale="en" />
      <AvatarGroup
        label="Watching"
        items={approvers.slice(0, 3)}
        spacing="spaced"
        names="always"
        locale="en"
      />
    </div>
  );
}
