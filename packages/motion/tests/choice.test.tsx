import { Toggle } from '@rectio/ui';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { MotionPreferenceProvider } from '../src/lib/mode';
import { Switch, SwitchField } from '../src/switch/switch';
import { SegmentedControl, ToggleGroup } from '../src/toggle/toggle';

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
  Object.defineProperty(Element.prototype, 'animate', {
    configurable: true,
    value: vi.fn(),
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
  Reflect.deleteProperty(Element.prototype, 'animate');
});

function Period() {
  return (
    <ToggleGroup aria-label="Period" defaultValue={['week']}>
      <Toggle value="day">Day</Toggle>
      <Toggle value="week">Week</Toggle>
    </ToggleGroup>
  );
}

describe('motioned Switch', () => {
  it('marks itself and still toggles', async () => {
    browser({ reduce: false });
    render(<Switch aria-label="Email receipts" />);
    const toggle = screen.getByRole('switch', { name: 'Email receipts' });
    expect(toggle).toHaveAttribute('data-motion');
    await userEvent.click(toggle);
    expect(toggle).toBeChecked();
  });

  it('keeps the label, description and state of SwitchField', async () => {
    browser({ reduce: false });
    render(<SwitchField label="Card payments" description="Let members pay invoices by card." />);
    const toggle = screen.getByRole('switch', { name: 'Card payments' });
    expect(toggle).toHaveAttribute('data-motion');
    expect(toggle).toHaveAccessibleDescription('Let members pay invoices by card.');
    await userEvent.click(screen.getByText('Card payments'));
    expect(toggle).toBeChecked();
  });

  it('is the plain switch under reduced motion and when the app turns motion off', () => {
    browser({ reduce: true });
    const { unmount } = render(<Switch aria-label="Reduced" />);
    expect(screen.getByRole('switch', { name: 'Reduced' })).not.toHaveAttribute('data-motion');
    unmount();
    browser({ reduce: false });
    render(
      <MotionPreferenceProvider value="off">
        <Switch aria-label="Off" />
      </MotionPreferenceProvider>,
    );
    expect(screen.getByRole('switch', { name: 'Off' })).not.toHaveAttribute('data-motion');
  });
});

describe('motioned ToggleGroup', () => {
  it('draws one indicator and hands it the pressed chip', async () => {
    browser({ reduce: false });
    render(<Period />);
    const group = screen.getByRole('group', { name: 'Period' });
    expect(group).toHaveAttribute('data-glide');
    const indicator = group.querySelector('[data-part="indicator"]');
    expect(indicator).toHaveAttribute('aria-hidden', 'true');
    // Placed at once on the first draw: shown, without a slide.
    expect(indicator).toHaveStyle({ opacity: '1' });
    await userEvent.click(screen.getByRole('button', { name: 'Day' }));
    expect(screen.getByRole('button', { name: 'Day' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getAllByRole('button')).toHaveLength(2);
  });

  it('is the plain group with multiple selection or reduced motion', () => {
    browser({ reduce: false });
    const { unmount } = render(
      <ToggleGroup aria-label="Status" multiple>
        <Toggle value="open">Open</Toggle>
      </ToggleGroup>,
    );
    expect(screen.getByRole('group', { name: 'Status' })).not.toHaveAttribute('data-motion');
    unmount();
    browser({ reduce: true });
    render(<Period />);
    expect(screen.getByRole('group', { name: 'Period' })).not.toHaveAttribute('data-glide');
  });
});

describe('motioned SegmentedControl', () => {
  const options = [
    { value: 'day', label: 'Day' },
    { value: 'week', label: 'Week' },
    { value: 'month', label: 'Month' },
  ];

  it('glides one indicator to the chosen option and reports a single value', async () => {
    browser({ reduce: false });
    const onValueChange = vi.fn();
    render(
      <SegmentedControl
        label="Period"
        options={options}
        defaultValue="week"
        onValueChange={onValueChange}
      />,
    );
    const group = screen.getByRole('group', { name: 'Period' });
    expect(group).toHaveAttribute('data-glide');
    expect(group.querySelectorAll('[data-part="indicator"]')).toHaveLength(1);
    await userEvent.click(screen.getByRole('button', { name: 'Month' }));
    expect(onValueChange).toHaveBeenLastCalledWith('month');
    expect(screen.getAllByRole('button')).toHaveLength(3);
  });

  it('is the plain control under reduced motion', () => {
    browser({ reduce: true });
    render(<SegmentedControl label="Period" options={options} defaultValue="week" />);
    const group = screen.getByRole('group', { name: 'Period' });
    expect(group).not.toHaveAttribute('data-glide');
    expect(group.querySelector('[data-part="indicator"]')).toBeNull();
  });
});
