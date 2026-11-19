import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { Banner } from './banner';

describe('Banner', () => {
  it('is a named region with its message and action', () => {
    render(
      <Banner action={<a href="#changes">See what changed</a>}>
        Scheduled maintenance on Sunday, 02:00 to 03:00 CET.
      </Banner>,
    );
    const region = screen.getByRole('region', { name: 'Announcement' });
    expect(region).toHaveTextContent('Scheduled maintenance');
    expect(screen.getByRole('link', { name: 'See what changed' })).toBeInTheDocument();
  });

  it('dismisses from the keyboard', async () => {
    render(<Banner dismissible>New: bulk approvals.</Banner>);
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Dismiss announcement' })).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
  });
});
