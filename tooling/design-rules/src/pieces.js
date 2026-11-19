// @ts-check
/**
 * String and template literal pieces of a TS or TSX file, with their offsets, for the repo rule
 * that scans files straight from disk. It uses the TypeScript scanner (tokens, no parse), so it is
 * fast and never fails on a file the compiler would reject.
 */
import ts from 'typescript';

import { SELECTOR_METHODS } from './detect.js';

/**
 * @typedef {object} Piece
 * @property {string} text The literal as written, quotes included.
 * @property {number} offset Where it starts in the file.
 * @property {boolean} selector It is the first argument of a selector method such as
 *   `querySelector`, so it holds a CSS selector rather than classes.
 */

const STRING_KINDS = new Set([
  ts.SyntaxKind.StringLiteral,
  ts.SyntaxKind.NoSubstitutionTemplateLiteral,
  ts.SyntaxKind.TemplateHead,
  ts.SyntaxKind.TemplateMiddle,
  ts.SyntaxKind.TemplateTail,
]);

const TRIVIA = new Set([
  ts.SyntaxKind.WhitespaceTrivia,
  ts.SyntaxKind.NewLineTrivia,
  ts.SyntaxKind.SingleLineCommentTrivia,
  ts.SyntaxKind.MultiLineCommentTrivia,
  ts.SyntaxKind.ShebangTrivia,
  ts.SyntaxKind.ConflictMarkerTrivia,
]);

/**
 * True when the tokens before a string are `.method(` or `?.method<Type>(` with a selector method.
 *
 * @param {{ kind: ts.SyntaxKind, text: string }[]} before Significant tokens, oldest first.
 */
function opensSelectorCall(before) {
  let i = before.length - 1;
  if (before[i]?.kind !== ts.SyntaxKind.OpenParenToken) return false;
  i -= 1;
  // Skip a type argument list: querySelector<HTMLElement>(...).
  if (before[i]?.kind === ts.SyntaxKind.GreaterThanToken) {
    let depth = 0;
    for (; i >= 0; i -= 1) {
      const kind = before[i]?.kind;
      if (kind === ts.SyntaxKind.GreaterThanToken) depth += 1;
      if (kind === ts.SyntaxKind.LessThanToken) depth -= 1;
      if (depth === 0) break;
    }
    i -= 1;
  }
  const name = before[i];
  const dot = before[i - 1]?.kind;
  return (
    name?.kind === ts.SyntaxKind.Identifier &&
    SELECTOR_METHODS.has(name.text) &&
    (dot === ts.SyntaxKind.DotToken || dot === ts.SyntaxKind.QuestionDotToken)
  );
}

/**
 * @param {string} text Source of a .ts or .tsx file.
 * @param {boolean} jsx Scan as TSX.
 * @returns {Piece[]}
 */
export function stringPieces(text, jsx) {
  const scanner = ts.createScanner(
    ts.ScriptTarget.Latest,
    false,
    jsx ? ts.LanguageVariant.JSX : ts.LanguageVariant.Standard,
    text,
  );
  /** @type {Piece[]} */
  const pieces = [];
  /** @type {{ kind: ts.SyntaxKind, text: string }[]} */
  const before = [];
  // The scanner alone cannot tell the `}` that closes a `${...}` from any other brace, so it would
  // read the code after a template expression as template text. A stack of open braces says which
  // `}` ends a substitution, and the template is rescanned from there. A template entry remembers
  // whether its literal is a selector, so every piece of it is marked alike.
  /** @type {('code' | { selector: boolean })[]} */
  const braces = [];
  for (let kind = scanner.scan(); kind !== ts.SyntaxKind.EndOfFileToken; kind = scanner.scan()) {
    if (TRIVIA.has(kind)) continue;
    let selector = false;
    if (kind === ts.SyntaxKind.OpenBraceToken) braces.push('code');
    if (kind === ts.SyntaxKind.TemplateHead) {
      selector = opensSelectorCall(before);
      braces.push({ selector });
    }
    if (kind === ts.SyntaxKind.CloseBraceToken) {
      const open = braces.pop();
      if (open !== undefined && open !== 'code') {
        kind = scanner.reScanTemplateToken(false);
        selector = open.selector;
        if (kind === ts.SyntaxKind.TemplateMiddle) braces.push(open);
      }
    }
    if (
      kind === ts.SyntaxKind.StringLiteral ||
      kind === ts.SyntaxKind.NoSubstitutionTemplateLiteral
    )
      selector = opensSelectorCall(before);
    if (STRING_KINDS.has(kind)) {
      pieces.push({ text: scanner.getTokenText(), offset: scanner.getTokenStart(), selector });
    }
    before.push({ kind, text: scanner.getTokenText() });
    // Only the last few tokens matter: a method name, a type argument list, the paren.
    if (before.length > 32) before.shift();
  }
  return pieces;
}
