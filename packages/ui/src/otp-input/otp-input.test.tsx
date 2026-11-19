import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Field, FieldDescription, FieldError, FieldLabel } from '../field/field';
import { OtpInput } from './otp-input';

const slots = () => screen.getAllByRole('textbox');
const firstSlot = () => {
  const [first] = slots();
  if (first === undefined) throw new Error('no slots');
  return first;
};

describe('OtpInput', () => {
  it('names the first slot by its label and the rest by position', () => {
    render(
      <Field>
        <FieldLabel>Verification code</FieldLabel>
        <OtpInput />
        <FieldDescription>Sent to +48 600 000 123.</FieldDescription>
      </Field>,
    );
    expect(slots()).toHaveLength(6);
    const first = screen.getByRole('textbox', { name: 'Verification code' });
    expect(first).toHaveAttribute('autocomplete', 'one-time-code');
    // Base UI names and describes the group of slots as a whole, then each slot inside it.
    const group = screen.getByRole('group', { name: 'Verification code' });
    expect(group).toHaveAccessibleDescription('Sent to +48 600 000 123.');
    expect(screen.getByRole('textbox', { name: 'Character 6 of 6' })).toBeInTheDocument();
  });

  it('moves on as digits are typed and reports the complete code once', async () => {
    const onComplete = vi.fn();
    render(<OtpInput aria-label="Code" length={4} onComplete={onComplete} />);
    await userEvent.click(firstSlot());
    await userEvent.keyboard('12a34');
    expect(slots().map((slot) => (slot as HTMLInputElement).value)).toEqual(['1', '2', '3', '4']);
    expect(onComplete).toHaveBeenCalledOnce();
    expect(onComplete).toHaveBeenCalledWith('1234');
  });

  it('fills every slot from a paste', async () => {
    const onComplete = vi.fn();
    render(<OtpInput aria-label="Code" onComplete={onComplete} />);
    await userEvent.click(firstSlot());
    await userEvent.paste('482913');
    expect(
      slots()
        .map((slot) => (slot as HTMLInputElement).value)
        .join(''),
    ).toBe('482913');
    expect(onComplete).toHaveBeenCalledWith('482913');
  });

  it('takes letters in alphanumeric mode', async () => {
    render(<OtpInput aria-label="Recovery code" length={8} type="alphanumeric" />);
    await userEvent.click(firstSlot());
    await userEvent.paste('AB12CD34');
    expect(
      slots()
        .map((slot) => (slot as HTMLInputElement).value)
        .join(''),
    ).toBe('AB12CD34');
  });

  it('draws separators between groups', () => {
    render(<OtpInput aria-label="Code" groups={[3, 3]} />);
    expect(screen.getAllByRole('separator')).toHaveLength(1);
  });

  it('ignores groups that do not add up to the length', () => {
    render(<OtpInput aria-label="Code" groups={[3, 2]} />);
    expect(screen.queryByRole('separator')).not.toBeInTheDocument();
    expect(slots()).toHaveLength(6);
  });

  it('masks a PIN', () => {
    const { container } = render(<OtpInput aria-label="PIN" length={4} mask />);
    const inputs = container.querySelectorAll('[data-slot="otp-input-slot"]');
    expect(inputs).toHaveLength(4);
    for (const input of inputs) expect(input).toHaveAttribute('type', 'password');
  });

  it('shows the error when the app sets the Field invalid, and takes disabled from it', () => {
    const { unmount } = render(
      <Field invalid>
        <FieldLabel>Verification code</FieldLabel>
        <OtpInput defaultValue="111111" />
        <FieldError>That code has expired.</FieldError>
      </Field>,
    );
    const first = screen.getByRole('textbox', { name: 'Verification code' });
    expect(first).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('That code has expired.')).toBeVisible();
    unmount();

    render(
      <Field disabled>
        <FieldLabel>Verification code</FieldLabel>
        <OtpInput />
      </Field>,
    );
    for (const slot of slots()) expect(slot).toBeDisabled();
  });
});
