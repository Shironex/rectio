import { CopyIcon, GlobeIcon } from '@phosphor-icons/react';
import {
  Button,
  Checkbox,
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  Fieldset,
  FieldsetDescription,
  FieldsetLegend,
  FormActions,
  FormSection,
  Input,
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  NumberField,
  OtpInput,
  SearchInput,
  Textarea,
} from '@rectio/ui';

import { Row, Section } from './specimen';

const NOTE =
  'Client dinner after the Q3 review with Northwind. The amount is over the meal limit because of the group size.';

export function TextareaSection() {
  return (
    <Section
      title="Textarea"
      note="Grows with its text between minRows and maxRows, then scrolls. The count warns near the limit in words, not colour alone."
    >
      <Row label="Rest, filled">
        <Field className="w-72">
          <FieldLabel>Note for the approver</FieldLabel>
          <Textarea placeholder="Why this expense?" minRows={2} />
        </Field>
        <Field className="w-72">
          <FieldLabel>Note for the approver</FieldLabel>
          <Textarea defaultValue={NOTE} minRows={2} maxRows={5} />
          <FieldDescription>Visible to finance only.</FieldDescription>
        </Field>
      </Row>
      <Row label="Count">
        <Field className="w-72">
          <FieldLabel>Bio</FieldLabel>
          <Textarea defaultValue="Finance lead, EMEA." maxLength={160} showCount minRows={2} />
        </Field>
        <Field className="w-72">
          <FieldLabel>Bio</FieldLabel>
          <Textarea defaultValue={NOTE.slice(0, 104)} maxLength={110} showCount minRows={2} />
        </Field>
        <Field className="w-72">
          <FieldLabel>Bio</FieldLabel>
          <Textarea defaultValue={NOTE.slice(0, 60)} maxLength={60} showCount minRows={2} />
        </Field>
      </Row>
      <Row label="Invalid, disabled">
        <Field className="w-72" invalid>
          <FieldLabel>Reason</FieldLabel>
          <Textarea defaultValue="Dinner" minRows={2} />
          <FieldError>Say why the expense is over policy.</FieldError>
        </Field>
        <Field className="w-72" disabled>
          <FieldLabel>Reason</FieldLabel>
          <Textarea defaultValue="Approved by policy" minRows={2} />
        </Field>
      </Row>
    </Section>
  );
}

export function InputGroupSection() {
  return (
    <Section
      title="Input group"
      note="Text, icon and button addons inside one border. Invalid and disabled come from the Field; name a unit addon in the label too."
    >
      <Row label="Addons">
        <Field className="w-64">
          <FieldLabel>Company website</FieldLabel>
          <InputGroup>
            <InputGroupAddon>https://</InputGroupAddon>
            <InputGroupInput placeholder="northwind.io" />
          </InputGroup>
        </Field>
        <Field className="w-64">
          <FieldLabel>Hourly rate, EUR</FieldLabel>
          <InputGroup>
            <InputGroupInput defaultValue="95.00" className="text-end numeric" />
            <InputGroupAddon align="end">EUR</InputGroupAddon>
          </InputGroup>
        </Field>
        <Field className="w-64">
          <FieldLabel>Webhook URL</FieldLabel>
          <InputGroup>
            <InputGroupAddon>
              <GlobeIcon aria-hidden weight="bold" />
            </InputGroupAddon>
            <InputGroupInput defaultValue="hooks.northwind.io/inv" readOnly />
            <InputGroupAddon align="end">
              <InputGroupButton iconOnly aria-label="Copy webhook URL">
                <CopyIcon aria-hidden weight="bold" />
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </Field>
      </Row>
      <Row label="Invalid, disabled">
        <Field className="w-64" invalid>
          <FieldLabel>Company website</FieldLabel>
          <InputGroup>
            <InputGroupAddon>https://</InputGroupAddon>
            <InputGroupInput defaultValue="northwind" />
          </InputGroup>
          <FieldError>Enter a full domain, such as northwind.io.</FieldError>
        </Field>
        <Field className="w-64" disabled>
          <FieldLabel>Hourly rate, EUR</FieldLabel>
          <InputGroup>
            <InputGroupInput defaultValue="95.00" className="text-end numeric" />
            <InputGroupAddon align="end">EUR</InputGroupAddon>
          </InputGroup>
        </Field>
      </Row>
    </Section>
  );
}

export function SearchInputSection() {
  return (
    <Section
      title="Search input"
      note="The clear button appears with text; Escape clears first, then closes what holds the field. The shortcut hint shows while empty."
    >
      <Row label="Empty, filled">
        <Field className="w-64">
          <FieldLabel>Search invoices</FieldLabel>
          <SearchInput placeholder="Number or customer" />
        </Field>
        <Field className="w-64">
          <FieldLabel>Search invoices</FieldLabel>
          <SearchInput defaultValue="Northwind" />
        </Field>
      </Row>
      <Row label="Shortcut hint">
        <Field className="w-64">
          <FieldLabel>Search invoices</FieldLabel>
          <SearchInput placeholder="Number or customer" shortcut="/" />
        </Field>
        <Field className="w-64">
          <FieldLabel>Search everything</FieldLabel>
          <SearchInput placeholder="Jump to" shortcut="mod+k" />
        </Field>
      </Row>
      <Row label="Invalid, disabled">
        <Field className="w-64" invalid>
          <FieldLabel>Search invoices</FieldLabel>
          <SearchInput defaultValue="%%" />
          <FieldError>Use letters or numbers.</FieldError>
        </Field>
        <Field className="w-64" disabled>
          <FieldLabel>Search invoices</FieldLabel>
          <SearchInput defaultValue="Northwind" />
        </Field>
      </Row>
    </Section>
  );
}

