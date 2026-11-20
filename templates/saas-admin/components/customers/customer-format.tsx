import { Badge, Tooltip, TooltipContent, TooltipTrigger, type BadgeTone } from '@rectio/ui';

import {
  HEALTH_HINTS,
  HEALTH_LABELS,
  type CustomerHealth,
  type CustomerPlan,
} from '@/data/customers';
import { formatPercent } from '@/data/workspace';

export const HEALTH_TONES: Record<CustomerHealth, BadgeTone> = {
  healthy: 'positive',
  watch: 'warning',
  'at-risk': 'negative',
};

export const PLAN_TONES: Record<CustomerPlan, BadgeTone> = {
  Starter: 'neutral',
  Team: 'neutral',
  Business: 'neutral',
};

/** The health badge, with what it means one hover or focus away. */
export function HealthBadge({ health }: { health: CustomerHealth }) {
  return (
    <Tooltip>
      <TooltipTrigger
        className="relative cursor-default rounded-badge after:absolute after:-inset-x-1 after:-inset-y-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        aria-label={`${HEALTH_LABELS[health]}: ${HEALTH_HINTS[health]}`}
      >
        <Badge tone={HEALTH_TONES[health]}>{HEALTH_LABELS[health]}</Badge>
      </TooltipTrigger>
      <TooltipContent>{HEALTH_HINTS[health]}</TooltipContent>
    </Tooltip>
  );
}

/** Satisfaction as a percentage, or a dash with words for a customer nobody rated yet. */
export function Csat({ value }: { value: number | null }) {
  if (value === null) {
    return <span className="text-fg-muted">No ratings</span>;
  }
  return (
    <span className={value < 0.8 ? 'font-medium text-negative-strong' : undefined}>
      {formatPercent(value)}
    </span>
  );
}
