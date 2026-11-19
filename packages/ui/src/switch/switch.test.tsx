import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { Field, FieldDescription, FieldError, FieldLabel } from '../field/field';
import { Switch, SwitchField } from './switch';

describe('Switch', () => {
  it('is named by its field label, linked to the description, and toggles from the keyboard', async () => {
    const onCheckedChange = vi.fn();
    render(
      <Field>
        <FieldLabel>Email receipts</FieldLabel>
        <Switch onCheckedChange={onCheckedChange} />
        <FieldDescription>Sends a copy of every approved expense.</FieldDescription>
      </Field>,
    );
    const toggle = screen.getByRole('switch', { name: 'Email receipts' });
    expect(toggle).toHaveAccessibleDescription('Sends a copy of every approved expense.');
    expect(toggle).not.toBeChecked();
    toggle.focus();
    await userEvent.keyboard(' ');
    expect(toggle).toBeChecked();
    expect(onCheckedChange).toHaveBeenLastCalledWith(true, expect.anything());
    await userEvent.keyboard('{Enter}');
    expect(toggle).not.toBeChecked();
  });

  it('toggles when its label is pressed', async () => {
    render(
      <Field>
        <FieldLabel>Two-step sign-in</FieldLabel>
        <Switch />
      </Field>,
    );
    await userEvent.click(screen.getByText('Two-step sign-in'));
    expect(screen.getByRole('switch', { name: 'Two-step sign-in' })).toBeChecked();
  });

  it('follows a controlled value', async () => {
    function Controlled() {
      const [on, setOn] = useState(true);
      return (
        <>
          <Switch aria-label="Auto-approve" checked={on} onCheckedChange={setOn} />
          <output>{on ? 'on' : 'off'}</output>
        </>
      );
    }
    render(<Controlled />);
    const toggle = screen.getByRole('switch', { name: 'Auto-approve' });
    expect(toggle).toBeChecked();
    await userEvent.click(toggle);
    expect(toggle).not.toBeChecked();
    expect(screen.getByText('off')).toBeInTheDocument();
  });

  it('ignores presses when the field is disabled', async () => {
    render(
      <Field disabled>
        <FieldLabel>Weekly digest</FieldLabel>
        <Switch />
      </Field>,
    );
    const toggle = screen.getByRole('switch', { name: 'Weekly digest' });
    await userEvent.click(toggle);
    expect(toggle).not.toBeChecked();
    expect(toggle).toHaveAttribute('data-disabled');
  });
});

describe('SwitchField', () => {
  it('names the switch with the label and describes it with the description', () => {
    render(
      <SwitchField
        label="Card payments"
        description="Let members pay invoices by card."
        defaultChecked
      />,
    );
    const toggle = screen.getByRole('switch', { name: 'Card payments' });
    expect(toggle).toBeChecked();
    expect(toggle).toHaveAccessibleDescription('Let members pay invoices by card.');
  });

  it('shows the error when the app marks it invalid', () => {
    render(
      <SwitchField label="Direct debit" invalid>
        <FieldError>Add a bank account first.</FieldError>
      </SwitchField>,
    );
    const toggle = screen.getByRole('switch', { name: 'Direct debit' });
    expect(screen.getByText('Add a bank account first.')).toBeVisible();
    expect(toggle).toHaveAttribute('aria-invalid', 'true');
    expect(toggle).toHaveAccessibleDescription('Add a bank account first.');
  });

  it('disables the whole row', async () => {
    render(<SwitchField label="SSO only" disabled />);
    const toggle = screen.getByRole('switch', { name: 'SSO only' });
    await userEvent.click(screen.getByText('SSO only'));
    expect(toggle).not.toBeChecked();
    expect(screen.getByText('SSO only')).toHaveAttribute('data-disabled');
  });
});
