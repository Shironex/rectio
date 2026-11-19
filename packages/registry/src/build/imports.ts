import ts from 'typescript';

export interface ImportSite {
  specifier: string;
  /** Offset of the first character of the specifier, inside its quotes. */
  start: number;
}

/**
 * Every module specifier in a file: static imports and re-exports (type-only too), dynamic
 * imports and side-effect imports. Uses the TypeScript scanner, so strings and comments that only
 * look like imports are ignored.
 */
export function findImports(source: string): ImportSite[] {
  const { importedFiles } = ts.preProcessFile(source, true, true);
  return importedFiles.map(({ fileName, pos }) => ({
    specifier: fileName,
    start: source.indexOf(fileName, pos),
  }));
}

/** Replaces specifiers by offset, back to front so earlier offsets stay valid. */
export function replaceImports(
  source: string,
  sites: readonly ImportSite[],
  replace: (specifier: string) => string,
): string {
  let out = source;
  for (const site of [...sites].sort((a, b) => b.start - a.start)) {
    const next = replace(site.specifier);
    if (next === site.specifier) continue;
    out = out.slice(0, site.start) + next + out.slice(site.start + site.specifier.length);
  }
  return out;
}

/** `@base-ui/react/button` -> `@base-ui/react`, `clsx` -> `clsx`. */
export function packageName(specifier: string): string {
  const parts = specifier.split('/');
  return specifier.startsWith('@') ? parts.slice(0, 2).join('/') : (parts[0] ?? specifier);
}

export function isRelative(specifier: string): boolean {
  return specifier.startsWith('./') || specifier.startsWith('../');
}

/** Named imports from 'react' in a file, type-only ones excluded. */
export function reactValueImports(source: string): string[] {
  const names: string[] = [];
  const pattern = /import\s+(?!type\s)([^;]*?)\s+from\s+['"]react['"]/g;
  for (const match of source.matchAll(pattern)) {
    const clause = match[1] ?? '';
    const braces = /\{([^}]*)\}/.exec(clause)?.[1] ?? '';
    for (const raw of braces.split(',')) {
      const name = raw.trim();
      if (name === '' || name.startsWith('type ')) continue;
      names.push(name.split(/\s+as\s+/)[0] ?? name);
    }
  }
  return names;
}
