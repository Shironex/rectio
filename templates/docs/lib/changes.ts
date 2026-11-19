import type { ChangeType } from '@rectio/blocks/docs';

/** The words the changelog uses for each kind of change, for server-rendered summaries. */
export const CHANGE_LABELS: Record<ChangeType, string> = {
  breaking: 'Breaking',
  security: 'Security',
  feature: 'Added',
  improvement: 'Improved',
  fix: 'Fixed',
  deprecation: 'Deprecated',
};
