import { MotionParts } from '../lib/motion-parts';
import { KpiRow as PlainKpiRow, type KpiRowProps } from './kpi-row';

export type { KpiRowProps };

/** KpiRow with the motion parts: same props, plain under reduced motion. */
export function KpiRow(props: KpiRowProps) {
  return (
    <MotionParts>
      <PlainKpiRow {...props} />
    </MotionParts>
  );
}
