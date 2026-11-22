interface Block {
  selector: string;
  body: string;
}

/** The top-level rules of a stylesheet. At-rules (`@media`, `@theme`) are skipped, not entered. */
function topLevelRules(css: string): Block[] {
  const blocks: Block[] = [];
  const text = css.replace(/\/\*[\s\S]*?\*\//g, '');
  let depth = 0;
  let start = 0;
  let selector = '';
  let bodyStart = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '{') {
      if (depth === 0) {
        selector = text.slice(start, i).trim();
        bodyStart = i + 1;
      }
      depth++;
    } else if (char === '}') {
      depth--;
      if (depth === 0) {
        if (!selector.startsWith('@')) blocks.push({ selector, body: text.slice(bodyStart, i) });
        start = i + 1;
      }
    } else if (char === ';' && depth === 0) {
      start = i + 1;
    }
  }
  return blocks;
}

function declarations(body: string, prefix: string): [string, string][] {
  const out: [string, string][] = [];
  for (const match of body.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    const name = match[1] ?? '';
    if (name.startsWith(prefix)) out.push([name, (match[2] ?? '').trim()]);
  }
  return out;
}

/**
 * The `--rx-*` values a theme stylesheet sets for one mode: the base rule, then (for dark) the
 * `[data-mode="dark"]` rule on top. Rules inside media queries are the system-dark mirror of the
 * explicit dark rule, so they are not read.
 */
export function themeValues(
  css: string,
  themeId: string,
  mode: 'light' | 'dark',
): Map<string, string> {
  const own = `[data-theme="${themeId}"]`;
  const rules = topLevelRules(css).filter((b) =>
    b.selector.split(',').some((s) => s.includes(own)),
  );
  const isDark = (b: Block) => b.selector.includes('[data-mode="dark"]');
  const values = new Map<string, string>();
  const apply = (blocks: Block[]) => {
    for (const block of blocks) {
      for (const [name, value] of declarations(block.body, '--rx-')) values.set(name, value);
    }
  };
  apply(rules.filter((b) => !isDark(b)));
  if (mode === 'dark') apply(rules.filter(isDark));
  return values;
}

/** `color-line-strong` -> `--rx-border-strong`: the token a colour or shadow utility is named for. */
function tokenNamed(key: string): string {
  const [group = '', ...rest] = key.split('-');
  const name = rest.join('-');
  if (group !== 'color') return `--rx-${key}`;
  if (name === 'fg' || name.startsWith('fg-')) return `--rx-text${name.slice(2)}`;
  if (name === 'line' || name.startsWith('line-')) return `--rx-border${name.slice(4)}`;
  return `--rx-${name}`;
}

/**
 * Tailwind utility keys from the `@theme inline` block of the tokens style item:
 * `--color-surface: var(--rx-surface)` maps `--rx-surface` to `color-surface`. A colour or shadow
 * that a skin's switches reach is a composite (`color-mix(in oklab, var(--rx-surface) ...)`, a
 * shadow with an edge highlight and an offset layer): it maps to the token it is named for.
 */
export function tailwindUtilities(css: string): Map<string, string> {
  const map = new Map<string, string>();
  const pattern =
    /--((?:color|font|text|radius|shadow|ease|tracking)-[\w-]+):\s*var\((--rx-[\w-]+)\);/g;
  for (const match of css.matchAll(pattern)) {
    const key = match[1] ?? '';
    const token = match[2] ?? '';
    if (!key.includes('--') && !map.has(token)) map.set(token, key);
  }
  for (const match of css.matchAll(/--((?:color|shadow)-[\w-]+):\s*([^;]+);/g)) {
    const key = match[1] ?? '';
    const token = tokenNamed(key);
    if (key.includes('--') || map.has(token)) continue;
    if ((match[2] ?? '').includes(`var(${token})`) || (match[2] ?? '').includes(`var(${token},`))
      map.set(token, key);
  }
  return map;
}
