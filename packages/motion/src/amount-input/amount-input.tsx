import { AmountInput as PlainAmountInput, type AmountInputProps } from '@rectio/ui';
import { useLayoutEffect, useRef } from 'react';

import { tweenTo } from '../lib/animate';
import { usePlainMotion } from '../lib/mode';
import { assignRef } from '../lib/ref';
import { readMotionTokens } from '../lib/tokens';

export type { AmountInputProps };

type ChangeDetails = Parameters<NonNullable<AmountInputProps['onValueChange']>>[1];

/**
 * Changes the user types are never animated: the figure under the caret must stay put. Only a
 * change that arrives whole (arrow keys, wheel, stepper buttons, a value set by the app) ticks.
 */
const TYPED = new Set(['input-change', 'input-clear', 'input-paste', 'input-blur']);

/**
 * The figures nudge a hair in the direction of the change (up for more, down for less) and settle.
 * Short and small, so the amount is legible at every frame; it confirms that a step landed and
 * which way it went. Ticks only when the value is controlled.
 */
function MotionAmountInput({ ref, value, onValueChange, ...props }: AmountInputProps) {
  const root = useRef<HTMLDivElement | null>(null);
  const typed = useRef(false);
  const previous = useRef(value);

  useLayoutEffect(() => {
    const before = previous.current;
    previous.current = value;
    const wasTyped = typed.current;
    typed.current = false;
    if (wasTyped || before === value || before == null || value == null) return;
    const input = root.current?.querySelector('input');
    if (input == null) return;
    const tokens = readMotionTokens(input);
    if (tokens === null) return;
    const from = value > before ? tokens.distance.tick : `-${tokens.distance.tick}`;
    tweenTo(
      input,
      { transform: [`translateY(${from})`, 'translateY(0)'] },
      tokens.duration.base,
      tokens.easing.enter,
    );
  }, [value]);

  return (
    <PlainAmountInput
      ref={(node: HTMLDivElement | null) => {
        root.current = node;
        assignRef(ref, node);
      }}
      data-motion=""
      value={value}
      onValueChange={(next: number | null, details: ChangeDetails) => {
        typed.current = TYPED.has(details.reason);
        onValueChange?.(next, details);
      }}
      {...props}
    />
  );
}

/** AmountInput whose figures tick on a stepped change. Same props as the plain one. */
export function AmountInput(props: AmountInputProps) {
  const plain = usePlainMotion();
  return plain ? <PlainAmountInput {...props} /> : <MotionAmountInput {...props} />;
}
