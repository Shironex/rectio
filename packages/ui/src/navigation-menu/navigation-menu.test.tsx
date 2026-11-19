import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import {
  NavigationBar,
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuPanelLink,
  NavigationMenuTrigger,
} from './navigation-menu';

function TopNav() {
  return (
    <NavigationMenu aria-label="Main">
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Products</NavigationMenuTrigger>
          <NavigationMenuContent>
            <NavigationMenuPanelLink
              href="/invoicing"
              title="Invoicing"
              description="Send, chase and reconcile."
            />
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink href="/pricing" active>
            Pricing
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}

describe('NavigationMenu', () => {
  it('opens a panel from its trigger and closes it on Escape', async () => {
    render(<TopNav />);
    const trigger = screen.getByRole('button', { name: 'Products' });
    await userEvent.click(trigger);
    expect(await screen.findByRole('link', { name: /Invoicing/ })).toBeInTheDocument();
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await userEvent.keyboard('{Escape}');
    await waitFor(() => {
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });
  });

  it('marks the link of the current page', () => {
    render(<TopNav />);
    expect(screen.getByRole('link', { name: 'Pricing' })).toHaveAttribute('aria-current', 'page');
  });
});

describe('NavigationBar', () => {
  it('opens the phone menu in a sheet and closes it when a link is followed', async () => {
    render(
      <NavigationBar
        brand={<a href="/">Ledgerly</a>}
        mobileMenu={(close) => (
          <a href="/pricing" onClick={close}>
            Pricing
          </a>
        )}
      >
        <TopNav />
      </NavigationBar>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Menu' }));
    const sheet = await screen.findByRole('dialog', { name: 'Menu' });
    await userEvent.click(within(sheet).getByRole('link', { name: 'Pricing' }));
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});
