import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

// The AI blocks take input and hold state, so their components are client modules. Their logic,
// the stream contract and their words must still be importable from a server component, which may
// shape a conversation or translate the words before it renders: those modules stay free of
// 'use client', and the entry takes every value of theirs from them directly, never through a
// client module (a client module's exports are references on the server, and calling one throws).
const ROOT = join(import.meta.dirname, '../src/ai');

function files(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory()
      ? files(join(dir, entry.name))
      : /\.tsx?$/.test(entry.name)
        ? [join(dir, entry.name)]
        : [],
  );
}

const sources = files(ROOT).map((path) => ({
  path: relative(ROOT, path),
  source: readFileSync(path, 'utf8'),
}));
const isClient = (source: string) => /^\s*'use client';/.test(source);
const serverSafe = (path: string) =>
  path.endsWith('.logic.ts') || path.endsWith('-messages.ts') || path === 'lib/stream.ts';

const CLIENT_STATE =
  /\b(useState|useEffect|useLayoutEffect|useRef|useContext|useReducer|createContext|use)\b/;
const reactImports = (source: string) =>
  [...source.matchAll(/^import\s+(?!type\b)\{([^}]*)\}\s+from\s+'react'/gm)]
    .map((match) => match[1] ?? '')
    .join(',');

describe('AI blocks on the server', () => {
  it('keeps logic, messages and the stream contract free of the client directive', () => {
    const safe = sources.filter(({ path }) => serverSafe(path));
    expect(safe.map(({ path }) => path).sort()).toEqual([
      'assistant-sidebar/assistant-sidebar-messages.ts',
      'assistant-sidebar/assistant-sidebar.logic.ts',
      'chat-thread/chat-thread-messages.ts',
      'chat-thread/chat-thread.logic.ts',
      'chat-workspace/chat-workspace-messages.ts',
      'chat-workspace/chat-workspace.logic.ts',
      'lib/stream.ts',
      'prompt-composer/prompt-composer-messages.ts',
      'prompt-composer/prompt-composer.logic.ts',
    ]);
    expect(safe.filter(({ source }) => isClient(source)).map(({ path }) => path)).toEqual([]);
  });

  it('imports only types or server-safe modules into the server-safe ones', () => {
    const offenders = sources
      .filter(({ path }) => serverSafe(path))
      .flatMap(({ path, source }) =>
        [...source.matchAll(/^import\s+(?!type\b)[^;]*from\s+'([^']+)'/gm)]
          .map((match) => match[1] ?? '')
          // @rectio/ui's words come from its own server-safe messages modules (its server test).
          .filter((from) => from.startsWith('.') && !/(\.logic|-messages|stream)$/.test(from))
          .map((from) => `${path}: ${from}`),
      );
    expect(offenders).toEqual([]);
  });

  it('marks every component that holds state, context or input as a client module', () => {
    const missing = sources
      .filter(({ path }) => path.endsWith('.tsx'))
      .filter(
        ({ source }) => CLIENT_STATE.test(reactImports(source)) || /\bon[A-Z]\w*=\{/.test(source),
      )
      .filter(({ source }) => !isClient(source))
      .map(({ path }) => path);
    expect(missing).toEqual([]);
  });

  it('takes every logic and words value of the entry from a server-safe module', () => {
    const entry = readFileSync(join(ROOT, 'index.ts'), 'utf8');
    const offenders: string[] = [];
    for (const match of entry.matchAll(/^export\s+\{([^}]*)\}\s+from\s+'\.\/([^']+)'/gm)) {
      const module = match[2] ?? '';
      const values = (match[1] ?? '')
        .split(',')
        .map((part) => part.trim())
        .filter((name) => name !== '' && !name.startsWith('type '));
      const safe = serverSafe(`${module}.ts`);
      for (const name of values) {
        // Values from a client module must be components, hooks or the parts: capitalised or use*.
        const plainValue = /^[a-z]/.test(name) && !name.startsWith('use');
        const constant = /^[A-Z][A-Z0-9_]+$/.test(name) && !name.endsWith('_PARTS');
        if (!safe && (plainValue || constant)) offenders.push(`${name} from ${module}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
