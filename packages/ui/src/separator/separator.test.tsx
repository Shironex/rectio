import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Separator } from './separator';

describe('Separator', () => {
  it('is a separator in either orientation', () => {
    render(<Separator orientation="vertical" />);
    expect(screen.getByRole('separator')).toHaveAttribute('aria-orientation', 'vertical');
  });

  it('reads its label while the two rules stay separators', () => {
    render(<Separator label="or" />);
    expect(screen.getByText('or')).toBeInTheDocument();
    expect(screen.getAllByRole('separator')).toHaveLength(2);
  });
});
