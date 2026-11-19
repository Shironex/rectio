'use client';

import {
  Combobox,
  ComboboxContent,
  ComboboxInput,
  ComboboxItem,
  Field,
  FieldDescription,
  FieldLabel,
} from '@rectio/ui';
import { useRef, useState } from 'react';

import { CUSTOMERS, searchCustomers, type Customer } from './combobox.data';

/** Pick from a known list, or add a customer that is not there yet. */
function CustomerField() {
  const [customers, setCustomers] = useState(CUSTOMERS);
  const [customer, setCustomer] = useState<Customer | null>(null);

  return (
    <Field>
      <FieldLabel>Customer</FieldLabel>
      <Combobox
        items={customers}
        value={customer}
        onValueChange={setCustomer}
        onCreate={(name) => {
          const created = { value: name.toLocaleLowerCase(), label: name, city: 'New customer' };
          setCustomers((list) => [...list, created]);
          setCustomer(created);
        }}
      >
        <ComboboxInput placeholder="Search customers" />
        <ComboboxContent>
          {(item: Customer) => (
            <ComboboxItem key={item.value} value={item} hint={item.city}>
              {item.label}
            </ComboboxItem>
          )}
        </ComboboxContent>
      </Combobox>
      <FieldDescription>Not on the list? Type the name and choose Create.</FieldDescription>
    </Field>
  );
}

/** Results come from the server as the user types; the server also matches the city. */
function RemoteCustomerField() {
  const [results, setResults] = useState<Customer[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(false);
  const pending = useRef<AbortController | null>(null);
  // Keep the chosen customer in the list, so it still shows while new results load.
  const items =
    customer === null || results.some((c) => c.value === customer.value)
      ? results
      : [...results, customer];

  return (
    <Field>
      <FieldLabel>Bill to</FieldLabel>
      <Combobox
        items={items}
        filter={null}
        value={customer}
        onValueChange={setCustomer}
        isItemEqualToValue={(a, b) => a.value === b.value}
        onInputValueChange={(query, { reason }) => {
          pending.current?.abort();
          // Search on typing only; picking an item or clearing fills the input too.
          if (reason !== 'input-change' || query.trim() === '') {
            setLoading(false);
            return;
          }
          const controller = new AbortController();
          pending.current = controller;
          setLoading(true);
          searchCustomers(query, controller.signal)
            .then((found) => {
              setResults(found);
              setLoading(false);
            })
            .catch(() => undefined);
        }}
      >
        <ComboboxInput placeholder="Name or city" />
        <ComboboxContent loading={loading} emptyMessage="No customer matches">
          {(item: Customer) => (
            <ComboboxItem key={item.value} value={item} hint={item.city}>
              {item.label}
            </ComboboxItem>
          )}
        </ComboboxContent>
      </Combobox>
      <FieldDescription>Searches the customer directory, by name or city.</FieldDescription>
    </Field>
  );
}

export default function ComboboxDemo() {
  return (
    <div className="flex w-full max-w-xs flex-col gap-5">
      <CustomerField />
      <RemoteCustomerField />
    </div>
  );
}
