import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '../dialog/dialog';

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarInset,
  SidebarItem,
  SidebarProvider,
  SidebarSubItem,
  SidebarSubmenu,
  SidebarTrigger,
  type SidebarProviderProps,
} from './sidebar';

afterEach(() => {
  vi.unstubAllGlobals();
});

/** Pretends the viewport is a phone (below the medium breakpoint) or a desktop. */
function viewport(phone: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches: phone && query.includes('48rem'),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
}

function App(props: Partial<SidebarProviderProps>) {
  return (
    <SidebarProvider {...props}>
      <Sidebar label="Main">
        <SidebarContent>
          <SidebarGroup label="Finance">
            <SidebarItem href="/overview" icon={<span>o</span>} active>
              Overview
            </SidebarItem>
            <SidebarSubmenu label="Receivables" icon={<span>r</span>} active>
              <SidebarSubItem href="/invoices" active>
                Invoices
              </SidebarSubItem>
              <SidebarSubItem href="/customers">Customers</SidebarSubItem>
            </SidebarSubmenu>
            <SidebarItem href="/payables" icon={<span>p</span>} badge={4}>
              Payables
            </SidebarItem>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <SidebarTrigger />
      </SidebarInset>
    </SidebarProvider>
  );
}

describe('Sidebar on desktop', () => {
  it('is a named navigation landmark with the current page marked', () => {
    viewport(false);
    render(<App />);
    const nav = screen.getByRole('navigation', { name: 'Main' });
    expect(within(nav).getByRole('group', { name: 'Finance' })).toBeInTheDocument();
    expect(within(nav).getByRole('link', { name: 'Overview' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('opens a submenu that holds the current page, and folds it with its button', async () => {
    viewport(false);
    render(<App />);
    const section = screen.getByRole('button', { name: 'Receivables' });
    expect(section).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('link', { name: 'Invoices' })).toHaveAttribute('aria-current', 'page');
    await userEvent.click(section);
    expect(section).toHaveAttribute('aria-expanded', 'false');
  });

  it('collapses to an icon rail with the trigger, keeping names for every item', async () => {
    viewport(false);
    const onCollapsedChange = vi.fn();
    render(<App onCollapsedChange={onCollapsedChange} />);
    const trigger = screen.getByRole('button', { name: 'Collapse sidebar' });
    expect(trigger).not.toHaveAttribute('aria-expanded');
    await userEvent.click(trigger);
    expect(onCollapsedChange).toHaveBeenLastCalledWith(true);
    expect(screen.getByRole('button', { name: 'Expand sidebar' })).toBeInTheDocument();
    const nav = screen.getByRole('navigation', { name: 'Main' });
    expect(nav.closest('[data-slot="sidebar"]')).toHaveAttribute('data-collapsed');
    // Labels and counts stay in the accessible name; the rail draws a dot for the count.
    const payables = within(nav).getByRole('link', { name: /Payables\s*4/ });
    expect(payables.querySelector('[data-slot="sidebar-rail-badge"]')).not.toBeNull();
  });

  it('opens a collapsed submenu as a flyout menu of its links', async () => {
    viewport(false);
    render(<App defaultCollapsed />);
    await userEvent.click(screen.getByRole('button', { name: 'Receivables' }));
    const menu = await screen.findByRole('menu');
    expect(within(menu).getByRole('menuitem', { name: 'Invoices' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('toggles with its shortcut, but not while typing in a field', async () => {
    viewport(false);
    const onCollapsedChange = vi.fn();
    render(
      <>
        <App onCollapsedChange={onCollapsedChange} />
        <input aria-label="Memo" />
      </>,
    );
    await userEvent.keyboard('{Control>}b{/Control}');
    expect(onCollapsedChange).toHaveBeenLastCalledWith(true);
    screen.getByRole('textbox', { name: 'Memo' }).focus();
    await userEvent.keyboard('{Control>}b{/Control}');
    expect(onCollapsedChange).toHaveBeenCalledTimes(1);
  });

  it('does not fold behind a modal dialog the user is in', async () => {
    viewport(false);
    const onCollapsedChange = vi.fn();
    render(
      <>
        <App onCollapsedChange={onCollapsedChange} />
        <Dialog>
          <DialogTrigger>Settings</DialogTrigger>
          <DialogContent>
            <DialogTitle>Settings</DialogTitle>
          </DialogContent>
        </Dialog>
      </>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Settings' }));
    await screen.findByRole('dialog', { name: 'Settings' });
    await userEvent.keyboard('{Control>}b{/Control}');
    expect(onCollapsedChange).not.toHaveBeenCalled();
  });

  it('follows a controlled collapsed value', () => {
    viewport(false);
    render(<App collapsed />);
    expect(screen.getByRole('button', { name: 'Expand sidebar' })).toBeInTheDocument();
  });
});

describe('Sidebar on a phone', () => {
  it('is an off-canvas sheet opened by the trigger and closed by following a link', async () => {
    viewport(true);
    render(<App />);
    expect(screen.queryByRole('navigation', { name: 'Main' })).not.toBeInTheDocument();
    const trigger = screen.getByRole('button', { name: 'Open navigation' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(trigger);
    const sheet = await screen.findByRole('dialog', { name: 'Main' });
    const link = within(sheet).getByRole('link', { name: /Payables/ });
    // The phone sheet always shows labels and counts.
    expect(link).toHaveTextContent('4');
    await userEvent.click(link);
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('opens and closes its own sheet with the shortcut, but not under another dialog', async () => {
    viewport(true);
    render(
      <>
        <App />
        <Dialog>
          <DialogTrigger>Settings</DialogTrigger>
          <DialogContent>
            <DialogTitle>Settings</DialogTitle>
          </DialogContent>
        </Dialog>
      </>,
    );
    await userEvent.keyboard('{Control>}b{/Control}');
    await screen.findByRole('dialog', { name: 'Main' });
    // Pressed inside its own sheet, the shortcut closes it.
    await userEvent.keyboard('{Control>}b{/Control}');
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'Main' })).not.toBeInTheDocument();
    });
    // Another dialog open: the shortcut leaves the sheet shut.
    await userEvent.click(screen.getByRole('button', { name: 'Settings' }));
    await screen.findByRole('dialog', { name: 'Settings' });
    await userEvent.keyboard('{Control>}b{/Control}');
    expect(screen.queryByRole('dialog', { name: 'Main' })).not.toBeInTheDocument();
  });
});
