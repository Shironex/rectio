import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import {
  Changelog,
  changelogCounts,
  filterChangelog,
  isReleaseUnseen,
  unseenReleaseCount,
  type ChangelogRelease,
} from '../../src/index';

const RELEASES: ChangelogRelease[] = [
  {
    id: 'old',
    version: '2.12',
    date: new Date(2026, 1, 20),
    changes: [{ kind: 'fixed', text: 'CSV exports keep leading zeros.' }],
  },
  {
    id: 'new',
    version: '2.14',
    date: new Date(2026, 2, 17),
    title: 'Approvals on the go',
    changes: [
      { kind: 'new', text: 'Approve from the notification.' },
      { kind: 'fixed', text: 'Bulk approvals keep the last row.' },
    ],
  },
];

describe('changelog logic', () => {
  it('orders releases, filters changes and drops empty releases', () => {
    expect(filterChangelog(RELEASES, 'all').map((r) => r.id)).toEqual(['new', 'old']);
    const fresh = filterChangelog(RELEASES, 'new');
    expect(fresh.map((r) => r.id)).toEqual(['new']);
    expect(fresh[0]?.changes).toHaveLength(1);
    expect(changelogCounts(RELEASES)).toEqual({ all: 3, new: 1, improved: 0, fixed: 2 });
  });

  it('marks releases after the last visit, and none without one', () => {
    const lastSeen = new Date(2026, 2, 1);
    const [older, newer] = RELEASES as [ChangelogRelease, ChangelogRelease];
    expect(isReleaseUnseen(newer, lastSeen)).toBe(true);
    expect(isReleaseUnseen(older, lastSeen)).toBe(false);
    expect(unseenReleaseCount(RELEASES, undefined)).toBe(0);
  });
});

describe('Changelog', () => {
  it('marks what is new since the last visit and lets the app mark it read', async () => {
    const onMarkSeen = vi.fn();
    render(
      <Changelog
        releases={RELEASES}
        lastSeen={new Date(2026, 2, 1)}
        onMarkSeen={onMarkSeen}
        locale="en-GB"
      />,
    );
    expect(screen.getByText('1 release since your last visit')).toBeInTheDocument();
    expect(screen.getAllByRole('separator', { name: 'New since your last visit' })).toHaveLength(1);
    expect(screen.getByRole('separator', { name: 'Earlier' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Mark as read' }));
    expect(onMarkSeen).toHaveBeenCalled();
  });

  it('filters to one kind of change', async () => {
    render(<Changelog releases={RELEASES} locale="en-GB" />);
    expect(screen.getByRole('heading', { name: /^2\.12/ })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /^New/ }));
    expect(screen.queryByRole('heading', { name: /^2\.12/ })).not.toBeInTheDocument();
    expect(screen.queryByText('Bulk approvals keep the last row.')).not.toBeInTheDocument();
  });

  it('says what will appear when there are no releases', () => {
    render(<Changelog releases={[]} />);
    expect(screen.getByRole('status')).toHaveTextContent('Nothing released yet');
  });
});
