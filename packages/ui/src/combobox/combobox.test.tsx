import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { Field, FieldError, FieldLabel } from '../field/field';
import {
  Combobox,
  ComboboxContent,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  type ComboboxProps,
} from './combobox';

interface Customer {
  value: string;
  label: string;
}

const contoso: Customer = { value: 'contoso', label: 'Contoso Ltd' };
const fabrikam: Customer = { value: 'fabrikam', label: 'Fabrikam' };
const customers: Customer[] = [
  { value: 'northwind', label: 'Northwind Traders' },
  contoso,
  fabrikam,
];

function renderCombobox(props: Partial<ComboboxProps<Customer>> = {}) {
  const onValueChange = vi.fn();
  render(
    <Field>
      <FieldLabel>Customer</FieldLabel>
      <Combobox items={customers} onValueChange={onValueChange} {...props}>
        <ComboboxInput placeholder="Search customers" />
        <ComboboxContent>
          {(item: Customer) => (
            <ComboboxItem key={item.value} value={item}>
              {item.label}
            </ComboboxItem>
          )}
        </ComboboxContent>
      </Combobox>
    </Field>,
  );
  return { input: screen.getByRole('combobox', { name: 'Customer' }), onValueChange };
}

describe('Combobox', () => {
  it('is named by the field label and filters as the user types', async () => {
    const { input } = renderCombobox();
    await userEvent.type(input, 'con');
    await screen.findByRole('listbox');
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual(['Contoso Ltd']);
  });

  it('picks with the arrows and Enter, and fills the input', async () => {
    const { input, onValueChange } = renderCombobox();
    await userEvent.click(input);
    await userEvent.keyboard('{ArrowDown}');
    await screen.findByRole('listbox');
    await userEvent.keyboard('{ArrowDown}{Enter}');
    expect(onValueChange).toHaveBeenCalledWith(contoso, expect.anything());
    await waitFor(() => {
      expect(input).toHaveValue('Contoso Ltd');
    });
  });

  it('says so when nothing matches', async () => {
    const { input } = renderCombobox();
    await userEvent.type(input, 'zzz');
    expect(await screen.findByText('No results')).toBeVisible();
  });

  it('renders groups with their headings', async () => {
    const groups = [
      { label: 'Active', items: customers.slice(0, 2) },
      { label: 'Archived', items: customers.slice(2) },
    ];
    render(
      <Combobox items={groups}>
        <ComboboxInput aria-label="Customer" />
        <ComboboxContent>
          {(group: (typeof groups)[number]) => (
            <ComboboxGroup key={group.label} label={group.label} items={group.items}>
              {(item: Customer) => (
                <ComboboxItem key={item.value} value={item}>
                  {item.label}
                </ComboboxItem>
              )}
            </ComboboxGroup>
          )}
        </ComboboxContent>
      </Combobox>,
    );
    await userEvent.type(screen.getByRole('combobox', { name: 'Customer' }), 'fab');
    expect(await screen.findByText('Archived')).toBeVisible();
    expect(screen.queryByText('Active')).not.toBeInTheDocument();
  });

  it('shows a loading status and marks the list busy', async () => {
    render(
      <Combobox items={[]} filter={null}>
        <ComboboxInput aria-label="Customer" />
        <ComboboxContent loading>{() => null}</ComboboxContent>
      </Combobox>,
    );
    await userEvent.type(screen.getByRole('combobox', { name: 'Customer' }), 'nor');
    const listbox = await screen.findByRole('listbox');
    expect(await screen.findByText('Searching…')).toBeVisible();
    expect(listbox.closest('[aria-busy="true"]')).not.toBeNull();
    // Still loading: no "No results" before the answer is in.
    expect(screen.queryByText('No results')).not.toBeInTheDocument();
  });

  it('leaves filtering to the app when results come from a search', async () => {
    function Async() {
      const [results, setResults] = useState<Customer[]>([]);
      return (
        <Combobox
          items={results}
          filter={null}
          onInputValueChange={(text) => {
            // The server matched on something the client cannot see, such as a tax number.
            setResults(text === '' ? [] : [fabrikam]);
          }}
        >
          <ComboboxInput aria-label="Customer" />
          <ComboboxContent>
            {(item: Customer) => (
              <ComboboxItem key={item.value} value={item}>
                {item.label}
              </ComboboxItem>
            )}
          </ComboboxContent>
        </Combobox>
      );
    }
    render(<Async />);
    await userEvent.type(screen.getByRole('combobox', { name: 'Customer' }), 'PL526');
    expect(await screen.findByRole('option', { name: 'Fabrikam' })).toBeVisible();
  });

  it('offers to create what the user typed and hands it to the app', async () => {
    const onCreate = vi.fn();
    const { input, onValueChange } = renderCombobox({ onCreate });
    await userEvent.type(input, 'acme');
    const create = await screen.findByRole('option', { name: 'Create "acme"' });
    await userEvent.click(create);
    expect(onCreate).toHaveBeenCalledWith('acme');
    expect(onValueChange).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
  });

  it('offers no create option when the text matches an item exactly', async () => {
    const { input } = renderCombobox({ onCreate: vi.fn() });
    await userEvent.type(input, 'fabrikam');
    await screen.findByRole('option', { name: 'Fabrikam' });
    expect(screen.queryByRole('option', { name: /Create/ })).not.toBeInTheDocument();
  });

  it('shows an error the app sets on the field', () => {
    render(
      <Field invalid>
        <FieldLabel>Customer</FieldLabel>
        <Combobox items={customers}>
          <ComboboxInput />
          <ComboboxContent>{() => null}</ComboboxContent>
        </Combobox>
        <FieldError>Choose a customer.</FieldError>
      </Field>,
    );
    const input = screen.getByRole('combobox', { name: 'Customer' });
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('Choose a customer.');
  });

  it('is disabled with its field', () => {
    render(
      <Field disabled>
        <FieldLabel>Customer</FieldLabel>
        <Combobox items={customers}>
          <ComboboxInput />
          <ComboboxContent>{() => null}</ComboboxContent>
        </Combobox>
      </Field>,
    );
    expect(screen.getByRole('combobox', { name: 'Customer' })).toBeDisabled();
  });
});
