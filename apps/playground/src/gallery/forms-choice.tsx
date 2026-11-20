import { ListIcon, PushPinIcon, SquaresFourIcon } from '@phosphor-icons/react';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  Radio,
  RadioCard,
  RadioGroup,
  Slider,
  Switch,
  SwitchField,
  Toggle,
  ToggleGroup,
} from '@rectio/ui';

import { Row, Section } from './specimen';

const EUR = { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 } as const;

export function SwitchSection() {
  return (
    <Section
      title="Switch"
      note="For settings that apply at once. On is the filled track with the thumb at the end; in a form that applies on submit, use a checkbox."
    >
      <Row label="Off, on, disabled" center>
        <Switch aria-label="Off" />
        <Switch aria-label="On" defaultChecked />
        <Switch aria-label="Disabled off" disabled />
        <Switch aria-label="Disabled on" disabled defaultChecked />
      </Row>
      <Row label="In a field">
        <Field className="w-56">
          <FieldLabel>Email receipts</FieldLabel>
          <Switch defaultChecked />
          <FieldDescription>Sent to the expense owner.</FieldDescription>
        </Field>
      </Row>
      <Row label="Settings rows">
        <div className="flex w-96 flex-col divide-y divide-line">
          <SwitchField
            fieldClassName="py-3 first:pt-0"
            label="Require two approvers"
            description="For expenses above €5,000."
            defaultChecked
          />
          <SwitchField
            fieldClassName="py-3"
            label="Direct debit"
            description="Collect invoices from the customer's account."
            invalid
          >
            <FieldError>Add a bank account first.</FieldError>
          </SwitchField>
          <SwitchField
            fieldClassName="py-3 last:pb-0"
            label="Single sign-on only"
            description="Available on the Scale plan."
            disabled
          />
        </div>
      </Row>
    </Section>
  );
}

export function RadioGroupSection() {
  return (
    <Section
      title="Radio group"
      note="Two to five options that stay in view. Name the group with a legend; cards suit plan and method pickers."
    >
      <Row label="List">
        <Field className="w-56">
          <RadioGroup legend="Billing period" defaultValue="monthly">
            <Radio value="monthly">Monthly</Radio>
            <Radio value="yearly" description="Two months free.">
              Yearly
            </Radio>
            <Radio value="custom" disabled>
              Custom terms
            </Radio>
          </RadioGroup>
        </Field>
        <Field className="w-56">
          <RadioGroup legend="Approver">
            <Radio value="isla">Isla Fraser</Radio>
            <Radio value="rory">Rory Quinn</Radio>
          </RadioGroup>
          <FieldDescription>Nothing picked yet.</FieldDescription>
        </Field>
      </Row>
      <Row label="Invalid, disabled">
        <Field className="w-56" invalid>
          <RadioGroup legend="Payment terms">
            <Radio value="net15">Net 15</Radio>
            <Radio value="net30">Net 30</Radio>
          </RadioGroup>
          <FieldError>Pick the payment terms.</FieldError>
        </Field>
        <Field className="w-56" disabled>
          <RadioGroup legend="Currency" defaultValue="eur">
            <Radio value="eur">Euro</Radio>
            <Radio value="chf">Swiss franc</Radio>
          </RadioGroup>
          <FieldDescription>Set by the entity.</FieldDescription>
        </Field>
      </Row>
      <Row label="Cards">
        <Field className="w-full max-w-2xl">
          <RadioGroup legend="Plan" defaultValue="team" className="grid gap-3 sm:grid-cols-3">
            <RadioCard value="starter" title="Starter" description="Up to 3 members." meta="€0" />
            <RadioCard
              value="team"
              title="Team"
              description="Approvals and audit log."
              meta="€12"
            />
            <RadioCard
              value="scale"
              title="Scale"
              description="SSO and SCIM."
              meta="€24"
              disabled
            />
          </RadioGroup>
          <FieldDescription>Per member, per month.</FieldDescription>
        </Field>
      </Row>
    </Section>
  );
}

