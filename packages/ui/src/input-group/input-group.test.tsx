import { CopyIcon } from '@phosphor-icons/react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Field, FieldDescription, FieldError, FieldLabel } from '../field/field';
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from './input-group';

describe('InputGroup', () => {
  it('lets the Field label name the input and link its description', () => {
    render(
      <Field>
        <FieldLabel>Website</FieldLabel>
        <InputGroup>
          <InputGroupAddon>https://</InputGroupAddon>
          <InputGroupInput placeholder="acme.com" />
        </InputGroup>
        <FieldDescription>Shown on invoices.</FieldDescription>
      </Field>,
    );
    const input = screen.getByRole('textbox', { name: 'Website' });
    expect(input).toHaveAccessibleDescription('Shown on invoices.');
  });

  it('focuses the input when a text addon is pressed', async () => {
    render(
      <InputGroup>
        <InputGroupInput aria-label="Hourly rate" />
        <InputGroupAddon align="end">EUR</InputGroupAddon>
      </InputGroup>,
    );
    await userEvent.click(screen.getByText('EUR'));
    expect(screen.getByRole('textbox', { name: 'Hourly rate' })).toHaveFocus();
  });

  it('runs an addon button without moving focus to the input', async () => {
    const onCopy = vi.fn();
    render(
      <InputGroup>
        <InputGroupInput aria-label="API key" defaultValue="rk_live_51" readOnly />
        <InputGroupAddon align="end">
          <InputGroupButton iconOnly aria-label="Copy API key" onClick={onCopy}>
            <CopyIcon aria-hidden />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>,
    );
    const button = screen.getByRole('button', { name: 'Copy API key' });
    await userEvent.click(button);
    expect(onCopy).toHaveBeenCalledOnce();
    expect(button).toHaveFocus();
  });

  it('shows the error and marks the input invalid when the app sets the Field invalid', () => {
    render(
      <Field invalid>
        <FieldLabel>Website</FieldLabel>
        <InputGroup>
          <InputGroupAddon>https://</InputGroupAddon>
          <InputGroupInput defaultValue="acme" />
        </InputGroup>
        <FieldError>Enter a full domain, such as acme.com.</FieldError>
      </Field>,
    );
    const input = screen.getByRole('textbox', { name: 'Website' });
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('data-invalid');
    expect(input).toHaveAccessibleDescription('Enter a full domain, such as acme.com.');
  });

  it('disables the input from the Field and does not focus it from an addon', async () => {
    render(
      <Field disabled>
        <FieldLabel>Website</FieldLabel>
        <InputGroup>
          <InputGroupAddon>https://</InputGroupAddon>
          <InputGroupInput />
        </InputGroup>
      </Field>,
    );
    const input = screen.getByRole('textbox', { name: 'Website' });
    expect(input).toBeDisabled();
    await userEvent.click(screen.getByText('https://'));
    expect(input).not.toHaveFocus();
  });
});
