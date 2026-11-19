import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { HoverCard, HoverCardContent, HoverCardTrigger } from './hover-card';

describe('HoverCard', () => {
  it('stays an ordinary link and previews on hover', async () => {
    render(
      <HoverCard>
        <HoverCardTrigger href="/customers/northwind" delay={0}>
          Northwind Traders
        </HoverCardTrigger>
        <HoverCardContent>
          <p>12 open invoices</p>
        </HoverCardContent>
      </HoverCard>,
    );
    const link = screen.getByRole('link', { name: 'Northwind Traders' });
    expect(link).toHaveAttribute('href', '/customers/northwind');
    await userEvent.hover(link);
    expect(await screen.findByText('12 open invoices')).toBeInTheDocument();
    await userEvent.unhover(link);
    await waitFor(() => {
      expect(screen.queryByText('12 open invoices')).not.toBeInTheDocument();
    });
  });
});
