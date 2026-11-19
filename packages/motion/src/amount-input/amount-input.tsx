import { AmountInput as PlainAmountInput, type AmountInputProps } from '@rectio/ui';

import { usePlainMotion } from '../lib/mode';
import { assignRef } from '../lib/ref';
import { useFigureTick } from '../lib/tick';

export type { AmountInputProps };

type ChangeDetails = Parameters<NonNullable<AmountInputProps['onValueChange']>>[1];

/**
 * The figures nudge a hair in the direction of the change (up for more, down for less) and settle.
 * Short and small, so the amount is legible at every frame; it confirms that a step landed and
 * which way it went. Only a stepper press or a value set by the app moves it; typing, arrow keys
 * and the wheel never do. Ticks only when the value is controlled.
 */
function MotionAmountInput({ ref, value, onValueChange, ...props }: AmountInputProps) {
  const { rootRef, noteReason } = useFigureTick(value);

  return (
    <PlainAmountInput
      ref={(node: HTMLDivElement | null) => {
        rootRef.current = node;
        assignRef(ref, node);
      }}
      data-motion=""
      value={value}
      onValueChange={(next: number | null, details: ChangeDetails) => {
        noteReason(details.reason);
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
