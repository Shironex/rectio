import type { IMetaCtx, IMetaRule, IViolation } from '@noctcore/harness';
import { findDesignValueViolations } from '@rectio/design-rules';
import ts from 'typescript';

const RULE = 'ui-no-hardcoded-design-values';

/** String and template literal pieces of a TS/TSX file, with their offsets. */
function stringPieces(text: string, jsx: boolean): { text: string; offset: number }[] {
  const scanner = ts.createScanner(
    ts.ScriptTarget.Latest,
    false,
    jsx ? ts.LanguageVariant.JSX : ts.LanguageVariant.Standard,
    text,
  );
  const pieces: { text: string; offset: number }[] = [];
  const kinds = new Set([
    ts.SyntaxKind.StringLiteral,
    ts.SyntaxKind.NoSubstitutionTemplateLiteral,
    ts.SyntaxKind.TemplateHead,
    ts.SyntaxKind.TemplateMiddle,
    ts.SyntaxKind.TemplateTail,
  ]);
  for (let kind = scanner.scan(); kind !== ts.SyntaxKind.EndOfFileToken; kind = scanner.scan()) {
    if (kinds.has(kind)) {
      pieces.push({ text: scanner.getTokenText(), offset: scanner.getTokenStart() });
    }
  }
  return pieces;
}

function lineAndColumn(text: string, index: number): { line: number; column: number } {
  const before = text.slice(0, index).split('\n');
  return { line: before.length, column: (before.at(-1)?.length ?? 0) + 1 };
}

/**
 * The CI-critical twin of the ESLint rule `rectio/no-hardcoded-design-values`. It reads every
 * file under packages/ui/src and packages/motion/src straight from disk, so an inline eslint-disable cannot hide a value,
 * and it covers CSS files ESLint never sees.
 */
export const uiNoHardcodedDesignValues: IMetaRule = {
  id: RULE,
  category: 'source-text',
  ciCritical: true,
  description:
    'Components in packages/ui and packages/motion never hardcode colour, radius, font, shadow, duration, easing or spring.',
  run(ctx: IMetaCtx): IViolation[] {
    const violations: IViolation[] = [];
    const files = [
      ...ctx.glob('packages/ui/src/**/*'),
      ...ctx.glob('packages/motion/src/**/*'),
    ].filter((file) => /\.(tsx?|css)$/.test(file) && !/\.test\.tsx?$/.test(file));
    for (const file of files) {
      const text = ctx.read(file);
      if (text === null) continue;
      const pieces = file.endsWith('.css')
        ? [{ text: text.replace(/\/\*[\s\S]*?\*\//g, (c) => ' '.repeat(c.length)), offset: 0 }]
        : stringPieces(text, file.endsWith('.tsx'));
      for (const piece of pieces) {
        for (const v of findDesignValueViolations(piece.text)) {
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
