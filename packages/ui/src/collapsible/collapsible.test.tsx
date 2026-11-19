import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { Collapsible, CollapsiblePanel, CollapsibleTrigger } from './collapsible';

describe('Collapsible', () => {
  it('shows and hides its panel from the trigger', async () => {
    render(
      <Collapsible>
        <CollapsibleTrigger>Advanced options</CollapsibleTrigger>
        <CollapsiblePanel>Round to whole units</CollapsiblePanel>
      </Collapsible>,
    );
    const trigger = screen.getByRole('button', { name: 'Advanced options' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('Round to whole units')).not.toBeInTheDocument();
    await userEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Round to whole units')).toBeVisible();
  });
});
