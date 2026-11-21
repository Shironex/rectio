import type { Demo } from './demo';
import { SignInDemo } from './sign-in';
import { TeamMembersDemo } from './team-members';
import { SignUpDemo } from './sign-up';
import { TwoFactorDemo } from './two-factor';
import { ResetPasswordDemo } from './reset-password';
import { ProfileSettingsDemo } from './profile-settings';
import { BillingDemo } from './billing';
import { ApiKeysDemo } from './api-keys';
import { NotificationPreferencesDemo } from './notification-preferences';
import { PricingTableDemo } from './pricing-table';
import { OnboardingChecklistDemo } from './onboarding-checklist';
import { ActivityFeedDemo } from './activity-feed';
import { NotificationsCenterDemo } from './notifications-center';
import { ChangelogDemo } from './changelog';
import { UsersTableDemo } from './users-table';
import { KanbanBoardDemo } from './kanban-board';
import { CommentThreadDemo } from './comment-thread';
import { FileManagerDemo } from './file-manager';
import { SessionsDemo } from './sessions';

/** Every SaaS block demo by its registry name, in the order the screenshots walk them. */
export const SAAS_DEMOS = {
  'sign-in': SignInDemo,
  'team-members': TeamMembersDemo,
  'sign-up': SignUpDemo,
  'two-factor': TwoFactorDemo,
  'reset-password': ResetPasswordDemo,
  'profile-settings': ProfileSettingsDemo,
  billing: BillingDemo,
  'api-keys': ApiKeysDemo,
  'notification-preferences': NotificationPreferencesDemo,
  'pricing-table': PricingTableDemo,
  'onboarding-checklist': OnboardingChecklistDemo,
  'activity-feed': ActivityFeedDemo,
  'notifications-center': NotificationsCenterDemo,
  changelog: ChangelogDemo,
  'users-table': UsersTableDemo,
  'kanban-board': KanbanBoardDemo,
  'comment-thread': CommentThreadDemo,
  'file-manager': FileManagerDemo,
  sessions: SessionsDemo,
} satisfies Record<string, Demo>;

export type SaasBlockName = keyof typeof SAAS_DEMOS;

export const SAAS_BLOCK_NAMES = Object.keys(SAAS_DEMOS) as SaasBlockName[];

/** Auth blocks stand alone on the canvas; the rest sit in an app column. */
export const AUTH_BLOCKS: ReadonlySet<string> = new Set([
  'sign-in',
  'sign-up',
  'two-factor',
  'reset-password',
]);
