import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Field, FieldDescription, FieldError, FieldLabel } from '../field/field';
import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectInput,
  MultiSelectItem,
  type MultiSelectInputProps,
  type MultiSelectProps,
} from './multi-select';

interface Person {
  value: string;
  label: string;
}

const anna: Person = { value: 'anna', label: 'Anna Kowalska' };
const ben: Person = { value: 'ben', label: 'Ben Okafor' };
const dev: Person = { value: 'dev', label: 'Dev Patel' };
const people: Person[] = [
  anna,
  ben,
  { value: 'chloe', label: 'Chloe Martin' },
  dev,
  { value: 'eva', label: 'Eva Lindqvist' },
];

function renderMulti(
  props: Partial<MultiSelectProps<Person>> = {},
  inputProps: Partial<MultiSelectInputProps> = {},
) {
  const onValueChange = vi.fn();
  render(
    <Field>
      <FieldLabel>Approvers</FieldLabel>
      <MultiSelect items={people} onValueChange={onValueChange} {...props}>
        <MultiSelectInput placeholder="Add approvers" {...inputProps} />
        <MultiSelectContent>
          {(item: Person) => (
            <MultiSelectItem key={item.value} value={item}>
              {item.label}
            </MultiSelectItem>
          )}
        </MultiSelectContent>
      </MultiSelect>
      <FieldDescription>Each approver signs off in turn.</FieldDescription>
    </Field>,
  );
  return { input: screen.getByRole('combobox', { name: 'Approvers' }), onValueChange };
}

const chipNames = () =>
  Array.from(document.querySelectorAll('[data-slot="multi-select-chip"]')).map(
    (chip) => chip.textContent,
  );

describe('MultiSelect', () => {
  it('is named by the field label and linked to its description', () => {
    const { input } = renderMulti();
    expect(input).toHaveAccessibleDescription('Each approver signs off in turn.');
  });

  it('adds chips for picked items and keeps the list open for more', async () => {
    const { input, onValueChange } = renderMulti();
    await userEvent.click(input);
    await userEvent.keyboard('{ArrowDown}');
    await userEvent.click(await screen.findByRole('option', { name: 'Ben Okafor' }));
    await userEvent.click(screen.getByRole('option', { name: 'Dev Patel' }));
    expect(chipNames()).toEqual(['Ben Okafor', 'Dev Patel']);
    expect(onValueChange).toHaveBeenLastCalledWith([ben, dev], expect.anything());
    expect(screen.getByRole('listbox')).toBeVisible();
    expect(screen.getByRole('option', { name: 'Ben Okafor' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  it('keeps the filter after a pick so several matches can be chosen', async () => {
    const { input } = renderMulti();
    await userEvent.type(input, 'e');
    await userEvent.click(await screen.findByRole('option', { name: 'Ben Okafor' }));
    expect(input).toHaveValue('e');
    expect(screen.getByRole('option', { name: 'Chloe Martin' })).toBeVisible();
  });

  it('removes a chip with its named button', async () => {
    const { onValueChange } = renderMulti({ defaultValue: [anna, ben] });
    await userEvent.click(screen.getByRole('button', { name: 'Remove Anna Kowalska' }));
    expect(onValueChange).toHaveBeenLastCalledWith([ben], expect.anything());
    expect(chipNames()).toEqual(['Ben Okafor']);
  });

  it('removes the last chip with Backspace in the empty input', async () => {
    const { input } = renderMulti({ defaultValue: [anna, ben] });
    await userEvent.click(input);
    await userEvent.keyboard('{Escape}{Backspace}');
    expect(chipNames()).toEqual(['Anna Kowalska']);
  });

  it('walks into the chips with Arrow Left and removes the focused one', async () => {
    const { input } = renderMulti({ defaultValue: [anna, ben] });
    await userEvent.click(input);
    await userEvent.keyboard('{Escape}{ArrowLeft}');
    await waitFor(() => {
      expect(
        screen.getByText('Ben Okafor').closest('[data-slot="multi-select-chip"]'),
      ).toHaveFocus();
    });
    await userEvent.keyboard('{ArrowLeft}{Delete}');
    expect(chipNames()).toEqual(['Ben Okafor']);
  });

  it('selects all with one option, then clears all', async () => {
    const { input, onValueChange } = renderMulti({ selectAll: true });
    await userEvent.click(input);
    await userEvent.keyboard('{ArrowDown}');
    await userEvent.click(await screen.findByRole('option', { name: 'Select all' }));
    expect(onValueChange).toHaveBeenLastCalledWith(people, expect.anything());
    expect(chipNames()).toHaveLength(people.length);
    await userEvent.click(screen.getByRole('option', { name: 'Clear all' }));
    expect(onValueChange).toHaveBeenLastCalledWith([], expect.anything());
  });

  it('hides Select all while the user is filtering', async () => {
    const { input } = renderMulti({ selectAll: true });
    await userEvent.type(input, 'eva');
    await screen.findByRole('option', { name: 'Eva Lindqvist' });
    expect(screen.queryByRole('option', { name: 'Select all' })).not.toBeInTheDocument();
  });

  it('shows a named overflow chip at rest and every chip on focus', async () => {
    const { input } = renderMulti({ defaultValue: people }, { maxChips: 2 });
    expect(chipNames()).toEqual(['Anna Kowalska', 'Ben Okafor']);
    const more = screen.getByRole('button', { name: '3 more selected' });
    expect(more).toHaveTextContent('+3');
    await userEvent.click(more);
    expect(input).toHaveFocus();
    expect(chipNames()).toHaveLength(5);
    expect(screen.queryByRole('button', { name: '3 more selected' })).not.toBeInTheDocument();
  });

  it('shows an error the app sets on the field', () => {
    render(
      <Field invalid>
        <FieldLabel>Approvers</FieldLabel>
        <MultiSelect items={people}>
          <MultiSelectInput />
          <MultiSelectContent>{() => null}</MultiSelectContent>
        </MultiSelect>
        <FieldError>Add at least one approver.</FieldError>
      </Field>,
    );
    const input = screen.getByRole('combobox', { name: 'Approvers' });
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('Add at least one approver.');
  });

  it('is disabled with its field', () => {
    render(
      <Field disabled>
        <FieldLabel>Approvers</FieldLabel>
        <MultiSelect items={people} defaultValue={[anna]}>
          <MultiSelectInput />
          <MultiSelectContent>{() => null}</MultiSelectContent>
        </MultiSelect>
      </Field>,
    );
    expect(screen.getByRole('combobox', { name: 'Approvers' })).toBeDisabled();
  });
});
