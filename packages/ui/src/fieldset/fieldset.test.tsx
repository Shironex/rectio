import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Button } from '../button/button';
import { Checkbox } from '../checkbox/checkbox';
import { Field, FieldLabel, Input } from '../field/field';
import {
  Fieldset,
  FieldsetDescription,
  FieldsetLegend,
  FormActions,
  FormSection,
} from './fieldset';

describe('Fieldset', () => {
  it('names the group by its legend and describes it', () => {
    render(
      <Fieldset>
        <FieldsetLegend>Email notifications</FieldsetLegend>
        <FieldsetDescription>Sent to the address on your profile.</FieldsetDescription>
        <Field>
          <FieldLabel>Weekly digest</FieldLabel>
          <Checkbox />
        </Field>
      </Fieldset>,
    );
    const group = screen.getByRole('group', { name: 'Email notifications' });
    expect(group.tagName).toBe('FIELDSET');
    expect(group).toHaveAccessibleDescription('Sent to the address on your profile.');
  });

  it('has no description link without a description', () => {
    render(
      <Fieldset>
        <FieldsetLegend>Address</FieldsetLegend>
      </Fieldset>,
    );
    expect(screen.getByRole('group', { name: 'Address' })).not.toHaveAttribute('aria-describedby');
  });

  it('disables every field inside', () => {
    render(
      <Fieldset disabled>
        <FieldsetLegend>Address</FieldsetLegend>
        <Field>
          <FieldLabel>Street</FieldLabel>
          <Input />
        </Field>
        <Field>
          <FieldLabel>City</FieldLabel>
          <Input />
        </Field>
      </Fieldset>,
    );
    expect(screen.getByRole('textbox', { name: 'Street' })).toBeDisabled();
    expect(screen.getByRole('textbox', { name: 'City' })).toBeDisabled();
  });
});

describe('FormSection and FormActions', () => {
  it('is a region named by its heading, at the level asked for', () => {
    render(
      <FormSection title="Billing details" description="Printed on every invoice." headingLevel={3}>
        <Field>
          <FieldLabel>Company</FieldLabel>
          <Input />
        </Field>
        <FormActions>
          <Button variant="ghost">Cancel</Button>
          <Button type="submit">Save</Button>
        </FormActions>
      </FormSection>,
    );
    expect(screen.getByRole('region', { name: 'Billing details' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'Billing details' })).toBeInTheDocument();
    expect(screen.getByText('Printed on every invoice.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });
});
