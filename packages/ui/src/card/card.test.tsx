import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Card, CardAction, CardContent, CardFooter, CardHeader, CardLink, CardTitle } from './card';

describe('Card', () => {
  it('holds a titled unit with content and a footer', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Team plan</CardTitle>
          <CardAction>
            <button type="button">Options</button>
          </CardAction>
        </CardHeader>
        <CardContent>12 seats</CardContent>
        <CardFooter>Renews 1 May</CardFooter>
      </Card>,
    );
    expect(screen.getByRole('heading', { name: 'Team plan' })).toBeInTheDocument();
    expect(screen.getByText('Renews 1 May')).toBeInTheDocument();
  });

  it('as an interactive card is one link target named by its link text', () => {
    const { container } = render(
      <Card interactive>
        <CardHeader>
          <CardTitle>
            <CardLink href="/reports/q1">Q1 report</CardLink>
          </CardTitle>
        </CardHeader>
      </Card>,
    );
    expect(screen.getByRole('link', { name: 'Q1 report' })).toHaveClass('after:inset-0');
    expect(container.firstElementChild).toHaveAttribute('data-interactive', 'true');
  });
});
