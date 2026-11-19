import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Badge } from './badge';

describe('Badge', () => {
  it('says the state in words and exposes the tone for themes', () => {
    render(<Badge tone="negative">Overdue</Badge>);
    const badge = screen.getByText('Overdue');
    expect(badge).toHaveAttribute('data-tone', 'negative');
    expect(badge).toHaveClass('text-negative-strong');
  });

  it('is neutral by default', () => {
    render(<Badge>Draft</Badge>);
    expect(screen.getByText('Draft')).toHaveAttribute('data-tone', 'neutral');
  });
});
