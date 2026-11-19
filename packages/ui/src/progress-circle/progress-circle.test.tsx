import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ProgressCircle } from './progress-circle';

describe('ProgressCircle', () => {
  it('is a named progressbar whose arc follows the value', () => {
    const { container } = render(<ProgressCircle value={40} label="Profile complete" />);
    expect(screen.getByRole('progressbar', { name: 'Profile complete' })).toHaveAttribute(
      'aria-valuenow',
      '40',
    );
    const arc = container.querySelectorAll('circle')[1];
    expect(arc).toHaveAttribute('stroke-dasharray', '40 100');
    expect(screen.getByText('40%')).toBeInTheDocument();
  });

  it('takes its own figure, and spins a short arc while indeterminate', () => {
    render(
      <ProgressCircle value={3} max={5} label="Steps done">
        3/5
      </ProgressCircle>,
    );
    expect(screen.getByText('3/5')).toBeInTheDocument();
    const { container } = render(<ProgressCircle value={null} label="Waiting" />);
    expect(container.querySelector('svg')).toHaveClass('animate-spin');
  });
});
