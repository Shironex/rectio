import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Timeline, TimelineItem } from './timeline';

describe('Timeline', () => {
  it('is an ordered list of events with machine-readable times', () => {
    render(
      <Timeline>
        <TimelineItem
          title="Invoice sent"
          time={{ dateTime: '2026-03-02T09:14', label: '2 Mar, 09:14' }}
        />
        <TimelineItem title="Viewed by the client" tone="accent" icon={<svg />} />
        <TimelineItem title="Paid" tone="positive">
          Bank transfer, reference 4471.
        </TimelineItem>
      </Timeline>,
    );
    const list = screen.getByRole('list');
    expect(list.tagName).toBe('OL');
    expect(within(list).getAllByRole('listitem')).toHaveLength(3);
    expect(screen.getByText('2 Mar, 09:14')).toHaveAttribute('datetime', '2026-03-02T09:14');
    expect(screen.getByText('Bank transfer, reference 4471.')).toBeInTheDocument();
  });
});
