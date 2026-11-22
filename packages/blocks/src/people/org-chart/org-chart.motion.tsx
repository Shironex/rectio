'use client';

import { MotionParts } from '../../lib/motion-parts';
import { OrgChart as PlainOrgChart, type OrgChartProps } from './org-chart';

export type { OrgChartProps };

/** OrgChart with the motion parts: the chart fades up on first view. Same props; plain under reduced motion. */
export function OrgChart(props: OrgChartProps) {
  return (
    <MotionParts>
      <PlainOrgChart {...props} />
    </MotionParts>
  );
}
