/** Where a meter's value sits against its thresholds. Plain, so a server can run it too. */

export interface MeterThresholds {
  /** From this value up the meter reads as a warning. */
  warning?: number | undefined;
  /** From this value up the meter reads as critical. */
  critical?: number | undefined;
  /**
   * `high` (default) when more is worse, such as storage used; `low` when less is worse, such as a
   * health score, so the thresholds count downward.
   */
  worse?: 'high' | 'low' | undefined;
}

export type MeterLevel = 'normal' | 'warning' | 'critical';

/** Where a value sits against its thresholds. */
export function meterLevel(value: number, thresholds: MeterThresholds = {}): MeterLevel {
  const { warning, critical, worse = 'high' } = thresholds;
  const past = (limit: number | undefined) =>
    limit !== undefined && (worse === 'high' ? value >= limit : value <= limit);
  if (past(critical)) return 'critical';
  if (past(warning)) return 'warning';
  return 'normal';
}
