import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { EmptyState } from './empty-state';

describe('EmptyState', () => {
  it('says what is missing and offers the way out', () => {
    render(
      <EmptyState
        icon={<svg />}
        title="No invoices yet"
        description="Invoices you send appear here."
        actions={<button type="button">New invoice</button>}
      />,
    );
    expect(screen.getByText('No invoices yet')).toBeInTheDocument();
    expect(screen.getByText('Invoices you send appear here.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'New invoice' })).toBeInTheDocument();
  });

  it('takes a role, such as status, when it replaces content that was loading', () => {
    render(<EmptyState role="status" size="sm" variant="dashed" title="Nothing matches" />);
    expect(screen.getByRole('status')).toHaveClass('border-dashed');
  });
});
