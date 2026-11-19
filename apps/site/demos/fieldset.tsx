'use client';

import {
  Button,
  Checkbox,
  Field,
  FieldDescription,
  FieldLabel,
  Fieldset,
  FieldsetDescription,
  FieldsetLegend,
  FormActions,
  FormSection,
  Input,
} from '@rectio/ui';

export default function FieldsetDemo() {
  return (
    <form
      className="flex w-full max-w-3xl flex-col gap-8"
      onSubmit={(event) => {
        event.preventDefault();
      }}
    >
      <FormSection
        title="Billing details"
        description="Printed on every invoice you send. Changes apply to the next invoice."
      >
        <Field>
          <FieldLabel>Legal name</FieldLabel>
          <Input defaultValue="Northwind Traders sp. z o.o." />
        </Field>
        <Field>
          <FieldLabel>VAT number</FieldLabel>
          <Input defaultValue="PL5252812345" />
          <FieldDescription>Checked against VIES before saving.</FieldDescription>
        </Field>
        <Fieldset>
          <FieldsetLegend>Send copies of invoices to</FieldsetLegend>
          <FieldsetDescription>Each address gets the PDF and a payment link.</FieldsetDescription>
          <label className="flex items-center gap-2.5 text-base">
            <Checkbox defaultChecked />
            Accounts payable, ap@northwind.io
          </label>
          <label className="flex items-center gap-2.5 text-base">
            <Checkbox />
            The account owner
          </label>
        </Fieldset>
      </FormSection>
      <FormActions>
        <Button variant="ghost" type="reset">
          Discard
        </Button>
        <Button type="submit">Save changes</Button>
      </FormActions>
    </form>
  );
}
