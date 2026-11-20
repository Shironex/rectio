import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ViewerControls } from './viewer-controls';

const pages = [
  { route: '/', path: '/', label: 'Home' },
  { route: '/invoices', path: '/invoices', label: 'Invoices' },
  { route: '/invoices/[id]', path: '/invoices/inv-2026-0171', label: 'INV-2026-0171' },
];

function setup(overrides: Partial<Parameters<typeof ViewerControls>[0]> = {}) {
  const props = {
    pages,
    route: '/',
    title: '',
    onRoute: vi.fn(),
    device: 'desktop' as const,
    onDevice: vi.fn(),
    look: { mode: 'light' as const },
    onLook: vi.fn(),
    ...overrides,
  };
  render(<ViewerControls {...props} />);
  return props;
}

describe('ViewerControls', () => {
  it('names the page on show by its title, falling back to the declared label', () => {
    setup({ route: '/invoices/[id]', title: 'INV-2026-0216' });
    expect(screen.getByRole('combobox', { name: 'Page' })).toHaveTextContent('INV-2026-0216');
  });

  it('opens a declared page, dynamic routes at their example', async () => {
    const props = setup({ title: 'Home' });
    await userEvent.click(screen.getByRole('combobox', { name: 'Page' }));
    await userEvent.click(await screen.findByRole('option', { name: /INV-2026-0171/ }));
    expect(props.onRoute).toHaveBeenCalledWith(pages[2]);
  });

  it('switches the width', async () => {
    const props = setup();
    await userEvent.click(screen.getByRole('button', { name: 'Phone' }));
    expect(props.onDevice).toHaveBeenCalledWith('phone', expect.anything());
  });

  it('changes the mode', async () => {
    const props = setup();
    await userEvent.click(screen.getByRole('button', { name: 'Dark' }));
    expect(props.onLook).toHaveBeenLastCalledWith({ mode: 'dark' });
  });

  it('marks the current choices as pressed', () => {
    setup({ device: 'tablet', look: { mode: 'dark' } });
    expect(screen.getByRole('button', { name: 'Tablet' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Dark' })).toHaveAttribute('aria-pressed', 'true');
  });
});
