import type { KanbanPriority } from '@rectio/blocks';
import type { BadgeTone } from '@rectio/ui';

import type { TicketStatus } from '@/data/customers';

export const PRIORITY_LABELS: Record<KanbanPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

export const PRIORITY_TONES: Record<KanbanPriority, BadgeTone> = {
  low: 'neutral',
  medium: 'info',
  high: 'warning',
  urgent: 'negative',
};

export const STATUS_LABELS: Record<TicketStatus, string> = {
  open: 'Open',
  waiting: 'Waiting on customer',
  resolved: 'Resolved',
};

export const STATUS_TONES: Record<TicketStatus, BadgeTone> = {
  open: 'info',
  waiting: 'warning',
  resolved: 'positive',
};
