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
