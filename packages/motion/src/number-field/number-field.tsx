import { NumberField as PlainNumberField, type NumberFieldProps } from '@rectio/ui';

import { usePlainMotion } from '../lib/mode';
import { assignRef } from '../lib/ref';
import { useFigureTick } from '../lib/tick';

export type { NumberFieldProps };

type ChangeDetails = Parameters<NonNullable<NumberFieldProps['onValueChange']>>[1];

/**
 * The same figure tick as the motioned AmountInput: a stepper press or a value set by the app
 * nudges the figure in its direction and settles. Typing, arrow keys and the wheel never move it.
 * Ticks only when the value is controlled.
 */
function MotionNumberField({ ref, value, onValueChange, ...props }: NumberFieldProps) {
  const { rootRef, noteReason } = useFigureTick(value);

  return (
    <PlainNumberField
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

/** NumberField whose figure ticks on a stepped change. Same props as the plain one. */
export function NumberField(props: NumberFieldProps) {
  const plain = usePlainMotion();
  return plain ? <PlainNumberField {...props} /> : <MotionNumberField {...props} />;
}
