import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Combobox, ComboboxInput } from '@rectio/ui';

import { ComboboxContent, ComboboxItem } from '../src/combobox/combobox';
import { MotionPreferenceProvider } from '../src/lib/mode';
import {
  isPointerPick,
  MultiSelect,
  MultiSelectContent,
  MultiSelectInput,
  MultiSelectItem,
} from '../src/multi-select/multi-select';

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

const people = [
  { value: 'anna', label: 'Anna Kowalska' },
  { value: 'ben', label: 'Ben Okafor' },
];

describe('isPointerPick', () => {
  it('is true only for an option pressed with a pointer', () => {
    expect(isPointerPick('item-press', new MouseEvent('click'))).toBe(true);
    expect(isPointerPick('item-press', new KeyboardEvent('keydown', { key: 'Enter' }))).toBe(false);
    expect(isPointerPick('chip-remove-press', new MouseEvent('click'))).toBe(false);
    expect(isPointerPick('item-press', undefined)).toBe(false);
  });
});

function Pickers() {
  return (
    <>
      <Combobox items={people} defaultOpen>
        <ComboboxInput aria-label="Customer" />
        <ComboboxContent>
          {(item: (typeof people)[number]) => (
            <ComboboxItem key={item.value} value={item}>
              {item.label}
            </ComboboxItem>
          )}
        </ComboboxContent>
      </Combobox>
      <MultiSelect items={people} defaultValue={[people[0]]}>
        <MultiSelectInput aria-label="Approvers" />
        <MultiSelectContent>
          {(item: (typeof people)[number]) => (
            <MultiSelectItem key={item.value} value={item}>
              {item.label}
            </MultiSelectItem>
          )}
        </MultiSelectContent>
      </MultiSelect>
    </>
  );
}

const moving = () => document.querySelectorAll('[data-motion]').length;

describe('motioned pickers', () => {
  beforeEach(() => {
    browser({ reduce: false });
  });

  it('mark the combobox list and the multi select field', async () => {
    render(<Pickers />);
    await screen.findByRole('listbox');
    // The open combobox list and the multi select input.
    expect(moving()).toBe(2);
  });

  it('collapse to the plain pickers under reduced motion', async () => {
    browser({ reduce: true });
    render(<Pickers />);
    await screen.findByRole('listbox');
    expect(moving()).toBe(0);
  });

  it('collapse to the plain pickers when the app turns motion off', async () => {
    render(
      <MotionPreferenceProvider value="off">
        <Pickers />
      </MotionPreferenceProvider>,
    );
    await screen.findByRole('listbox');
    expect(moving()).toBe(0);
  });

  it('still pick and report through the motioned multi select', async () => {
    const onValueChange = vi.fn();
    render(
      <MultiSelect items={people} onValueChange={onValueChange}>
        <MultiSelectInput aria-label="Approvers" />
        <MultiSelectContent>
          {(item: (typeof people)[number]) => (
            <MultiSelectItem key={item.value} value={item}>
              {item.label}
            </MultiSelectItem>
          )}
        </MultiSelectContent>
      </MultiSelect>,
    );
    await userEvent.click(screen.getByRole('combobox', { name: 'Approvers' }));
    await userEvent.keyboard('{ArrowDown}');
    await userEvent.click(await screen.findByRole('option', { name: 'Ben Okafor' }));
    expect(onValueChange).toHaveBeenCalledWith([people[1]], expect.anything());
  });
});
