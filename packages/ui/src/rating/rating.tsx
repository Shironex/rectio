import { Radio as BaseRadio } from '@base-ui/react/radio';
import { RadioGroup as BaseRadioGroup } from '@base-ui/react/radio-group';
import { StarIcon } from '@phosphor-icons/react';
import { useState, type ComponentProps } from 'react';

import { cn } from '../lib/cn';

type WithClassName<P> = Omit<P, 'className'> & { className?: string };

export type RatingSize = 'sm' | 'md';

/** The drawn star, and on a phone the cell that holds it grows to the touch height. */
const CELLS: Record<RatingSize, string> = {
  sm: 'size-(--rx-control-height-sm) pointer-coarse:size-(--rx-control-height-touch)',
  md: 'size-(--rx-control-height-md) pointer-coarse:size-(--rx-control-height-touch)',
};

const STARS: Record<RatingSize, string> = { sm: 'size-4', md: 'size-5' };

/** Display sizes for a read-only rating, which needs no touch target. */
const READ_STARS: Record<RatingSize, string> = { sm: 'size-3.5', md: 'size-4' };

type Fill = 'full' | 'half' | 'empty';

function fillOf(star: number, value: number): Fill {
  if (value >= star) return 'full';
  if (value >= star - 0.5) return 'half';
  return 'empty';
}

/**
 * One star: an empty star with a filled one on top, cut to half for a half step. The filled star
 * is also bolder in outline than the empty one, so the reading never rests on colour alone.
 */
function Star({ fill, size, className }: { fill: Fill; size: string; className?: string }) {
  return (
    <span
      aria-hidden
      data-fill={fill}
      className={cn('relative inline-flex shrink-0', size, className)}
    >
      <StarIcon weight="regular" className="size-full text-fg-subtle" />
      {fill !== 'empty' && (
        <span
          className={cn(
            'absolute inset-y-0 start-0 overflow-hidden',
            fill === 'half' ? 'w-1/2' : 'w-full',
          )}
        >
          <StarIcon weight="fill" className={cn('max-w-none text-warning', size)} />
        </span>
      )}
    </span>
  );
}

const starLabel = (value: number) => `${String(value)} ${value === 1 ? 'star' : 'stars'}`;

export type RatingProps = WithClassName<
  Omit<
    ComponentProps<typeof BaseRadioGroup>,
    'value' | 'defaultValue' | 'onValueChange' | 'children'
  >
> & {
  value?: number | null;
  defaultValue?: number | null;
  onValueChange?: (value: number) => void;
  /** How many stars. Default 5. */
  max?: number;
  /** Allow half stars: each star then takes two values, its left half and the whole star. */
  allowHalf?: boolean;
  size?: RatingSize;
  /** The name of each option, read by screen readers. Default "3 stars", "3.5 stars". */
  getItemLabel?: (value: number) => string;
};

/**
 * A star rating that the user sets, on Base UI's radio group: one radio per value, so arrow keys
 * move the rating, the chosen value is announced, and it posts with a form under `name`. With a
 * mouse, the stars preview the value under the pointer before the press. For a rating that is
 * only shown, use RatingDisplay.
 */
export function Rating({
  value,
  defaultValue = null,
  onValueChange,
  max = 5,
  allowHalf = false,
  size = 'md',
  getItemLabel = starLabel,
  className,
  disabled,
  readOnly,
  ...props
}: RatingProps) {
  const [own, setOwn] = useState<number | null>(defaultValue);
  const chosen = value === undefined ? own : value;
  const [preview, setPreview] = useState<number | null>(null);
  const shown = preview ?? chosen ?? 0;
  const stars = Array.from({ length: max }, (_, index) => index + 1);
  const step = allowHalf ? 0.5 : 1;
  const still = disabled === true || readOnly === true;

  return (
    <BaseRadioGroup
      data-slot="rating"
      value={chosen}
      onValueChange={(next) => {
        const picked = Number(next);
        setOwn(picked);
        onValueChange?.(picked);
      }}
      {...(disabled === undefined ? {} : { disabled })}
      {...(readOnly === undefined ? {} : { readOnly })}
      onPointerLeave={() => {
        setPreview(null);
      }}
      className={cn('inline-flex items-center', className)}
      {...props}
    >
      {stars.map((star) => {
        const options = allowHalf ? [star - step, star] : [star];
        return (
          <span
            key={star}
            data-slot="rating-star"
            className={cn(
              'relative inline-flex items-center justify-center rounded-control',
              'has-focus-visible:outline-2 has-focus-visible:outline-focus',
              CELLS[size],
            )}
          >
            <Star
              fill={fillOf(star, shown)}
              size={STARS[size]}
              className={cn(
                'transition-[scale] duration-fast ease-standard',
                preview !== null && preview >= star - step && !still && 'scale-110',
                disabled === true && 'opacity-50',
              )}
            />
            {options.map((option, index) => (
              <BaseRadio.Root
                key={option}
                value={option}
                aria-label={getItemLabel(option)}
                data-slot="rating-item"
                onPointerEnter={(event) => {
                  // A finger has no hover: the preview would stick after the tap.
                  if (event.pointerType === 'mouse' && !still) setPreview(option);
                }}
                className={cn(
                  'absolute inset-y-0 cursor-pointer outline-none',
                  options.length === 2
                    ? index === 0
                      ? 'start-0 w-1/2'
                      : 'end-0 w-1/2'
                    : 'inset-x-0',
                  'data-disabled:cursor-not-allowed data-readonly:cursor-default',
                )}
              />
            ))}
          </span>
        );
      })}
    </BaseRadioGroup>
  );
}

export type RatingDisplayProps = Omit<ComponentProps<'span'>, 'children'> & {
  value: number;
  max?: number;
  size?: RatingSize;
  /** The spoken reading. Default "4.5 out of 5 stars". */
  label?: string;
  /** Show the figure beside the stars, such as "4.5". */
  showValue?: boolean;
};

/**
 * A rating shown, not set: one image with its reading as the name, such as a vendor's score in a
 * table. Rounds to the nearest half star.
 */
export function RatingDisplay({
  value,
  max = 5,
  size = 'md',
  label,
  showValue = false,
  className,
  ...props
}: RatingDisplayProps) {
  const rounded = Math.round(value * 2) / 2;
  const reading = new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(value);
  return (
    <span
      role="img"
      aria-label={label ?? `${reading} out of ${String(max)} stars`}
      data-slot="rating-display"
      className={cn('inline-flex items-center gap-0.5', className)}
      {...props}
    >
      {Array.from({ length: max }, (_, index) => (
        <Star key={index} fill={fillOf(index + 1, rounded)} size={READ_STARS[size]} />
      ))}
      {showValue && (
        <span aria-hidden className="ms-1.5 text-sm font-medium text-fg numeric">
          {reading}
        </span>
      )}
    </span>
  );
}
