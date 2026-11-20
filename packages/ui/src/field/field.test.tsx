import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { Field, FieldDescription, FieldError, FieldLabel, Input } from './field';

describe('Field and Input', () => {
  it('labels the input and links its description', () => {
    render(
      <Field>
        <FieldLabel>Reference</FieldLabel>
        <Input />
        <FieldDescription>Shown on the bank statement.</FieldDescription>
      </Field>,
    );
    const input = screen.getByRole('textbox', { name: 'Reference' });
    expect(input).toHaveAccessibleDescription('Shown on the bank statement.');
  });

  it('shows the error and marks the input invalid after a failed validation', async () => {
    render(
      <Field
        validate={(value) => (String(value).length < 3 ? 'Use at least 3 characters.' : null)}
        validationMode="onBlur"
      >
        <FieldLabel>Reference</FieldLabel>
        <Input />
        <FieldError>Use at least 3 characters.</FieldError>
      </Field>,
    );
    const input = screen.getByRole('textbox', { name: 'Reference' });
    await userEvent.type(input, 'ab');
    await userEvent.tab();
    await waitFor(() => {
      expect(input).toHaveAttribute('data-invalid');
    });
    const error = await screen.findByText('Use at least 3 characters.');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription(
      expect.stringContaining('Use at least 3 characters.'),
    );
    expect(error).toBeVisible();
  });
});

describe('Field invalid set by the app', () => {
  it('shows the error message, not only a red border', () => {
    render(
      <Field invalid>
        <FieldLabel>Cost centre</FieldLabel>
        <Input defaultValue="CC-9" />
        <FieldError>No cost centre CC-9.</FieldError>
      </Field>,
    );
    const input = screen.getByRole('textbox', { name: 'Cost centre' });
    expect(screen.getByText('No cost centre CC-9.')).toBeVisible();
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('No cost centre CC-9.');
  });
});

describe('FieldError never shows a bare icon', () => {
  it('renders nothing when the app marks the field invalid without a message', () => {
    const { container } = render(
      <Field invalid>
        <FieldLabel>Email</FieldLabel>
        <Input />
        <FieldError>{null}</FieldError>
      </Field>,
    );
    expect(container.querySelector('svg')).toBeNull();
    expect(container.querySelector('[data-slot="field-error"]:not([hidden])')).toBeNull();
  });

  it('shows the check message with the icon when it is left empty', async () => {
    const { container } = render(
      <Field validate={() => 'Enter a work email.'} validationMode="onBlur">
        <FieldLabel>Email</FieldLabel>
        <Input />
        <FieldError />
      </Field>,
    );
    const input = screen.getByRole('textbox', { name: 'Email' });
    await userEvent.type(input, 'a');
    await userEvent.tab();
    const error = await screen.findByText('Enter a work email.');
    expect(error).toBeVisible();
    expect(container.querySelector('[data-slot="field-error"] svg')).not.toBeNull();
    expect(input).toHaveAccessibleDescription('Enter a work email.');
  });

  it('keeps the icon out of the accessible description', () => {
    render(
      <Field invalid>
        <FieldLabel>Email</FieldLabel>
        <Input />
        <FieldError>Enter a work email.</FieldError>
      </Field>,
    );
    expect(screen.getByRole('textbox', { name: 'Email' })).toHaveAccessibleDescription(
      'Enter a work email.',
    );
  });
});

describe('FieldLabel optional', () => {
  it('adds the word to the accessible name, not only a visual marker', () => {
    render(
      <Field>
        <FieldLabel optional>Note</FieldLabel>
        <Input />
      </Field>,
    );
    expect(screen.getByRole('textbox', { name: 'Note Optional' })).toBeInTheDocument();
  });
});
