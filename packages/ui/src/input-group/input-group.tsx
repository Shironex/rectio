'use client';

import { Field as BaseField } from '@base-ui/react/field';
import type { ComponentProps, MouseEvent } from 'react';

import { Button, type ButtonProps } from '../button/button';
import { controlSurface } from '../field/control-styles';
import { cn } from '../lib/cn';

type WithClassName<P> = Omit<P, 'className'> & { className?: string };

/**
 * The field surface drawn on the group instead of the input. State comes from the input inside:
 * Base UI marks the Field control `data-invalid`, and a disabled Field disables the input. Buttons
 * in an addon never set either, so a disabled Copy button does not grey out the whole field.
 */
const groupSurface = cn(
  controlSurface,
  'flex items-center gap-2 px-(--rx-field-padding-x)',
  'has-data-invalid:border-negative has-data-invalid:ring-1 has-data-invalid:ring-negative has-data-invalid:ring-inset',
  'has-[input:disabled]:cursor-not-allowed has-[input:disabled]:border-line has-[input:disabled]:bg-surface-sunken has-[input:disabled]:text-fg-disabled',
  'has-[input:disabled]:*:data-[slot=input-group-addon]:text-fg-disabled',
  // One ring for the whole group, drawn when the input has keyboard focus. An addon button keeps
  // its own ring, so focus never shows twice.
  'has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-focus',
);

export type InputGroupProps = WithClassName<ComponentProps<'div'>>;

/**
 * An input with addons inside its border: text such as "https://" or "EUR", an icon, or a button
 * such as Copy. Put it in a Field; the label names the input, and invalid and disabled come from
 * the Field. Pressing an addon that is not a button focuses the input, like pressing inside it.
 */
export function InputGroup({ className, onMouseDown, ...props }: InputGroupProps) {
  return (
    <div
      data-slot="input-group"
      className={cn(groupSurface, className)}
      onMouseDown={(event: MouseEvent<HTMLDivElement>) => {
        onMouseDown?.(event);
        const target = event.target as HTMLElement;
        if (event.defaultPrevented || target.closest('button, a, input, select, textarea')) return;
        const input = event.currentTarget.querySelector<HTMLInputElement>(
          '[data-slot="input-group-input"]',
        );
        if (input === null || input.disabled) return;
        // Keep the press from blurring the input, then put focus in it.
        event.preventDefault();
        input.focus();
      }}
      {...props}
    />
  );
}

export type InputGroupInputProps = WithClassName<ComponentProps<typeof BaseField.Control>>;

/** The input inside an InputGroup. The group draws the border, so the input itself is bare. */
export function InputGroupInput({ className, ...props }: InputGroupInputProps) {
  return (
    <BaseField.Control
      data-slot="input-group-input"
      className={cn(
        'h-full min-w-0 flex-1 bg-transparent text-base text-fg outline-none placeholder:text-fg-subtle',
        'data-disabled:cursor-not-allowed data-disabled:text-fg-disabled',
        className,
      )}
      {...props}
    />
  );
}

export type InputGroupAddonProps = WithClassName<ComponentProps<'div'>> & {
  /**
   * Which side of the input the addon sits on; place it in that order in the markup too. Logical,
   * so it mirrors in right-to-left text.
   */
  align?: 'start' | 'end';
};

/**
 * Text, an icon or a button beside the input. Text addons are muted and cannot be selected; an
 * addon holding a button pulls in toward the border, so the button sits evenly in the field.
 * Text such as "EUR" is read as plain text, not as part of the value: name the unit in the label
 * or the description too.
 */
export function InputGroupAddon({ className, align = 'start', ...props }: InputGroupAddonProps) {
  return (
    <div
      data-slot="input-group-addon"
      data-align={align}
      className={cn(
        'flex shrink-0 items-center gap-1 text-base text-fg-subtle select-none',
        'data-[align=start]:has-[button]:-ms-1.5 data-[align=end]:has-[button]:-me-1.5',
        '[&_svg]:size-4 [&_svg]:shrink-0',
        // A text addon ("https://", "EUR") is fenced off by a hairline, so it never reads as typed.
        // It sits on a sunken cell that runs to the field's edge.
        'not-has-[svg]:self-stretch not-has-[svg]:border-line not-has-[svg]:bg-surface-sunken',
        'data-[align=start]:not-has-[svg]:-ms-(--rx-field-padding-x) data-[align=start]:not-has-[svg]:rounded-s-(--rx-field-radius)',
        'data-[align=start]:not-has-[svg]:border-e data-[align=start]:not-has-[svg]:ps-(--rx-field-padding-x) data-[align=start]:not-has-[svg]:pe-2.5',
        'data-[align=end]:not-has-[svg]:-me-(--rx-field-padding-x) data-[align=end]:not-has-[svg]:rounded-e-(--rx-field-radius)',
        'data-[align=end]:not-has-[svg]:border-s data-[align=end]:not-has-[svg]:pe-(--rx-field-padding-x) data-[align=end]:not-has-[svg]:ps-2.5',
        className,
      )}
      {...props}
    />
  );
}

export type InputGroupButtonProps = ButtonProps;

/**
 * A small ghost button for an addon, such as Copy or Show. When it holds only an icon, set
 * `iconOnly` and give it an `aria-label`.
 */
export function InputGroupButton({
  variant = 'ghost',
  size = 'sm',
  ...props
}: InputGroupButtonProps) {
  return <Button data-slot="input-group-button" variant={variant} size={size} {...props} />;
}
