import {
  ArchiveIcon,
  CalendarBlankIcon,
  CheckCircleIcon,
  CircleDashedIcon,
  ClockIcon,
  LightbulbIcon,
  LinkBreakIcon,
  LinkIcon,
  PaperPlaneTiltIcon,
  PauseCircleIcon,
  ProhibitIcon,
  WarningCircleIcon,
  WarningOctagonIcon,
  XCircleIcon,
  type Icon,
} from '@phosphor-icons/react';
import { Badge, type BadgeTone } from '@rectio/ui';

/** Every record state the blocks show, each with words, a tone and an icon so none rests on colour. */
export type RecordState =
  | 'draft'
  | 'due'
  | 'overdue'
  | 'partial'
  | 'paid'
  | 'void'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'scheduled'
  | 'in-transit'
  | 'failed'
  | 'cancelled'
  | 'active'
  | 'on-hold'
  | 'archived'
  | 'matched'
  | 'suggested'
  | 'unmatched';

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
  scheduled: { label: 'Scheduled', tone: 'neutral', icon: CalendarBlankIcon },
  'in-transit': { label: 'In transit', tone: 'info', icon: PaperPlaneTiltIcon },
  failed: { label: 'Failed', tone: 'negative', icon: WarningOctagonIcon },
  cancelled: { label: 'Cancelled', tone: 'neutral', icon: ProhibitIcon },
  // Neutral: active is the normal case, so a column of green would only be noise.
  active: { label: 'Active', tone: 'neutral', icon: CheckCircleIcon },
  'on-hold': { label: 'On hold', tone: 'warning', icon: PauseCircleIcon },
  archived: { label: 'Archived', tone: 'neutral', icon: ArchiveIcon },
  matched: { label: 'Matched', tone: 'positive', icon: LinkIcon },
  suggested: { label: 'Suggested', tone: 'info', icon: LightbulbIcon },
  unmatched: { label: 'Unmatched', tone: 'warning', icon: LinkBreakIcon },
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
