import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { Sessions, isActiveNow, sessionName, sortSessions, type Session } from '../../src/index';
import { Sessions as MotionSessions } from '../../src/motion';

const NOW = new Date(2026, 2, 19, 14, 20);
const SESSIONS: Session[] = [
  {
    id: 'phone',
    device: 'phone',
    client: 'Safari',
    os: 'iOS',
    location: 'Lisbon, Portugal',
    signedInAt: new Date(2026, 2, 1),
    lastActiveAt: new Date(2026, 2, 19, 12, 20),
  },
  {
    id: 'mac',
    device: 'laptop',
    client: 'Chrome',
    os: 'macOS',
    location: 'Berlin, Germany',
    ip: '203.0.113.24',
    signedInAt: new Date(2026, 2, 10),
    lastActiveAt: new Date(2026, 2, 19, 14, 19),
    current: true,
  },
  {
    id: 'pc',
    device: 'desktop',
    client: 'Firefox',
    os: 'Windows',
    signedInAt: new Date(2026, 1, 3),
    lastActiveAt: new Date(2026, 2, 12),
  },
];

const [PHONE, MAC] = SESSIONS as [Session, Session, Session];

describe('sessions logic', () => {
  it('puts this device first, then the most recently active', () => {
    expect(sortSessions(SESSIONS).map((s) => s.id)).toEqual(['mac', 'phone', 'pc']);
  });

  it('names a session and says when it is active now', () => {
    expect(sessionName({ client: 'Chrome', os: 'macOS' })).toBe('Chrome on macOS');
    expect(sessionName({ client: 'Fernhill app' })).toBe('Fernhill app');
    expect(isActiveNow({ ...PHONE, lastActiveAt: new Date(2026, 2, 19, 14, 17) }, NOW)).toBe(true);
    expect(isActiveNow(PHONE, NOW)).toBe(false);
  });
});

describe('Sessions', () => {
  it('marks this device, lists where and when each session was seen, and no sign out for itself', () => {
    render(<Sessions sessions={SESSIONS} now={NOW} locale="en-GB" onRevoke={vi.fn()} />);
    expect(screen.getByText('Signed in on 3 devices')).toBeInTheDocument();
    const rows = within(screen.getByRole('list', { name: 'Signed-in sessions' })).getAllByRole(
      'listitem',
    );
    expect(rows[0]).toHaveTextContent('Laptop, Chrome on macOSThis device');
    expect(rows[0]).toHaveTextContent('Active now');
    expect(screen.queryByRole('button', { name: 'Sign out, Chrome on macOS' })).toBeNull();
    expect(rows[1]).toHaveTextContent('Lisbon, Portugal·Last active 2 hours ago');
    expect(
      screen.getByRole('button', { name: 'Sign out, Firefox on Windows' }),
    ).toBeInTheDocument();
  });

  it('signs one session out at once and keeps focus in the list', async () => {
    const user = userEvent.setup();
    function Harness() {
      const [list, setList] = useState(SESSIONS);
      return (
        <Sessions
          sessions={list}
          now={NOW}
          locale="en-GB"
          onRevoke={(id) => {
            setList((current) => current.filter((s) => s.id !== id));
          }}
        />
      );
    }
    render(<Harness />);
    await user.click(screen.getByRole('button', { name: 'Sign out, Safari on iOS' }));
    expect(screen.queryByText('Safari on iOS')).toBeNull();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Sign out, Firefox on Windows' })).toHaveFocus();
    });
  });

  it('asks before signing out every other session', async () => {
    const user = userEvent.setup();
    const onRevokeOthers = vi.fn();
    render(
      <Sessions sessions={SESSIONS} now={NOW} locale="en-GB" onRevokeOthers={onRevokeOthers} />,
    );
    await user.click(screen.getByRole('button', { name: 'Sign out other sessions' }));
    const dialog = screen.getByRole('dialog', { name: 'Sign out 2 other sessions?' });
    await user.click(within(dialog).getByRole('button', { name: 'Sign out sessions' }));
    expect(onRevokeOthers).toHaveBeenCalledOnce();
  });

  it('links the password page and drops the bulk action with this device alone', () => {
    render(
      <Sessions
        sessions={[MAC]}
        now={NOW}
        onRevokeOthers={vi.fn()}
        passwordHref="/settings/security"
      />,
    );
    expect(screen.getByText('Signed in on this device only')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Sign out other sessions' })).toBeNull();
    expect(screen.getByRole('link', { name: 'change your password' })).toHaveAttribute(
      'href',
      '/settings/security',
    );
  });

  it('shows a failed sign out as an alert and the progress on the row', () => {
    render(
      <MotionSessions
        sessions={SESSIONS}
        now={NOW}
        onRevoke={vi.fn()}
        revoking={['pc']}
        error="Could not sign out. Try again."
      />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Could not sign out. Try again.');
    expect(screen.getByRole('button', { name: 'Signing out, Firefox on Windows' })).toHaveAttribute(
      'aria-busy',
      'true',
    );
  });
});
