import {
  Menu,
  MenuItem,
  MenuTrigger,
  Popover,
  PopoverTitle,
  PopoverTrigger,
  Tabs,
  TabsTab,
} from '@rectio/ui';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  MenuContent,
  MotionPreferenceProvider,
  PopoverContent,
  TabsList,
  TabsPanel,
} from '../src/navigation';

/** Pretends to be a browser that can animate, with the system's reduced motion set or not. */
function browser({ reduce }: { reduce: boolean }) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches: reduce && query.includes('prefers-reduced-motion: reduce'),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
  Object.defineProperty(Element.prototype, 'animate', { configurable: true, value: vi.fn() });
}

afterEach(() => {
  vi.unstubAllGlobals();
  Reflect.deleteProperty(Element.prototype, 'animate');
});

function Specimens() {
  return (
    <Tabs defaultValue="open">
      <TabsList aria-label="Invoices">
        <TabsTab value="open">Open</TabsTab>
        <TabsTab value="paid">Paid</TabsTab>
      </TabsList>
      <TabsPanel value="open">Open invoices</TabsPanel>
      <TabsPanel value="paid">Paid invoices</TabsPanel>
    </Tabs>
  );
}

const moving = (container: HTMLElement) => container.querySelectorAll('[data-motion]').length;

describe('motioned navigation', () => {
  it('marks the tabs list and panel in a browser that may animate', () => {
    browser({ reduce: false });
    const { container } = render(<Specimens />);
    expect(moving(container)).toBe(2);
    expect(container.querySelectorAll('[data-slot="tabs-indicator"]')).toHaveLength(1);
  });

  it('switches tabs as the plain ones do', async () => {
    browser({ reduce: false });
    render(<Specimens />);
    await userEvent.click(screen.getByRole('tab', { name: 'Paid' }));
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Paid invoices');
  });

  it('collapses to the plain tabs under reduced motion or when turned off', () => {
    browser({ reduce: true });
    const reduced = render(<Specimens />);
    expect(moving(reduced.container)).toBe(0);
    reduced.unmount();
    browser({ reduce: false });
    const off = render(
      <MotionPreferenceProvider value="off">
        <Specimens />
      </MotionPreferenceProvider>,
    );
    expect(moving(off.container)).toBe(0);
  });

  it('opens the menu with one gliding highlight, and runs items as the plain one', async () => {
    browser({ reduce: false });
    const onDuplicate = vi.fn();
    render(
      <Menu>
        <MenuTrigger>Actions</MenuTrigger>
        <MenuContent>
          <MenuItem onClick={onDuplicate}>Duplicate</MenuItem>
          <MenuItem>Void</MenuItem>
        </MenuContent>
      </Menu>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Actions' }));
    const menu = await screen.findByRole('menu');
    expect(menu).toHaveAttribute('data-motion');
    expect(menu.querySelectorAll('[data-part="highlight"]')).toHaveLength(1);
    await userEvent.click(screen.getByRole('menuitem', { name: 'Duplicate' }));
    expect(onDuplicate).toHaveBeenCalledTimes(1);
  });

  it('opens the popover as the plain one under reduced motion', async () => {
    browser({ reduce: true });
    render(
      <Popover>
        <PopoverTrigger>Filters</PopoverTrigger>
        <PopoverContent>
          <PopoverTitle>Filter invoices</PopoverTitle>
        </PopoverContent>
      </Popover>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Filters' }));
    const popover = await screen.findByRole('dialog', { name: 'Filter invoices' });
    expect(popover).not.toHaveAttribute('data-motion');
  });
});
