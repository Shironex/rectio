import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { Field, FieldDescription, FieldError, FieldLabel } from '../field/field';
import { Slider } from './slider';

describe('Slider', () => {
  it('is named by its field label, described, and steps with the arrow keys', async () => {
    const onValueChange = vi.fn();
    render(
      <Field>
        <FieldLabel>Approval threshold</FieldLabel>
        <Slider defaultValue={40} step={5} onValueChange={onValueChange} />
        <FieldDescription>Expenses above it need a second approver.</FieldDescription>
      </Field>,
    );
    const thumb = screen.getByRole('slider', { name: 'Approval threshold' });
    expect(thumb).toHaveAccessibleDescription('Expenses above it need a second approver.');
    expect(thumb).toHaveValue('40');
    thumb.focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(thumb).toHaveValue('45');
    expect(onValueChange).toHaveBeenLastCalledWith(45, expect.anything());
    await userEvent.keyboard('{End}');
    expect(thumb).toHaveValue('100');
  });

  it('shows the value formatted with Intl, under its own label', () => {
    render(
      <Slider
        label="Early payment discount"
        showValue
        defaultValue={0.025}
        min={0}
        max={0.1}
        step={0.005}
        format={{ style: 'percent', minimumFractionDigits: 1 }}
        locale="en-IE"
      />,
    );
    expect(screen.getByRole('slider', { name: 'Early payment discount' })).toHaveAttribute(
      'aria-valuetext',
      '2.5%',
    );
    expect(screen.getByText('2.5%')).toBeInTheDocument();
  });

  it('names both thumbs of a range and reads the range with "to"', async () => {
    render(
      <Field>
        <FieldLabel>Invoice amount</FieldLabel>
        <Slider
          showValue
          defaultValue={[200, 800]}
          max={1000}
          step={50}
          format={{ style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }}
          locale="en-IE"
          thumbLabels={['Minimum amount', 'Maximum amount']}
        />
      </Field>,
    );
    expect(screen.getByRole('group', { name: 'Invoice amount' })).toBeInTheDocument();
    const low = screen.getByRole('slider', { name: 'Minimum amount' });
    const high = screen.getByRole('slider', { name: 'Maximum amount' });
    expect(screen.getByText('€200 to €800')).toBeInTheDocument();
    high.focus();
    await userEvent.keyboard('{ArrowLeft}');
    expect(high).toHaveValue('750');
    expect(low).toHaveValue('200');
    expect(screen.getByText('€200 to €750')).toBeInTheDocument();
  });

  it('labels the ends with min and max marks, formatted', () => {
    const { container } = render(
      <Slider
        aria-label="Budget"
        marks
        defaultValue={5000}
        max={10000}
        format={{ style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }}
        locale="en-IE"
      />,
    );
    expect(screen.getByText('€0')).toBeInTheDocument();
    expect(screen.getByText('€10,000')).toBeInTheDocument();
    expect(container.querySelector('[aria-hidden] > span')).not.toBeNull();
  });

  it('follows a controlled value', () => {
    function Controlled() {
      const [value, setValue] = useState(30);
      return (
        <>
          <Slider
            label="Retention, days"
            value={value}
            onValueChange={(v) => {
              setValue(v as number);
            }}
          />
          <output>{value}</output>
        </>
      );
    }
    render(<Controlled />);
    const thumb = screen.getByRole('slider', { name: 'Retention, days' });
    fireEvent.change(thumb, { target: { value: '60' } });
    expect(screen.getByText('60', { selector: 'output' })).toBeInTheDocument();
  });

  it('shows the error the app sets and links it to the thumb', () => {
    render(
      <Field invalid>
        <FieldLabel>Credit limit</FieldLabel>
        <Slider defaultValue={10} />
        <FieldError>Above the policy limit.</FieldError>
      </Field>,
    );
    const thumb = screen.getByRole('slider', { name: 'Credit limit' });
    expect(thumb).toHaveAttribute('aria-invalid', 'true');
    expect(thumb).toHaveAccessibleDescription('Above the policy limit.');
    expect(screen.getByText('Above the policy limit.')).toBeVisible();
  });

  it('carries the disabled state of the field', () => {
    render(
      <Field disabled>
        <FieldLabel>Credit limit</FieldLabel>
        <Slider defaultValue={10} />
      </Field>,
    );
    expect(screen.getByRole('slider', { name: 'Credit limit' })).toBeDisabled();
  });
});
