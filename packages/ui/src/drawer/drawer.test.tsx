import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Button } from '../button/button';
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  type DrawerSide,
} from './drawer';

/** A screen of phone width or wider. */
function screenWidth({ phone }: { phone: boolean }) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches: phone && query.includes('40rem'),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

function renderDrawer(side?: DrawerSide) {
  render(
    <Drawer {...(side === undefined ? {} : { side })}>
      <DrawerTrigger render={<Button />}>Filters</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Filter expenses</DrawerTitle>
          <DrawerDescription>By status, owner and date.</DrawerDescription>
        </DrawerHeader>
        <DrawerBody>
          <input aria-label="Owner" />
        </DrawerBody>
        <DrawerFooter>
          <Button>Apply</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>,
  );
  return screen.getByRole('button', { name: 'Filters' });
}

describe('Drawer', () => {
  it('is a side panel on a wide screen', async () => {
    screenWidth({ phone: false });
    await userEvent.click(renderDrawer());
    const drawer = await screen.findByRole('dialog', { name: 'Filter expenses' });
    expect(drawer).toHaveAttribute('data-side', 'right');
    expect(drawer).toHaveAccessibleDescription('By status, owner and date.');
  });

  it('opens on the side it is given on a wide screen', async () => {
    screenWidth({ phone: false });
    await userEvent.click(renderDrawer('left'));
    expect(await screen.findByRole('dialog')).toHaveAttribute('data-side', 'left');
  });

  it('is a bottom sheet with a drag handle on a phone, whatever its side', async () => {
    screenWidth({ phone: true });
    await userEvent.click(renderDrawer('left'));
    const drawer = await screen.findByRole('dialog');
    expect(drawer).toHaveAttribute('data-side', 'bottom');
    expect(drawer.querySelector('[aria-hidden].rounded-full')).not.toBeNull();
  });

  it('traps the focus and closes on Escape, back to the trigger', async () => {
    screenWidth({ phone: true });
    const trigger = renderDrawer();
    await userEvent.click(trigger);
    const drawer = await screen.findByRole('dialog');
    await waitFor(() => {
      expect(drawer).toContainElement(document.activeElement as HTMLElement);
    });
    await userEvent.keyboard('{Escape}');
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    expect(trigger).toHaveFocus();
  });

  it('stacks the footer actions at full width on a phone', async () => {
    screenWidth({ phone: true });
    await userEvent.click(renderDrawer());
    const apply = await screen.findByRole('button', { name: 'Apply' });
    expect(apply.parentElement?.className).toContain('max-sm:flex-col-reverse');
  });
});
