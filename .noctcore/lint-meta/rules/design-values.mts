import type { IMetaCtx, IMetaRule, IViolation } from '@noctcore/harness';
import { findDesignValueViolations } from '@rectio/design-rules';
import { stringPieces } from '@rectio/design-rules/pieces';

const RULE = 'ui-no-hardcoded-design-values';

/** Maps Fumadocs' Tailwind scale names onto rectio tokens, so it has to name them. */
const SITE_BRIDGE = /^apps\/site\/app\/fumadocs\.css$/;

function lineAndColumn(text: string, index: number): { line: number; column: number } {
  const before = text.slice(0, index).split('\n');
  return { line: before.length, column: (before.at(-1)?.length ?? 0) + 1 };
}

/**
 * The CI-critical twin of the ESLint rule `rectio/no-hardcoded-design-values`. It reads every
 * file under packages/ui/src, packages/motion/src and the site's source straight from disk, so an inline eslint-disable cannot hide a value,
 * and it covers CSS files ESLint never sees.
 */
export const uiNoHardcodedDesignValues: IMetaRule = {
  id: RULE,
  category: 'source-text',
  ciCritical: true,
  description:
    'Components in packages/ui and packages/motion, and the site, never hardcode colour, radius, font, shadow, duration, easing or spring.',
  run(ctx: IMetaCtx): IViolation[] {
    const violations: IViolation[] = [];
    const files = [
      ...ctx.glob('packages/ui/src/**/*'),
      ...ctx.glob('packages/motion/src/**/*'),
      ...ctx.glob('apps/site/{app,components,demos,lib}/**/*'),
    ].filter(
      (file) =>
        /\.(tsx?|css)$/.test(file) && !/\.test\.tsx?$/.test(file) && !SITE_BRIDGE.test(file),
    );
    for (const file of files) {
      const text = ctx.read(file);
      if (text === null) continue;
      const pieces = file.endsWith('.css')
        ? [
            {
              text: text.replace(/\/\*[\s\S]*?\*\//g, (c) => ' '.repeat(c.length)),
              offset: 0,
              selector: false,
            },
          ]
        : stringPieces(text, file.endsWith('.tsx'));
      for (const piece of pieces) {
        // A selector passed to querySelector, closest or matches is not a class list.
        for (const v of findDesignValueViolations(piece.text, { selector: piece.selector })) {
          violations.push({
            file,
            rule: RULE,
            message: `${v.match}: ${v.reason}`,
            ...lineAndColumn(text, piece.offset + v.index),
          });
        }
      }
    }
    return violations;
  },
};
