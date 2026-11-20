import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  ApiKeys,
  Billing,
  CommentThread,
  FileManager,
  NotificationsCenter,
  TwoFactor,
} from '../../src/index';

// The SaaS blocks build on the kit's shared pieces instead of their own copies, so a fix or a
// theme change in @rectio/ui reaches them too.
describe('SaaS blocks on the kit pieces', () => {
  it('takes the code in the kit OtpInput, split in two halves', () => {
    const { container } = render(<TwoFactor onVerify={vi.fn()} />);
    expect(container.querySelector('[data-slot="otp-input"]')).not.toBeNull();
    expect(container.querySelectorAll('[data-slot="otp-input-slot"]')).toHaveLength(6);
    expect(screen.getByRole('textbox', { name: 'Digit 2 of 6' })).toBeInTheDocument();
  });

  it('draws the send shortcut with the kit Kbd', () => {
    const { container } = render(
      <CommentThread comments={[]} writer={{ id: 'me', name: 'Niamh Walsh' }} onAdd={vi.fn()} />,
    );
    expect(container.querySelectorAll('[data-slot="kbd"]')).toHaveLength(2);
  });

  it('measures usage and storage with the kit Meter', () => {
    const { container: billing } = render(
      <Billing
        plan={{
          id: 'p',
          name: 'Growth',
          price: 10,
          interval: 'month',
          status: 'active',
          renewsOn: new Date(2026, 3, 1),
        }}
        usage={[{ id: 'runs', label: 'Runs', used: 8420, limit: 10000, unit: 'runs' }]}
        currency="EUR"
        locale="en-GB"
        today={new Date(2026, 2, 19)}
      />,
    );
    const usage = billing.querySelector('[data-slot="meter"]');
    expect(usage).toHaveAttribute('data-variant', 'bar');
    expect(screen.getByRole('meter', { name: 'Runs' })).toHaveAttribute(
      'aria-valuetext',
      '8,420 of 10,000 runs',
    );

    const { container: files } = render(
      <FileManager
        path={[{ id: 'root', name: 'Files' }]}
        entries={[{ id: 'a', name: 'notes', type: 'file', size: 100, modified: new Date() }]}
        storage={{ used: 9.5e9, total: 1e10 }}
      />,
    );
    expect(files.querySelector('[data-slot="meter"]')).toHaveAttribute('data-variant', 'bar');
  });

  it('shows empty lists with the kit EmptyState', () => {
    const { container: keys } = render(<ApiKeys keys={[]} scopes={[]} onCreate={vi.fn()} />);
    expect(keys.querySelector('[data-slot="empty-state"]')).toHaveTextContent('No API keys yet');
    const { container: bell } = render(
      <NotificationsCenter
        inline
        notifications={[]}
        onMarkRead={vi.fn()}
        onMarkAllRead={vi.fn()}
      />,
    );
    expect(bell.querySelector('[data-slot="empty-state"]')).toHaveTextContent(
      'No notifications yet',
    );
  });
});
