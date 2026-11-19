import {
  CheckCircleIcon,
  CircleDashedIcon,
  ClockIcon,
  ProhibitIcon,
  WarningCircleIcon,
  XCircleIcon,
  type Icon,
} from '@phosphor-icons/react';
import { Badge, type BadgeTone } from '@rectio/ui';

/** Every record state the blocks show, each with words, a tone and an icon so none rests on colour. */
export type RecordState =
  'draft' | 'due' | 'overdue' | 'partial' | 'paid' | 'void' | 'pending' | 'approved' | 'rejected';

const STATES: Record<RecordState, { label: string; tone: BadgeTone; icon: Icon }> = {
  draft: { label: 'Draft', tone: 'neutral', icon: CircleDashedIcon },
  due: { label: 'Due', tone: 'info', icon: ClockIcon },
  overdue: { label: 'Overdue', tone: 'negative', icon: WarningCircleIcon },
  partial: { label: 'Part paid', tone: 'warning', icon: ClockIcon },
  paid: { label: 'Paid', tone: 'positive', icon: CheckCircleIcon },
  void: { label: 'Void', tone: 'neutral', icon: ProhibitIcon },
  pending: { label: 'Pending', tone: 'warning', icon: ClockIcon },
  approved: { label: 'Approved', tone: 'positive', icon: CheckCircleIcon },
  rejected: { label: 'Rejected', tone: 'negative', icon: XCircleIcon },
};

export function stateLabel(state: RecordState): string {
  return STATES[state].label;
}

export function StateBadge({ state, label }: { state: RecordState; label?: string }) {
  const { tone, icon: StateIcon } = STATES[state];
  return (
    <Badge tone={tone}>
      <StateIcon aria-hidden weight="bold" />
      {label ?? STATES[state].label}
    </Badge>
  );
}
