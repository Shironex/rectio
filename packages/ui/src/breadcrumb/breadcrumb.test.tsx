import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { Breadcrumb, collapseBreadcrumb } from './breadcrumb';

const trail = [
  { label: 'Finance', href: '/finance' },
  { label: 'Receivables', href: '/finance/receivables' },
  { label: 'Customers', href: '/finance/receivables/customers' },
  { label: 'Northwind', href: '/finance/receivables/customers/northwind' },
  { label: 'INV-2041' },
];

describe('collapseBreadcrumb', () => {
  it('keeps the first item and the last ones, hiding the middle', () => {
    expect(collapseBreadcrumb([1, 2, 3, 4, 5], 3)).toEqual({
      head: [1],
      hidden: [2, 3],
      tail: [4, 5],
    });
    expect(collapseBreadcrumb([1, 2, 3], 4)).toEqual({ head: [1, 2, 3], hidden: [], tail: [] });
  });
});

describe('Breadcrumb', () => {
  it('is a named landmark with links and the current page marked', () => {
    render(<Breadcrumb items={trail} maxItems={10} collapseOnPhone={false} />);
    const nav = screen.getByRole('navigation', { name: 'Breadcrumb' });
    expect(within(nav).getAllByRole('link')).toHaveLength(4);
    expect(within(nav).getByText('INV-2041')).toHaveAttribute('aria-current', 'page');
  });

  it('collapses the middle into a menu of the hidden levels', async () => {
    render(<Breadcrumb items={trail} maxItems={3} collapseOnPhone={false} />);
    const nav = screen.getByRole('navigation', { name: 'Breadcrumb' });
    expect(
      within(nav)
        .getAllByRole('link')
        .map((link) => link.textContent),
    ).toEqual(['Finance', 'Northwind']);
    await userEvent.click(within(nav).getByRole('button', { name: 'Show hidden levels' }));
    const menu = await screen.findByRole('menu');
    expect(
      within(menu)
        .getAllByRole('menuitem')
        .map((item) => item.textContent),
    ).toEqual(['Receivables', 'Customers']);
  });

  it('on a phone, leads with a menu of every level above the current page', async () => {
    render(<Breadcrumb items={trail} maxItems={10} />);
    const nav = screen.getByRole('navigation', { name: 'Breadcrumb' });
    // Only one menu exists without collapsing the middle: the phone one, shown below `sm`.
    const trigger = within(nav).getByRole('button', { name: 'Show hidden levels' });
    expect(trigger.closest('li')).toHaveClass('sm:hidden');
    for (const link of within(nav).getAllByRole('link'))
      expect(link.closest('li')).toHaveClass('max-sm:hidden');
    expect(within(nav).getByText('INV-2041').closest('li')).not.toHaveClass('max-sm:hidden');
    await userEvent.click(trigger);
    expect(
      within(await screen.findByRole('menu'))
        .getAllByRole('menuitem')
        .map((item) => item.textContent),
    ).toEqual(['Finance', 'Receivables', 'Customers', 'Northwind']);
  });

  it('draws links through renderLink', () => {
    render(
      <Breadcrumb
        items={trail.slice(0, 2)}
        renderLink={({ href, className, children }) => (
          <a href={`#${href}`} className={className} data-router="">
            {children}
          </a>
        )}
      />,
    );
    expect(screen.getByRole('link', { name: 'Finance' })).toHaveAttribute('data-router');
  });
});
