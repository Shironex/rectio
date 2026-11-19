import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { Tabs, TabsList, TabsPanel, TabsTab, type TabsVariant } from './tabs';

function renderTabs(variant: TabsVariant) {
  render(
    <Tabs defaultValue="open">
      <TabsList variant={variant} aria-label="Invoices">
        <TabsTab value="open" hint={12}>
          Open
        </TabsTab>
        <TabsTab value="paid">Paid</TabsTab>
        <TabsTab value="void" disabled>
          Void
        </TabsTab>
      </TabsList>
      <TabsPanel value="open">Twelve open invoices</TabsPanel>
      <TabsPanel value="paid">Paid this month</TabsPanel>
      <TabsPanel value="void">Voided</TabsPanel>
    </Tabs>,
  );
}

describe.each(['line', 'segmented'] as const)('Tabs (%s)', (variant) => {
  it('marks the active tab and shows its panel', () => {
    renderTabs(variant);
    expect(screen.getByRole('tablist', { name: 'Invoices' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Open/ })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Twelve open invoices');
  });

  it('moves and activates with the arrow keys; a disabled tab takes focus but not the panel', async () => {
    renderTabs(variant);
    await userEvent.tab();
    expect(screen.getByRole('tab', { name: /Open/ })).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    const paid = screen.getByRole('tab', { name: 'Paid' });
    expect(paid).toHaveFocus();
    expect(paid).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Paid this month');
    await userEvent.keyboard('{ArrowRight}');
    const voided = screen.getByRole('tab', { name: 'Void' });
    expect(voided).toHaveFocus();
    expect(voided).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Paid this month');
  });

  it('draws one indicator inside the list', () => {
    renderTabs(variant);
    const list = screen.getByRole('tablist');
    expect(list.querySelectorAll('[data-slot="tabs-indicator"]')).toHaveLength(1);
    expect(list).toHaveAttribute('data-variant', variant);
  });
});