export function ToggleSection() {
  return (
    <Section
      title="Toggle and toggle group"
      note="A button that stays down, for view options and filters that apply at once. A single-select group always keeps one choice."
    >
      <Row label="Toggle" center>
        <Toggle>Show archived</Toggle>
        <Toggle defaultPressed>Show archived</Toggle>
        <Toggle size="sm" defaultPressed>
          Small
        </Toggle>
        <Toggle iconOnly aria-label="Pin to sidebar" defaultPressed>
          <PushPinIcon aria-hidden weight="bold" className="size-4" />
        </Toggle>
        <Toggle disabled>Disabled</Toggle>
      </Row>
      <Row label="Single, sizes" center>
        <ToggleGroup legend="Period" defaultValue={['month']}>
          <Toggle value="week">Week</Toggle>
          <Toggle value="month">Month</Toggle>
          <Toggle value="quarter">Quarter</Toggle>
        </ToggleGroup>
        <ToggleGroup aria-label="Period, small" size="sm" defaultValue={['week']}>
          <Toggle value="week">Week</Toggle>
          <Toggle value="month">Month</Toggle>
          <Toggle value="quarter">Quarter</Toggle>
        </ToggleGroup>
        <ToggleGroup aria-label="View" defaultValue={['list']}>
          <Toggle value="list" iconOnly aria-label="List">
            <ListIcon aria-hidden weight="bold" className="size-4" />
          </Toggle>
          <Toggle value="board" iconOnly aria-label="Board">
            <SquaresFourIcon aria-hidden weight="bold" className="size-4" />
          </Toggle>
        </ToggleGroup>
      </Row>
      <Row label="Multiple, disabled" center>
        <ToggleGroup aria-label="Status" multiple defaultValue={['open', 'overdue']}>
          <Toggle value="open">Open</Toggle>
          <Toggle value="overdue">Overdue</Toggle>
          <Toggle value="paid">Paid</Toggle>
        </ToggleGroup>
        <ToggleGroup aria-label="Currency" disabled defaultValue={['eur']}>
          <Toggle value="eur">EUR</Toggle>
          <Toggle value="chf">CHF</Toggle>
        </ToggleGroup>
      </Row>
    </Section>
  );
}

export function SliderSection() {
  return (
    <Section
      title="Slider"
      note="Where position matters more than the exact figure. Values and marks are formatted with Intl; the thumb never animates."
    >
      <Row label="Single, marks">
        <Field className="w-72">
          <Slider
            label="Second approver above"
            showValue
            marks
            defaultValue={2500}
            max={10000}
            step={250}
            format={EUR}
            locale="en-IE"
          />
          <FieldDescription>Expenses over it need two approvals.</FieldDescription>
        </Field>
        <Field className="w-72">
          <FieldLabel>Early payment discount</FieldLabel>
          <Slider
            showValue
            defaultValue={0.025}
            max={0.1}
            step={0.005}
            format={{ style: 'percent', minimumFractionDigits: 1 }}
            locale="en-IE"
          />
        </Field>
      </Row>
      <Row label="Range, ticks">
        <Field className="w-72">
          <FieldLabel>Invoice amount</FieldLabel>
          <Slider
            showValue
            marks={[0, 2500, 5000, 7500, 10000]}
            defaultValue={[500, 4000]}
            max={10000}
            step={100}
            format={EUR}
            locale="en-IE"
            thumbLabels={['Minimum amount', 'Maximum amount']}
          />
        </Field>
      </Row>
      <Row label="Invalid, disabled">
        <Field className="w-72" invalid>
          <FieldLabel>Credit limit</FieldLabel>
          <Slider showValue defaultValue={9000} max={10000} step={500} format={EUR} />
          <FieldError>Above the policy limit of €8,000.</FieldError>
        </Field>
        <Field className="w-72" disabled>
          <FieldLabel>Retention, days</FieldLabel>
          <Slider showValue marks defaultValue={90} min={30} max={365} />
        </Field>
      </Row>
    </Section>
  );
}
