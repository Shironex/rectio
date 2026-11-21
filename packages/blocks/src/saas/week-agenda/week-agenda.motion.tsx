import { readMotionTokens, usePlainMotion } from '@rectio/motion';
import { useLayoutEffect, useRef, type ReactNode } from 'react';

import { SaasMotionParts } from '../lib/saas-motion-parts';
import {
  AgendaPartsProvider,
  WeekAgenda as PlainWeekAgenda,
  type AgendaParts,
  type WeekAgendaProps,
} from './week-agenda';

export type { WeekAgendaProps };

/**
 * A step to another day or week slides the new days in from the side the user stepped to, a short
 * shift with a fade on the enter easing, so the move reads as travel along the calendar. Transform
 * and opacity only; the first render and Today with no direction stay still.
 */
function Stage({
  rangeKey,
  direction,
  children,
}: {
  rangeKey: string;
  direction: number;
  children: ReactNode;
}) {
  const plain = usePlainMotion();
  const ref = useRef<HTMLDivElement>(null);
  const shown = useRef(rangeKey);

  useLayoutEffect(() => {
    const element = ref.current;
    if (shown.current === rangeKey) return;
    shown.current = rangeKey;
    const tokens = element === null || plain ? null : readMotionTokens(element);
    if (element === null || tokens === null || direction === 0) return;
    const ease =
      getComputedStyle(element).getPropertyValue('--rx-motion-easing-enter').trim() || 'linear';
    const animation = element.animate(
      [
        {
          opacity: 0,
          transform: `translateX(calc(${String(Math.sign(direction))} * ${tokens.distance.shift}))`,
        },
        { opacity: 1, transform: 'none' },
      ],
      { duration: tokens.duration.base * 1000, easing: ease },
    );
    return () => {
      animation.cancel();
    };
  }, [rangeKey, direction, plain]);

  return <div ref={ref}>{children}</div>;
}

const MOTION_AGENDA_PARTS: AgendaParts = { Stage };

/** WeekAgenda with the motion parts: same props, plain under reduced motion. */
export function WeekAgenda(props: WeekAgendaProps) {
  return (
    <SaasMotionParts>
      <AgendaPartsProvider parts={MOTION_AGENDA_PARTS}>
        <PlainWeekAgenda {...props} />
      </AgendaPartsProvider>
    </SaasMotionParts>
  );
}
