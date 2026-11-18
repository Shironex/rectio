import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Field, FieldLabel } from '../field/field';
import { AmountInput } from './amount-input';

function renderAmount(props: Partial<Parameters<typeof AmountInput>[0]> = {}) {
  const onValueChange = vi.fn();
  render(
    <Field>
      <FieldLabel>Amount, EUR</FieldLabel>
      <AmountInput currency="EUR" locale="de-DE" onValueChange={onValueChange} {...props} />
    </Field>,
  );
  return { input: screen.getByRole('textbox', { name: 'Amount, EUR' }), onValueChange };
}

describe('AmountInput', () => {
  it('parses locale input and formats to the currency precision on blur', async () => {
    const { input, onValueChange } = renderAmount();
    await userEvent.type(input, '1234,5');
    await userEvent.tab();
    expect(input).toHaveValue('1.234,50');
    expect(onValueChange).toHaveBeenLastCalledWith(1234.5, expect.anything());
  });

  it('steps with the arrow keys', async () => {
    const { input } = renderAmount({ defaultValue: 10, step: 1 });
    await userEvent.click(input);
    await userEvent.keyboard('{ArrowUp}{ArrowUp}{ArrowDown}');
    expect(input).toHaveValue('11,00');
  });

  it('shows the symbol on the side the locale puts it, hidden from screen readers', () => {
    const { container } = render(<AmountInput currency="USD" locale="en-US" aria-label="Amount" />);
    const group = container.querySelector('[data-slot="amount-input"]');
    const symbol = screen.getByText('$');
    expect(symbol).toHaveAttribute('aria-hidden', 'true');
    expect(group?.textContent.startsWith('$')).toBe(true);
  });

  it('uses no decimals for a currency that has none', async () => {
    render(<AmountInput currency="JPY" locale="ja-JP" aria-label="Amount" />);
    const input = screen.getByRole('textbox', { name: 'Amount' });
    await userEvent.type(input, '1500');
    await userEvent.tab();
    expect(input).toHaveValue('1,500');
  });
});
