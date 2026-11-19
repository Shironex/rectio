import type { Demo } from './demo';
import { SignInDemo } from './sign-in';
import { TeamMembersDemo } from './team-members';

/** Every SaaS block demo by its registry name, in the order the screenshots walk them. */
export const SAAS_DEMOS = {
  'sign-in': SignInDemo,
  'team-members': TeamMembersDemo,
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
