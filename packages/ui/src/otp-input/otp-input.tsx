'use client';

import { OTPField } from '@base-ui/react/otp-field';
import { Fragment, type ComponentProps } from 'react';

import { controlFocus, controlSurface } from '../field/control-styles';
import { cn } from '../lib/cn';

type RootProps = ComponentProps<typeof OTPField.Root>;

export interface OtpInputProps extends Omit<
  RootProps,
  'className' | 'length' | 'onValueComplete' | 'validationType'
> {
  className?: string;
  /** Number of characters. */
  length?: 4 | 5 | 6 | 7 | 8;
  /**
   * Sizes of the visual chunks, such as `[3, 3]` for "123 456". They must add up to `length`; a
   * separator sits between chunks. Leave it out for one run of slots.
   */
  groups?: number[];
  /** Digits only (the default), or letters and digits for recovery and invite codes. */
  type?: 'numeric' | 'alphanumeric';
  /** Called once every slot is filled, with the whole code. */
  onComplete?: (value: string) => void;
  /** Accessible name of each slot after the first, which the FieldLabel names. */
  slotLabel?: (position: number, length: number) => string;
}

const defaultSlotLabel = (position: number, length: number) =>
  `Character ${String(position)} of ${String(length)}`;

/** Splits `length` slot indices into the chunks `groups` asks for, or one chunk if they do not fit. */
function chunk(length: number, groups: number[] | undefined): number[][] {
  const all = Array.from({ length }, (_, index) => index);
  const sizes = groups?.filter((size) => size > 0);
  if (sizes?.reduce((sum, size) => sum + size, 0) !== length) return [all];
  let start = 0;
  return sizes.map((size) => {
    const part = all.slice(start, start + size);
    start += size;
    return part;
  });
}

/**
 * A one-time code or PIN field on Base UI's OTPField: one slot per character, typed or pasted.
 * Pasting a whole code fills every slot, the browser can offer a code from a text message
 * (`autocomplete="one-time-code"`), and focus moves on by itself. `mask` hides the characters for a
 * PIN. Wrap it in a Field: the label names the first slot, and invalid and disabled come from it.
 * Characters appear without motion, since they are typed in quick succession.
 */
export function OtpInput({
  className,
  length = 6,
  groups,
  type = 'numeric',
  onComplete,
  slotLabel = defaultSlotLabel,
  mask = false,
  ...props
}: OtpInputProps) {
  const chunks = chunk(length, groups);
  return (
    <OTPField.Root
      data-slot="otp-input"
      length={length}
      mask={mask}
      validationType={type}
      onValueComplete={(value: string) => {
        onComplete?.(value);
      }}
      className={cn('flex items-center gap-2', className)}
      {...props}
    >
      {chunks.map((slots, part) => (
        <Fragment key={slots[0]}>
          {part > 0 && (
            <OTPField.Separator className="flex w-2 shrink-0 items-center">
              <span className="h-px w-full bg-line-strong" />
            </OTPField.Separator>
          )}
          <div className="flex items-center gap-1.5">
            {slots.map((index) => (
              <OTPField.Input
                key={index}
                data-slot="otp-input-slot"
                aria-label={index === 0 ? undefined : slotLabel(index + 1, length)}
                className={cn(
                  controlSurface,
                  controlFocus,
                  'w-(--rx-field-height) pointer-coarse:w-(--rx-field-height-touch) shrink-0 px-0',
                  'text-center text-lg caret-accent numeric',
                )}
              />
            ))}
          </div>
        </Fragment>
      ))}
    </OTPField.Root>
  );
}
