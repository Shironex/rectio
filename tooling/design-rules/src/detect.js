// @ts-check
/**
 * Finds hardcoded design values in component source. Components must take colour, radius, font,
 * shadow, duration and easing from tokens only, so a theme can restyle them without a fork.
 *
 * The detector works on plain text: a class string, a style value or a whole CSS file. ESLint feeds
 * it string literals; the harness lint-meta rule feeds it whole files.
 */

/**
 * @typedef {object} Violation
 * @property {number} index Offset of the match in the scanned text.
 * @property {string} match The offending text.
 * @property {string} reason Why it is not allowed, written for the person fixing it.
 */

/** CSS custom properties a class may reference with Tailwind's `(--name)` shorthand. */
const ALLOWED_VAR_PREFIXES = [
  '--rx-',
  // Geometry that Base UI measures at runtime; not a design value.
  '--transform-origin',
  '--anchor-width',
  '--anchor-height',
  '--available-width',
  '--available-height',
  '--nested-dialogs',
  // How far a toast has been dragged, set by Base UI Toast while swiping.
  '--toast-swipe-movement-x',
  '--toast-swipe-movement-y',
];

const PALETTE =
  'slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|black|white';
const COLOR_UTILITIES =
  'bg|text|border|border-[trblxyse]|ring|ring-offset|outline|fill|stroke|from|via|to|shadow|inset-shadow|decoration|divide|placeholder|caret|accent';

const FONT_NAMES = [
  'Inter',
  'Geist',
  'IBM Plex',
  'Plex Sans',
  'Plex Mono',
  'Schibsted',
  'Source Serif',
  'Helvetica',
  'Arial',
  'Roboto',
  'SF Pro',
  'Segoe UI',
  'system-ui',
  '-apple-system',
  'Georgia',
  'Times New Roman',
  'Menlo',
  'Consolas',
  'Monaco',
  'Courier',
];

/**
 * @type {{ pattern: RegExp, reason: string, accept?: (match: RegExpExecArray) => boolean }[]}
 */
const CHECKS = [
  {
    pattern: /#(?:[0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{3,4})\b/gi,
    reason: 'raw hex colour: use a semantic colour token (bg-surface, text-fg, border-line, ...)',
  },
  {
    pattern: /\b(?:rgba?|hsla?|hwb|oklch|oklab|lab|lch|color)\(/gi,
    reason: 'raw colour function: use a semantic colour token',
  },
  {
    // An arbitrary value (`rounded-[6px]`, `duration-[200ms]`) or property (`[color:red]`). An
    // arbitrary variant such as `data-[side=top]:` is fine, so a match followed by `:` passes.
    pattern: /(?:^|[\s"'`:])!?(?:[a-z][\w-]*-)?\[[^\]\s]+\](?![\w-]*:)/g,
    reason: 'arbitrary Tailwind value: add a token, or use a token utility',
    // A transition property list (`transition-[opacity,scale]`) names properties, not values.
    accept: (m) => /transition-\[[a-z-]+(?:,[a-z-]+)*\]$/.test(m[0]),
  },
  {
    pattern: /-\((--[\w-]+)\)/g,
    reason: 'CSS variable shorthand outside the --rx- token namespace',
    accept: (m) => ALLOWED_VAR_PREFIXES.some((prefix) => (m[1] ?? '').startsWith(prefix)),
  },
  {
    pattern: new RegExp(`\\b(?:${COLOR_UTILITIES})-(?:${PALETTE})(?:-\\d{2,3})?\\b`, 'g'),
    reason: 'raw Tailwind palette colour: use a semantic colour token',
  },
  {
    pattern: /\b(?:duration|delay)-\d+\b/g,
    reason: 'raw duration utility: use duration-fast, duration-base or duration-slow',
  },
  {
    pattern: /\bease-(?:in-out|in|out|linear)\b/g,
    reason: 'raw easing utility: use ease-standard, ease-enter or ease-exit',
  },
  {
    pattern: /\bcubic-bezier\(|\bsteps\(/g,
    reason: 'raw easing function: use an easing token',
  },
  {
    pattern: /(?<![\w-])\d+(?:\.\d+)?m?s\b(?=[\s;,)"'`]|$)/g,
    reason: 'raw duration: use a duration token',
  },
  {
    pattern: /\brounded(?:-[trblse]{1,2})?-(?:xs|sm|md|lg|xl|2xl|3xl|4xl)\b|\brounded(?![\w-])/g,
    reason: 'raw radius utility: use rounded-control, rounded-panel, rounded-badge or rounded-full',
  },
  {
    pattern: /\b(?:inset-)?shadow-(?:2xs|xs|sm|md|lg|xl|2xl)\b|(?<![\w-])shadow(?![\w-])/g,
    reason: 'raw shadow utility: use shadow-raised or shadow-overlay',
  },
  {
    pattern: /\bfont-(?:serif)\b/g,
    reason: 'raw font family utility: use font-sans, font-display, font-mono or font-numeric',
  },
  {
    pattern: new RegExp(
      `(?:${FONT_NAMES.map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})(?![\\w-])`,
      'g',
    ),
    reason: 'raw font name: fonts come from the --rx-font-* tokens',
  },
  {
    pattern: /(?:^|[\s"'`])dark:/g,
    reason: 'dark: variant in a component: dark mode is solved in the semantic tokens',
  },
];

/**
 * @param {string} text
 * @returns {Violation[]}
 */
export function findDesignValueViolations(text) {
  /** @type {Violation[]} */
  const found = [];
  for (const check of CHECKS) {
    check.pattern.lastIndex = 0;
    let m;
    while ((m = check.pattern.exec(text)) !== null) {
      if (m[0].length === 0) {
        check.pattern.lastIndex += 1;
        continue;
      }
      if (check.accept?.(m)) continue;
      const trimmed = m[0].replace(/^[\s"'`:]+/, '');
      found.push({
        index: m.index + (m[0].length - trimmed.length),
        match: trimmed,
        reason: check.reason,
      });
    }
  }
  return found.sort((a, b) => a.index - b.index);
}
