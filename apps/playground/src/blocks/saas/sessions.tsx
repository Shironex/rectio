import { Sessions as PlainSessions, type Session } from '@rectio/blocks';
import { Sessions as MotionSessions } from '@rectio/blocks/motion';
import { useState } from 'react';

import { NOW, ago, type DemoProps } from './demo';

const SESSIONS: Session[] = [
  {
    id: 'mac',
    device: 'laptop',
    client: 'Chrome 131',
    os: 'macOS',
    location: 'Berlin, Germany',
    ip: '203.0.113.24',
    signedInAt: ago(60 * 24 * 9),
    lastActiveAt: NOW,
    current: true,
  },
  {
    id: 'iphone',
    device: 'phone',
    client: 'Safari',
    os: 'iOS 19',
    location: 'Berlin, Germany',
    ip: '198.51.100.7',
    signedInAt: ago(60 * 24 * 17),
    lastActiveAt: ago(3),
  },
  {
    id: 'ipad',
    device: 'tablet',
    client: 'Fernhill for iPadOS',
    location: 'Lisbon, Portugal',
    signedInAt: ago(60 * 24 * 27),
    lastActiveAt: ago(60 * 24 * 2 + 200),
  },
  {
    id: 'office',
    device: 'desktop',
    client: 'Firefox 133',
    os: 'Windows 11',
    location: 'Hamburg, Germany',
    ip: '192.0.2.181',
    signedInAt: ago(60 * 24 * 66),
    lastActiveAt: ago(60 * 24 * 20),
  },
];

export function SessionsDemo({ motion, empty, locale }: DemoProps) {
  const Sessions = motion ? MotionSessions : PlainSessions;
  const [sessions, setSessions] = useState(empty ? SESSIONS.slice(0, 1) : SESSIONS);
  return (
    <Sessions
      sessions={sessions}
      now={NOW}
      locale={locale}
      passwordHref="#password"
      revoking={['office']}
      onRevoke={(id) => {
        setSessions((current) => current.filter((session) => session.id !== id));
      }}
      onRevokeOthers={() => {
        setSessions((current) => current.filter((session) => session.current === true));
      }}
    />
  );
}
