import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { Field, FieldDescription, FieldError, FieldLabel } from '../field/field';
import { NumberField } from './number-field';

describe('NumberField', () => {
  it('is named by its label, with its description linked', () => {
    render(
      <Field>
        <FieldLabel>Seats</FieldLabel>
        <NumberField defaultValue={12} unit="seats" />
        <FieldDescription>Billed per seat each month.</FieldDescription>
      </Field>,
    );
    const input = screen.getByRole('textbox', { name: 'Seats' });
    expect(input).toHaveValue('12');
    expect(input).toHaveAccessibleDescription('Billed per seat each month.');
    expect(screen.getByText('seats')).toHaveAttribute('aria-hidden', 'true');
  });

  it('steps with named buttons and stops at min and max', async () => {
    const onValueChange = vi.fn();
    render(
      <NumberField
        aria-label="Seats"
        defaultValue={2}
        min={1}
        max={3}
        onValueChange={onValueChange}
      />,
    );
    const input = screen.getByRole('textbox', { name: 'Seats' });
    const increase = screen.getByRole('button', { name: 'Increase' });
    const decrease = screen.getByRole('button', { name: 'Decrease' });
    await userEvent.click(increase);
    expect(input).toHaveValue('3');
    expect(increase).toBeDisabled();
    await userEvent.click(decrease);
    await userEvent.click(decrease);
    expect(input).toHaveValue('1');
    expect(decrease).toBeDisabled();
    expect(onValueChange).toHaveBeenLastCalledWith(1, expect.anything());
  });

  it('keeps the stepper buttons out of the tab order; arrow keys step instead', async () => {
    render(
      <>
        <NumberField aria-label="Retention, days" defaultValue={30} step={5} />
        <button type="button">Next</button>
      </>,
    );
    await userEvent.tab();
    expect(screen.getByRole('textbox', { name: 'Retention, days' })).toHaveFocus();
    await userEvent.keyboard('{ArrowUp}{ArrowUp}');
    expect(screen.getByRole('textbox')).toHaveValue('40');
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Next' })).toHaveFocus();
  });

  it('formats percent and units with Intl', async () => {
    render(
      <>
        <NumberField
          aria-label="Discount"
          locale="en-US"
          format={{ style: 'percent' }}
          defaultValue={0.15}
          step={0.01}
        />
        <NumberField
          aria-label="Notice period"
          locale="en-US"
          format={{ style: 'unit', unit: 'day', unitDisplay: 'long' }}
          defaultValue={14}
        />
      </>,
    );
    const discount = screen.getByRole('textbox', { name: 'Discount' });
    expect(discount).toHaveValue('15%');
    await userEvent.click(discount);
    await userEvent.keyboard('{ArrowUp}');
    expect(discount).toHaveValue('16%');
    expect(screen.getByRole('textbox', { name: 'Notice period' })).toHaveValue('14 days');
  });

  it('works controlled', async () => {
    function Controlled() {
      const [value, setValue] = useState<number | null>(5);
      return (
        <>
          <NumberField aria-label="Seats" value={value} onValueChange={setValue} />
          <output>{String(value)}</output>
        </>
      );
    }
    render(<Controlled />);
    await userEvent.click(screen.getByRole('button', { name: 'Increase' }));
    expect(screen.getByRole('status')).toHaveTextContent('6');
  });

  it('takes invalid and disabled from the Field', () => {
    const { unmount } = render(
      <Field invalid>
        <FieldLabel>Seats</FieldLabel>
        <NumberField defaultValue={0} />
        <FieldError>At least one seat.</FieldError>
      </Field>,
    );
    const input = screen.getByRole('textbox', { name: 'Seats' });
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('At least one seat.');
    unmount();

    render(
      <Field disabled>
        <FieldLabel>Seats</FieldLabel>
        <NumberField defaultValue={3} />
      </Field>,
    );
    expect(screen.getByRole('textbox', { name: 'Seats' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Increase' })).toBeDisabled();
  });

  it('can hide the stepper', () => {
    render(<NumberField aria-label="Seats" hideStepper />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
