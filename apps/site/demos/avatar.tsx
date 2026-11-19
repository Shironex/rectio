'use client';

import { Avatar } from '@rectio/ui';

export default function AvatarDemo() {
  return (
    <div className="flex flex-col items-center gap-5">
      <div className="flex flex-wrap items-end gap-3">
        <Avatar name="Ana Ruiz" size="xs" />
        <Avatar name="Tomasz Nowak" size="sm" status="online" />
        <Avatar name="Lena Fischer" size="md" status="away" />
        <Avatar name="Ivo Petrov" size="lg" status="busy" />
        <Avatar name="Mei Tanaka" size="xl" status="offline" />
      </div>
      <div className="flex items-center gap-3">
        <Avatar name="Treasury" size="lg" square />
        <Avatar name="Northwind Logistics" size="lg" square />
      </div>
    </div>
  );
}
