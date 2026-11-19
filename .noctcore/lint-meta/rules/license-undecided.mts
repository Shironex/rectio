import type { IMetaCtx, IMetaRule, IViolation } from '@noctcore/harness';

const RULE = 'license-undecided';

/**
 * The license model is not decided yet. Until it is, no package may be publishable or carry a
 * license, and the repo has no LICENSE file. Delete this rule in the commit that picks one.
 */
export const licenseUndecided: IMetaRule = {
  id: RULE,
  category: 'config',
  ciCritical: true,
  description: 'Every package is private and UNLICENSED, and there is no LICENSE file.',
  run(ctx: IMetaCtx): IViolation[] {
    const violations: IViolation[] = [];
    for (const file of ['LICENSE', 'LICENSE.md', 'LICENSE.txt']) {
      if (ctx.exists(file)) {
        violations.push({ file, rule: RULE, message: 'the license is not decided: remove it' });
      }
    }
    const manifests = [
      'package.json',
      ...ctx.glob('{packages,apps,tooling,templates}/*/package.json'),
    ];
    for (const file of manifests) {
      const text = ctx.read(file);
      if (text === null) continue;
      const manifest = JSON.parse(text) as { private?: boolean; license?: string };
      if (manifest.private !== true) {
        violations.push({ file, rule: RULE, message: 'must be "private": true for now' });
      }
      if (manifest.license !== 'UNLICENSED') {
        violations.push({ file, rule: RULE, message: 'must be "license": "UNLICENSED" for now' });
      }
    }
    return violations;
  },
};
