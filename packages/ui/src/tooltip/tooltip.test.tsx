import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';

function renderTooltip() {
  render(
    <TooltipProvider delay={0}>
      <Tooltip>
        <TooltipTrigger aria-label="Export">E</TooltipTrigger>
        <TooltipContent shortcut="mod+e">Export to CSV</TooltipContent>
      </Tooltip>
    </TooltipProvider>,
  );
  return screen.getByRole('button', { name: 'Export' });
}

describe('Tooltip', () => {
  it('opens on keyboard focus with its label and shortcut, and closes on Escape', async () => {
    const trigger = renderTooltip();
    await userEvent.tab();
    expect(trigger).toHaveFocus();
    const tooltip = await screen.findByText('Export to CSV');
    expect(tooltip.closest('[data-slot="tooltip"]')).toHaveTextContent('Control E');
    await userEvent.keyboard('{Escape}');
    await waitFor(() => {
      expect(screen.queryByText('Export to CSV')).not.toBeInTheDocument();
    });
  });

  it('opens on hover', async () => {
    const trigger = renderTooltip();
    await userEvent.hover(trigger);
    expect(await screen.findByText('Export to CSV')).toBeInTheDocument();
  });
});
