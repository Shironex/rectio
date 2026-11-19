import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Stepper } from './stepper';

const steps = [
  { title: 'Company' },
  { title: 'Bank account' },
  { title: 'Tax settings', description: 'VAT number and rates' },
  { title: 'Invite team' },
];

describe('Stepper', () => {
  it('marks the current step and says each status in words', () => {
    render(<Stepper steps={steps} current={2} label="Setup" />);
    const list = screen.getByRole('list', { name: 'Setup' });
    const items = within(list).getAllByRole('listitem');
    expect(items[2]).toHaveAttribute('aria-current', 'step');
    expect(items[0]).toHaveTextContent('Company, completed');
    expect(items[3]).toHaveTextContent('Invite team, not started');
  });

  it('shows an error step in words', () => {
    render(
      <Stepper steps={[{ title: 'Upload' }, { title: 'Match', status: 'error' }]} current={1} />,
    );
    expect(screen.getByText(', needs attention')).toBeInTheDocument();
  });

  it('lets completed steps be revisited, and only those', async () => {
    const onStepSelect = vi.fn();
    render(<Stepper steps={steps} current={2} onStepSelect={onStepSelect} />);
    expect(screen.getAllByRole('button')).toHaveLength(2);
    await userEvent.click(screen.getByRole('button', { name: /Bank account/ }));
    expect(onStepSelect).toHaveBeenCalledWith(1);
  });
});
