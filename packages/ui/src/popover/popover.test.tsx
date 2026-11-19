import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { Button } from '../button/button';
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
} from './popover';

function renderPopover() {
  render(
    <Popover>
      <PopoverTrigger render={<Button variant="secondary" />}>Filters</PopoverTrigger>
      <PopoverContent showClose>
        <PopoverTitle>Filter invoices</PopoverTitle>
        <PopoverDescription>Applies to the list below.</PopoverDescription>
        <input aria-label="Customer" />
      </PopoverContent>
    </Popover>,
  );
  return screen.getByRole('button', { name: 'Filters' });
}

describe('Popover', () => {
  it('opens a named dialog from its trigger and reports it as expanded', async () => {
    const trigger = renderPopover();
    await userEvent.click(trigger);
    const popover = await screen.findByRole('dialog', { name: 'Filter invoices' });
    expect(popover).toHaveAccessibleDescription('Applies to the list below.');
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });

  it('closes on Escape and returns focus to the trigger', async () => {
    const trigger = renderPopover();
    await userEvent.click(trigger);
    await screen.findByRole('dialog');
    await userEvent.keyboard('{Escape}');
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    expect(trigger).toHaveFocus();
  });

  it('closes from its named close button', async () => {
    renderPopover();
    await userEvent.click(screen.getByRole('button', { name: 'Filters' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Close' }));
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});
