/**
 * Just enough CSS structure to split the token stylesheet per theme: top-level blocks with their
 * prelude (selector list or at-rule) and body. Comments directly above a block travel with it.
 * Not a general CSS parser: strings containing braces are not expected in token output.
 */
export interface CssBlock {
  /** Comment lines directly above the block, verbatim. */
  comment: string;
  /** Selector list or at-rule, trimmed. */
  prelude: string;
  /** Text between the outer braces, verbatim. */
  body: string;
}

export function splitBlocks(css: string): CssBlock[] {
  const blocks: CssBlock[] = [];
  let depth = 0;
  let chunkStart = 0;
  let bodyStart = 0;
  let prelude = '';
  for (let i = 0; i < css.length; i++) {
    const char = css[i];
    if (char === '/' && css[i + 1] === '*') {
      const end = css.indexOf('*/', i + 2);
      i = end === -1 ? css.length : end + 1;
      continue;
    }
    if (char === '{') {
      if (depth === 0) {
        prelude = css.slice(chunkStart, i);
        bodyStart = i + 1;
      }
      depth++;
    } else if (char === '}') {
      depth--;
      if (depth < 0) throw new Error(`unbalanced "}" at offset ${i}`);
      if (depth === 0) {
        blocks.push({ ...splitComment(prelude), body: css.slice(bodyStart, i) });
        chunkStart = i + 1;
      }
    } else if (char === ';' && depth === 0) {
      // A statement at-rule such as @import: not a block, skip it.
      chunkStart = i + 1;
    }
  }
  if (depth !== 0) throw new Error('unbalanced "{"');
  return blocks;
}

function splitComment(raw: string): { comment: string; prelude: string } {
  const comments = [...raw.matchAll(/\/\*[\s\S]*?\*\//g)].map((m) => m[0]);
  const prelude = raw.replace(/\/\*[\s\S]*?\*\//g, '').trim();
  return { comment: comments.join('\n'), prelude };
}

/** Prints a block back, indenting nested lines when `indent` is given. */
export function printBlock(block: CssBlock, indent = ''): string {
  const comment = block.comment === '' ? '' : `${indent}${block.comment}\n`;
  const prelude = block.prelude
    .split('\n')
    .map((line) => `${indent}${line.trim()}`)
    .join('\n');
  const body = block.body.replace(/^\n+|\s+$/g, '');
  return `${comment}${prelude} {\n${body}\n${indent}}`;
}
