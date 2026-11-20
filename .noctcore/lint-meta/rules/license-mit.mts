import type { IMetaCtx, IMetaRule, IViolation } from '@noctcore/harness';

const RULE = 'license-mit';

/**
 * rectio is MIT licensed: the LICENSE file sits at the root and every workspace package says so,
 * so a package published later carries the same license as the repo.
 */
export const licenseMit: IMetaRule = {
  id: RULE,
  category: 'config',
  ciCritical: true,
  description: 'The repo has a LICENSE file and every package is "license": "MIT".',
  run(ctx: IMetaCtx): IViolation[] {
    const violations: IViolation[] = [];
    const license = ctx.read('LICENSE');
    if (license?.startsWith('MIT License') !== true) {
      violations.push({ file: 'LICENSE', rule: RULE, message: 'the MIT LICENSE file is missing' });
    }
    const manifests = [
      'package.json',
      ...ctx.glob('{packages,apps,tooling,templates}/*/package.json'),
    ];
    for (const file of manifests) {
      const text = ctx.read(file);
      if (text === null) continue;
      const manifest = JSON.parse(text) as { license?: string };
      if (manifest.license !== 'MIT') {
        violations.push({ file, rule: RULE, message: 'must be "license": "MIT"' });
      }
    }
    return violations;
  },
};
