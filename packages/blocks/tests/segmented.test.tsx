import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Segmented } from '../src/lib/segmented';

const options = [
  { value: 'all', label: 'Wszystkie', hint: 16 },
  { value: 'outstanding', label: 'Nieopłacone', hint: 11 },
  { value: 'overdue', label: 'Po terminie', hint: 7 },
  { value: 'paid', label: 'Opłacone', hint: 3 },
  { value: 'draft', label: 'Szkice', hint: 1 },
] as const;

describe('Segmented on a narrow block', () => {
  it('sits in two even columns on a narrow block or a phone, never scrolling labels out of sight', () => {
    render(<Segmented label="Status" value="all" onValueChange={vi.fn()} options={options} />);
    const group = screen.getByRole('group', { name: 'Status' });
    const classes = group.className.split(/\s+/);
    expect(classes).toContain('flex-wrap');
    expect(classes).toContain('max-sm:grid-cols-2');
    expect(classes).toContain('@max-md:grid-cols-2');
    expect(group.className).not.toMatch(/overflow-x-auto|mask-|snap-/);
    expect(group).not.toHaveAttribute('data-overflow');
  });

  it('keeps every label whole: options never shrink or truncate', () => {
    render(<Segmented label="Status" value="all" onValueChange={vi.fn()} options={options} />);
    for (const option of options) {
      const button = screen.getByRole('button', { name: new RegExp(option.label) });
      expect(button.className).toContain('shrink-0');
      expect(button.className).toContain('whitespace-nowrap');
      expect(button.className).not.toMatch(/truncate|text-ellipsis/);
    }
  });
});
