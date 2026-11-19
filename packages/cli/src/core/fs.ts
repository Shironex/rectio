import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, relative, sep } from 'node:path';

import { normalizeLineEndings } from '@rectio/registry';

import { CliError } from './context.ts';

export function readText(file: string): string | undefined {
  return existsSync(file) ? readFileSync(file, 'utf8') : undefined;
}

/** Reads a file with LF line endings, so a CRLF checkout on Windows compares equal. */
export function readNormalized(file: string): string | undefined {
  const text = readText(file);
  return text === undefined ? undefined : normalizeLineEndings(text);
}

export function writeText(file: string, content: string): void {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, content);
}

export function readJson(file: string): unknown {
  const text = readText(file);
  if (text === undefined) return undefined;
  try {
    return JSON.parse(text) as unknown;
  } catch (error) {
    throw new CliError(`${file} is not valid JSON: ${(error as Error).message}`);
  }
}

export function writeJson(file: string, value: unknown, indent: string | number = 2): void {
  writeText(file, `${JSON.stringify(value, null, indent)}\n`);
}

/** Project-relative path with forward slashes, for config, lockfile and messages. */
export function toProjectPath(root: string, file: string): string {
  return relative(root, file).split(sep).join('/');
}

/** True when `file` is `root` or inside it. Guards every write against path tricks. */
export function isInside(root: string, file: string): boolean {
  const rel = relative(root, file);
  return rel === '' || (!rel.startsWith('..') && !isAbsolute(rel));
}

/** JSON with comments and trailing commas, as tsconfig files allow. */
export function parseJsonc(text: string): unknown {
  let out = '';
  let inString = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i] ?? '';
    const next = text[i + 1];
    if (inString) {
      out += char;
      if (char === '\\') {
        out += next ?? '';
        i++;
      } else if (char === '"') inString = false;
      continue;
    }
    if (char === '"') {
      inString = true;
      out += char;
    } else if (char === '/' && next === '/') {
      while (i < text.length && text[i] !== '\n') i++;
      out += '\n';
    } else if (char === '/' && next === '*') {
      const end = text.indexOf('*/', i + 2);
      i = end === -1 ? text.length : end + 1;
    } else {
      out += char;
    }
  }
  return JSON.parse(out.replace(/,(\s*[}\]])/g, '$1')) as unknown;
}
