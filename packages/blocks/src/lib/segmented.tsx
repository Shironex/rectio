import { SegmentedControl, type SegmentedOption } from '@rectio/ui';

export type { SegmentedOption };

export interface SegmentedProps<Value extends string> {
  /** Names the group, such as "Status" or "Period". */
  label: string;
  value: Value;
  onValueChange: (value: Value) => void;
  options: readonly SegmentedOption<Value>[];
  className?: string;
}

/**
 * One choice from a few, always visible: a status filter or a period switch. The kit's
 * SegmentedControl at the small size: one row while it fits, two even columns in a narrow block
 * (under 28rem) or on a phone, so every label stays whole and nothing scrolls out of view.
 */
export function Segmented<Value extends string>(props: SegmentedProps<Value>) {
  return <SegmentedControl<Value> size="sm" data-slot="segmented" {...props} />;
}
