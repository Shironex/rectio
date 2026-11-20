import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { Field, FieldDescription, FieldError } from '../field/field';
import { Radio, RadioCard, RadioGroup } from './radio-group';

function Period(props: { onValueChange?: (value: unknown) => void; disabled?: boolean }) {
  return (
    <Field disabled={props.disabled}>
      <RadioGroup
        legend="Billing period"
        defaultValue="monthly"
        onValueChange={props.onValueChange}
      >
        <Radio value="monthly">Monthly</Radio>
        <Radio value="yearly" description="Two months free.">
          Yearly
        </Radio>
      </RadioGroup>
      <FieldDescription>Change it at any renewal.</FieldDescription>
    </Field>
  );
}

describe('RadioGroup and Radio', () => {
  it('names the group with its legend and each radio with its label', () => {
    render(<Period />);
    const group = screen.getByRole('radiogroup', { name: 'Billing period' });
    expect(group).toHaveAccessibleDescription('Change it at any renewal.');
    expect(screen.getByRole('radio', { name: 'Monthly' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Yearly' })).toHaveAccessibleDescription(
      expect.stringContaining('Two months free.'),
    );
  });

  it('moves the choice with the arrow keys', async () => {
    const onValueChange = vi.fn();
    render(<Period onValueChange={onValueChange} />);
    screen.getByRole('radio', { name: 'Monthly' }).focus();
    await userEvent.keyboard('{ArrowDown}');
    const yearly = screen.getByRole('radio', { name: 'Yearly' });
    await waitFor(() => {
      expect(yearly).toBeChecked();
    });
    expect(yearly).toHaveFocus();
    expect(onValueChange).toHaveBeenLastCalledWith('yearly', expect.anything());
  });

  it('picks an option when its label is pressed', async () => {
    render(<Period />);
    await userEvent.click(screen.getByText('Yearly'));
    expect(screen.getByRole('radio', { name: 'Yearly' })).toBeChecked();
  });

  it('follows a controlled value', async () => {
    function Controlled() {
      const [value, setValue] = useState<unknown>('card');
      return (
        <>
          <RadioGroup aria-label="Pay by" value={value} onValueChange={setValue}>
            <Radio value="card">Card</Radio>
            <Radio value="transfer">Bank transfer</Radio>
          </RadioGroup>
          <output>{String(value)}</output>
        </>
      );
    }
    render(<Controlled />);
    await userEvent.click(screen.getByRole('radio', { name: 'Bank transfer' }));
    expect(screen.getByText('transfer')).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Card' })).not.toBeChecked();
  });

  it('carries the disabled state of the field', async () => {
    render(<Period disabled />);
    const yearly = screen.getByRole('radio', { name: 'Yearly' });
    await userEvent.click(yearly);
    expect(yearly).not.toBeChecked();
    expect(yearly).toHaveAttribute('data-disabled');
  });

  it('shows the error the app sets and links it to the group', () => {
    render(
      <Field invalid>
        <RadioGroup legend="Approver">
          <Radio value="isla">Isla Fraser</Radio>
          <Radio value="rory">Rory Quinn</Radio>
        </RadioGroup>
        <FieldError>Pick who approves this report.</FieldError>
      </Field>,
    );
    const group = screen.getByRole('radiogroup', { name: 'Approver' });
    expect(screen.getByText('Pick who approves this report.')).toBeVisible();
    expect(group).toHaveAttribute('aria-invalid', 'true');
    expect(group).toHaveAccessibleDescription('Pick who approves this report.');
  });
});

describe('RadioCard', () => {
  function Plans() {
    return (
      <RadioGroup legend="Plan" defaultValue="team">
        <RadioCard value="starter" title="Starter" description="Up to 3 members." meta="€0" />
        <RadioCard value="team" title="Team" description="Approvals and audit log." meta="€12" />
        <RadioCard value="scale" title="Scale" description="SSO and SCIM." meta="€24" disabled />
      </RadioGroup>
    );
  }

  it('is named by its title and described by its description and meta', () => {
    render(<Plans />);
    const team = screen.getByRole('radio', { name: 'Team' });
    expect(team).toBeChecked();
    expect(team).toHaveAccessibleDescription('Approvals and audit log. €12');
  });

  it('picks the plan when any part of the card is pressed', async () => {
    render(<Plans />);
    await userEvent.click(screen.getByText('Up to 3 members.'));
    expect(screen.getByRole('radio', { name: 'Starter' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Team' })).not.toBeChecked();
  });

  it('skips a disabled card', async () => {
    render(<Plans />);
    const scale = screen.getByRole('radio', { name: 'Scale' });
    await userEvent.click(scale);
    expect(scale).not.toBeChecked();
  });
});