export function NumberFieldSection() {
  return (
    <Section
      title="Number field"
      note="Right-aligned tabular figures like AmountInput. The stepper buttons are as tall as the field: 44px targets on touch."
    >
      <Row label="Formats">
        <Field className="w-56">
          <FieldLabel>Seats</FieldLabel>
          <NumberField defaultValue={12} min={1} unit="seats" />
        </Field>
        <Field className="w-56">
          <FieldLabel>Volume discount</FieldLabel>
          <NumberField
            defaultValue={0.15}
            step={0.01}
            locale="en-IE"
            format={{ style: 'percent' }}
          />
        </Field>
        <Field className="w-56">
          <FieldLabel>Keep audit logs for</FieldLabel>
          <NumberField
            defaultValue={30}
            locale="en-IE"
            format={{ style: 'unit', unit: 'day', unitDisplay: 'long' }}
          />
        </Field>
      </Row>
      <Row label="At limits, empty">
        <Field className="w-56">
          <FieldLabel>Seats</FieldLabel>
          <NumberField defaultValue={1} min={1} max={250} />
          <FieldDescription>Decrease is off at the minimum.</FieldDescription>
        </Field>
        <Field className="w-56">
          <FieldLabel>Retries</FieldLabel>
          <NumberField placeholder="3" hideStepper />
        </Field>
      </Row>
      <Row label="Invalid, disabled">
        <Field className="w-56" invalid>
          <FieldLabel>Seats</FieldLabel>
          <NumberField defaultValue={0} />
          <FieldError>At least one seat.</FieldError>
        </Field>
        <Field className="w-56" disabled>
          <FieldLabel>Seats</FieldLabel>
          <NumberField defaultValue={12} unit="seats" />
        </Field>
      </Row>
    </Section>
  );
}

export function OtpInputSection() {
  return (
    <Section
      title="OTP input"
      note="One slot per character; paste fills every slot. Group long codes; mask a PIN."
    >
      <Row label="Empty, grouped">
        <Field>
          <FieldLabel>Verification code</FieldLabel>
          <OtpInput />
        </Field>
        <Field>
          <FieldLabel>Verification code</FieldLabel>
          <OtpInput groups={[3, 3]} defaultValue="482" />
        </Field>
      </Row>
      <Row label="PIN, recovery">
        <Field>
          <FieldLabel>Approval PIN</FieldLabel>
          <OtpInput length={4} mask defaultValue="12" />
        </Field>
        <Field>
          <FieldLabel>Recovery code</FieldLabel>
          <OtpInput length={8} groups={[4, 4]} type="alphanumeric" defaultValue="AB12CD34" />
        </Field>
      </Row>
      <Row label="Invalid, disabled">
        <Field invalid>
          <FieldLabel>Verification code</FieldLabel>
          <OtpInput groups={[3, 3]} defaultValue="111111" />
          <FieldError>That code has expired.</FieldError>
        </Field>
        <Field disabled>
          <FieldLabel>Verification code</FieldLabel>
          <OtpInput groups={[3, 3]} />
        </Field>
      </Row>
    </Section>
  );
}

export function FieldsetSection() {
  return (
    <Section
      title="Fieldset and form section"
      note="A legend groups related controls. A form section puts its title beside the fields when its own container is wide, and stacks when narrow."
    >
      <Row label="Fieldset">
        <Fieldset className="w-72">
          <FieldsetLegend>Email notifications</FieldsetLegend>
          <FieldsetDescription>Sent to the address on your profile.</FieldsetDescription>
          <label className="flex items-center gap-2.5 text-base">
            <Checkbox defaultChecked />
            Weekly digest
          </label>
          <label className="flex items-center gap-2.5 text-base">
            <Checkbox />
            Approval requests
          </label>
        </Fieldset>
        <Fieldset className="w-72" disabled>
          <FieldsetLegend>Address</FieldsetLegend>
          <Field>
            <FieldLabel>Street</FieldLabel>
            <Input defaultValue="51 Station Road" />
          </Field>
        </Fieldset>
      </Row>
      <Row label="Wide section">
        <FormSection
          className="w-full"
          title="Billing details"
          description="Printed on every invoice. Changes apply to the next one."
          headingLevel={4}
        >
          <Field>
            <FieldLabel>Legal name</FieldLabel>
            <Input defaultValue="Northwind Traders Ltd" />
          </Field>
          <Field>
            <FieldLabel>VAT number</FieldLabel>
            <Input defaultValue="PL5252812345" />
          </Field>
          <FormActions>
            <Button variant="ghost">Discard</Button>
            <Button>Save changes</Button>
          </FormActions>
        </FormSection>
      </Row>
      <Row label="Narrow section">
        <FormSection
          className="w-80"
          title="Billing details"
          description="Printed on every invoice."
          headingLevel={4}
        >
          <Field>
            <FieldLabel>Legal name</FieldLabel>
            <Input defaultValue="Northwind Traders Ltd" />
          </Field>
          <FormActions align="between">
            <Button variant="ghost">Discard</Button>
            <Button>Save</Button>
          </FormActions>
        </FormSection>
      </Row>
    </Section>
  );
}
