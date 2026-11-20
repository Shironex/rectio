import {
  Combobox,
  ComboboxContent,
  ComboboxInput,
  ComboboxItem,
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  MultiSelect,
  MultiSelectContent,
  MultiSelectInput,
  MultiSelectItem,
  Tag,
  TagInput,
} from '@rectio/ui';

import { Row, Section } from './specimen';

interface Option {
  value: string;
  label: string;
}

const NORTHWIND: Option = { value: 'northwind', label: 'Northwind Traders' };
const CONTOSO: Option = { value: 'contoso', label: 'Contoso Ltd' };
const CUSTOMERS: Option[] = [
  NORTHWIND,
  CONTOSO,
  { value: 'fabrikam', label: 'Fabrikam' },
  { value: 'tailspin', label: 'Tailspin Toys' },
];

const APPROVERS: Option[] = [
  { value: 'isla', label: 'Isla Fraser' },
  { value: 'ben', label: 'Ben Okafor' },
  { value: 'chloe', label: 'Chloe Martin' },
  { value: 'dev', label: 'Dev Patel' },
  { value: 'eva', label: 'Eva Lindqvist' },
];

export function TagInputSection() {
  return (
    <Section
      title="Tag input"
      note="Free text tags. Enter or a comma adds, Backspace in the empty input selects then removes the last tag. Rejections show as the field error."
    >
      <Row label="Empty, filled">
        <Field className="w-72">
          <FieldLabel>Vendor labels</FieldLabel>
          <TagInput placeholder="Add a label" />
          <FieldDescription>Press Enter after each label.</FieldDescription>
        </Field>
        <Field className="w-72">
          <FieldLabel>Vendor labels</FieldLabel>
          <TagInput defaultValue={['saas', 'annual-contract', 'eu-vat', 'net-30', 'priority']} />
        </Field>
      </Row>
      <Row label="Invalid, disabled">
        <Field className="w-72" invalid>
          <FieldLabel>Email domains</FieldLabel>
          <TagInput defaultValue={['acme.com', 'acme']} />
          <FieldError>acme is not a domain.</FieldError>
        </Field>
        <Field className="w-72" disabled>
          <FieldLabel>Email domains</FieldLabel>
          <TagInput defaultValue={['acme.com', 'acme.eu']} />
        </Field>
      </Row>
      <Row label="Tag" center>
        <Tag>Approved vendor</Tag>
        <Tag onRemove={() => undefined}>Q3 close</Tag>
        <Tag onRemove={() => undefined} disabled>
          Locked
        </Tag>
      </Row>
    </Section>
  );
}

function CustomerCombobox(props: { defaultValue?: Option; disabled?: boolean }) {
  return (
    <Combobox
      items={CUSTOMERS}
      defaultValue={props.defaultValue ?? null}
      disabled={props.disabled === true}
    >
      <ComboboxInput placeholder="Search customers" />
      <ComboboxContent>
        {(item: Option) => (
          <ComboboxItem key={item.value} value={item}>
            {item.label}
          </ComboboxItem>
        )}
      </ComboboxContent>
    </Combobox>
  );
}

export function ComboboxSection() {
  return (
    <Section
      title="Combobox"
      note="For long lists people would rather type than scroll. Results can come from a server, and a Create option can add what is missing."
    >
      <Row label="Empty, filled">
        <Field className="w-60">
          <FieldLabel>Customer</FieldLabel>
          <CustomerCombobox />
        </Field>
        <Field className="w-60">
          <FieldLabel>Customer</FieldLabel>
          <CustomerCombobox defaultValue={CONTOSO} />
          <FieldDescription>Invoices go to its billing address.</FieldDescription>
        </Field>
      </Row>
      <Row label="Invalid, disabled">
        <Field className="w-60" invalid>
          <FieldLabel>Customer</FieldLabel>
          <CustomerCombobox />
          <FieldError>Choose a customer.</FieldError>
        </Field>
        <Field className="w-60" disabled>
          <FieldLabel>Customer</FieldLabel>
          <CustomerCombobox defaultValue={NORTHWIND} disabled />
        </Field>
      </Row>
    </Section>
  );
}

function ApproverSelect(props: { defaultValue?: Option[]; maxChips?: number; disabled?: boolean }) {
  return (
    <MultiSelect
      items={APPROVERS}
      defaultValue={props.defaultValue ?? []}
      disabled={props.disabled === true}
      selectAll
    >
      <MultiSelectInput
        placeholder="Add approvers"
        {...(props.maxChips === undefined ? {} : { maxChips: props.maxChips })}
      />
      <MultiSelectContent>
        {(item: Option) => (
          <MultiSelectItem key={item.value} value={item}>
            {item.label}
          </MultiSelectItem>
        )}
      </MultiSelectContent>
    </MultiSelect>
  );
}

export function MultiSelectSection() {
  return (
    <Section
      title="Multi select"
      note="Several choices as chips. The list stays open between picks; maxChips keeps the field on one line at rest and shows every chip on focus."
    >
      <Row label="Empty, filled">
        <Field className="w-72">
          <FieldLabel>Approvers</FieldLabel>
          <ApproverSelect />
        </Field>
        <Field className="w-72">
          <FieldLabel>Approvers</FieldLabel>
          <ApproverSelect defaultValue={APPROVERS.slice(0, 2)} />
          <FieldDescription>Each approver signs off in turn.</FieldDescription>
        </Field>
      </Row>
      <Row label="Overflow">
        <Field className="w-72">
          <FieldLabel>Approvers</FieldLabel>
          <ApproverSelect defaultValue={APPROVERS} maxChips={2} />
        </Field>
      </Row>
      <Row label="Invalid, disabled">
        <Field className="w-72" invalid>
          <FieldLabel>Approvers</FieldLabel>
          <ApproverSelect />
          <FieldError>Add at least one approver.</FieldError>
        </Field>
        <Field className="w-72" disabled>
          <FieldLabel>Approvers</FieldLabel>
          <ApproverSelect defaultValue={APPROVERS.slice(1, 3)} disabled />
        </Field>
      </Row>
    </Section>
  );
}
