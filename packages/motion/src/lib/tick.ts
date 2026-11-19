import { useLayoutEffect, useRef } from 'react';

import { tweenTo } from './animate';
import { readMotionTokens } from './tokens';

/**
 * Changes made from the keyboard or in a rapid stream are never animated: the figure under the
 * caret must stay put, and arrow keys, the wheel and scrubbing repeat too often to wait for
 * motion. Only a discrete step ticks: a stepper button press or a value set by the app. These are
 * the change reasons of Base UI's NumberField.
 */
const STILL = new Set([
  'input-change',
  'input-clear',
  'input-paste',
  'input-blur',
  'keyboard',
  'wheel',
  'scrub',
]);

/**
 * The figure tick shared by number entry fields. The figures nudge a hair in the direction of the
 * change (up for more, down for less) and settle. Short and small, so the value is legible at
 * every frame; it confirms that a step landed and which way it went. Ticks only when the value is
 * controlled, since it watches `value`.
 *
 * Attach `rootRef` to the field's root element, and call `noteReason` from `onValueChange` with the
 * change reason, so typed, keyboard and streamed changes are skipped.
 */
export function useFigureTick(value: number | null | undefined) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const still = useRef(false);
  const previous = useRef(value);

  useLayoutEffect(() => {
    const before = previous.current;
    previous.current = value;
    const wasStill = still.current;
    still.current = false;
    if (wasStill || before === value || before == null || value == null) return;
    const input = rootRef.current?.querySelector('input');
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

  const noteReason = (reason: string) => {
    still.current = STILL.has(reason);
  };

  return { rootRef, noteReason };
}
