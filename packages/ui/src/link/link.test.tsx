import { render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { describe, expect, it } from 'vitest';

import { Breadcrumb } from '../breadcrumb/breadcrumb';
import { CardLink } from '../card/card';
import { Menu, MenuContent, MenuLinkItem, MenuTrigger } from '../menu/menu';
import { Pagination } from '../pagination/pagination-bar';
import { isExternalHref, isHashHref } from './href';
import { Anchor, LinkProvider } from './link';

/** A stand-in router link that prefixes a base path, as Next does under `basePath`. */
function RouterLink({ href, ...props }: ComponentProps<'a'> & { href: string }) {
  return <a data-router="" href={`/base${href}`} {...props} />;
}

function withRouter(node: React.ReactNode) {
  return <LinkProvider render={(props) => <RouterLink {...props} />}>{node}</LinkProvider>;
}

describe('isExternalHref', () => {
  it('tells addresses that leave the app from internal ones', () => {
    expect(isExternalHref('https://example.com')).toBe(true);
    expect(isExternalHref('mailto:a@example.com')).toBe(true);
    expect(isExternalHref('tel:+441234')).toBe(true);
    expect(isExternalHref('//cdn.example.com/x')).toBe(true);
    expect(isExternalHref('/pricing')).toBe(false);
    expect(isExternalHref('pricing')).toBe(false);
    expect(isHashHref('#faq')).toBe(true);
    expect(isHashHref('/#faq')).toBe(false);
  });
});

describe('Anchor', () => {
  it('is a plain anchor without a provider', () => {
    render(<Anchor href="/pricing">Pricing</Anchor>);
    expect(screen.getByRole('link', { name: 'Pricing' })).toHaveAttribute('href', '/pricing');
  });

  it('goes through the router link of the provider for internal addresses', () => {
    render(withRouter(<Anchor href="/pricing">Pricing</Anchor>));
    const link = screen.getByRole('link', { name: 'Pricing' });
    expect(link).toHaveAttribute('href', '/base/pricing');
    expect(link).toHaveAttribute('data-router');
  });

  it('keeps links that leave the app or stay on the page plain', () => {
    render(
      withRouter(
        <>
          <Anchor href="https://example.com">Site</Anchor>
          <Anchor href="#faq">FAQ</Anchor>
          <Anchor href="mailto:a@example.com">Mail</Anchor>
        </>,
      ),
    );
    expect(screen.getByRole('link', { name: 'Site' })).toHaveAttribute(
      'href',
      'https://example.com',
    );
    expect(screen.getByRole('link', { name: 'FAQ' })).toHaveAttribute('href', '#faq');
    expect(screen.getByRole('link', { name: 'Mail' })).not.toHaveAttribute('data-router');
  });

  it('opens an external link in a new tab and says so', () => {
    render(
      withRouter(
        <Anchor href="/docs" external>
          Docs
        </Anchor>,
      ),
    );
    const link = screen.getByRole('link', { name: /^Docs\s*\(opens in a new tab\)$/ });
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(link).toHaveAttribute('href', '/docs');
  });
});

describe('components that draw links', () => {
  it('route breadcrumb levels, card links and page links through the provider', () => {
    render(
      withRouter(
        <>
          <Breadcrumb
            items={[{ label: 'Customers', href: '/customers' }, { label: 'Hale' }]}
            collapseOnPhone={false}
          />
          <CardLink href="/customers/hale">Hale and Sons</CardLink>
          <Pagination page={1} pageCount={3} getHref={(page) => `/list?page=${page}`} />
        </>,
      ),
    );
    expect(screen.getByRole('link', { name: 'Customers' })).toHaveAttribute(
      'href',
      '/base/customers',
    );
    expect(screen.getByRole('link', { name: 'Hale and Sons' })).toHaveAttribute(
      'href',
      '/base/customers/hale',
    );
    for (const link of screen
      .getAllByRole('link')
      .filter((l) => l.getAttribute('href')?.includes('page=2') === true)) {
      expect(link).toHaveAttribute('href', '/base/list?page=2');
    }
  });

  it('routes a menu link row through the provider', async () => {
    render(
      withRouter(
        <Menu defaultOpen>
          <MenuTrigger>Account</MenuTrigger>
          <MenuContent>
            <MenuLinkItem href="/settings">Settings</MenuLinkItem>
          </MenuContent>
        </Menu>,
      ),
    );
    expect(await screen.findByRole('menuitem', { name: 'Settings' })).toHaveAttribute(
      'href',
      '/base/settings',
    );
  });
});
