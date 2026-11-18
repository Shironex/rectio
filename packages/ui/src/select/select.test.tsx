import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Field, FieldLabel } from '../field/field';
import { Select, SelectContent, SelectItem, SelectTrigger } from './select';

const categories = [
  { value: 'travel', label: 'Travel' },
  { value: 'meals', label: 'Meals' },
  { value: 'software', label: 'Software' },
];

function renderSelect() {
  const onValueChange = vi.fn();
  render(
    <Field>
      <FieldLabel>Category</FieldLabel>
      <Select items={categories} onValueChange={onValueChange}>
        <SelectTrigger placeholder="Choose a category" />
        <SelectContent>
          {categories.map((c) => (
            <SelectItem key={c.value} value={c.value}>
              {c.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>,
  );
  return { trigger: screen.getByRole('combobox', { name: 'Category' }), onValueChange };
}

describe('Select', () => {
  it('shows the placeholder and is named by the field label', () => {
    const { trigger } = renderSelect();
    expect(trigger).toHaveTextContent('Choose a category');
  });

  it('opens from the keyboard, moves with arrows and picks with Enter', async () => {
    const { trigger, onValueChange } = renderSelect();
    trigger.focus();
    await userEvent.keyboard('{ArrowDown}');
    const listbox = await screen.findByRole('listbox');
    expect(listbox).toBeVisible();
    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Travel' })).toHaveFocus();
    });
    await userEvent.keyboard('{ArrowDown}{Enter}');
    expect(onValueChange).toHaveBeenCalledWith('meals', expect.anything());
    await waitFor(() => {
      expect(trigger).toHaveTextContent('Meals');
    });
  });

  it('closes on Escape and returns focus to the trigger', async () => {
    const { trigger } = renderSelect();
    await userEvent.click(trigger);
    await screen.findByRole('listbox');
    await userEvent.keyboard('{Escape}');
    await waitFor(() => {
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
    expect(trigger).toHaveFocus();
  });
});
