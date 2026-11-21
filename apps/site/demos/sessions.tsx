'use client';

import { Sessions, type Session, type SessionsProps } from '@rectio/blocks';
import { useState } from 'react';

const NOW = new Date(2026, 2, 19, 14, 20);

const SESSIONS: Session[] = [
  {
    id: 'mac',
    device: 'laptop',
    client: 'Chrome 131',
    os: 'macOS',
    location: 'Berlin, Germany',
    ip: '203.0.113.24',
    signedInAt: new Date(2026, 2, 10, 9, 2),
    lastActiveAt: new Date(2026, 2, 19, 14, 19),
    current: true,
  },
  {
    id: 'iphone',
    device: 'phone',
    client: 'Safari',
    os: 'iOS 19',
    location: 'Berlin, Germany',
    ip: '198.51.100.7',
    signedInAt: new Date(2026, 2, 2, 18, 40),
    lastActiveAt: new Date(2026, 2, 19, 14, 17),
  },
  {
    id: 'ipad',
    device: 'tablet',
    client: 'Fernhill for iPadOS',
    location: 'Lisbon, Portugal',
    signedInAt: new Date(2026, 1, 20, 8, 15),
    lastActiveAt: new Date(2026, 2, 16, 21, 4),
  },
  {
    id: 'office',
    device: 'desktop',
    client: 'Firefox 133',
    os: 'Windows 11',
    location: 'Hamburg, Germany',
    ip: '192.0.2.181',
    signedInAt: new Date(2026, 0, 12, 10, 30),
    lastActiveAt: new Date(2026, 1, 27, 17, 52),
  },
];

export function useSessionsDemo(): SessionsProps {
  const [sessions, setSessions] = useState(SESSIONS);
  return {
    sessions,
    now: NOW,
    locale: 'en-GB',
    passwordHref: '#password',
    onRevoke: (id) => {
      setSessions((current) => current.filter((session) => session.id !== id));
    },
    onRevokeOthers: () => {
      setSessions((current) => current.filter((session) => session.current === true));
    },
  };
}

export default function SessionsDemo() {
  const props = useSessionsDemo();
  return (
    <div className="w-full">
      <Sessions {...props} />
    </div>
  );
}
