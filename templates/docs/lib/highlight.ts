/**
 * Syntax highlighting at build time. shiki's CSS variables theme names every colour as a variable
 * (`var(--rx-code-token-keyword)`), and the rectio themes define those variables for light and
 * dark, so the colours follow the theme switch and no highlighter runs in the browser.
 */
import type { CodeLine } from '@rectio/blocks/docs';
import {
  createCssVariablesTheme,
  createHighlighter,
  type BundledLanguage,
  type Highlighter,
} from 'shiki';

const theme = createCssVariablesTheme({
  name: 'rectio',
  variablePrefix: '--rx-code-',
  variableDefaults: {},
  fontStyle: true,
});

/** The languages the pages use. Add one here when a page needs it. */
const LANGS: BundledLanguage[] = [
  'ts',
  'tsx',
  'js',
  'jsx',
  'json',
  'bash',
  'sh',
  'yaml',
  'http',
  'diff',
  'dockerfile',
  'dotenv',
];

const ALIASES: Record<string, string> = {
  shell: 'bash',
  zsh: 'bash',
  console: 'bash',
  yml: 'yaml',
};

let highlighter: Promise<Highlighter> | undefined;

/** shiki's font style is a bit set: 1 italic, 2 bold, 4 underline. */
function fontStyleOf(bits: number): { fontStyle?: 'italic' | 'bold' } {
  if (bits & 1) return { fontStyle: 'italic' };
  if (bits & 2) return { fontStyle: 'bold' };
  return {};
}

/** Code as lines of coloured tokens, or null for a language shiki does not know. */
export async function highlight(
  code: string,
  lang: string | undefined,
): Promise<CodeLine[] | null> {
  const id = lang === undefined ? undefined : (ALIASES[lang] ?? lang);
  if (id === undefined || !(LANGS as string[]).includes(id)) return null;
  highlighter ??= createHighlighter({ themes: [theme], langs: LANGS });
  const { tokens } = (await highlighter).codeToTokens(code.replace(/\n$/, ''), {
    lang: id as BundledLanguage,
    theme: 'rectio',
  });
  return tokens.map((line) =>
    line.map((token) => ({
      content: token.content,
      ...(token.color === undefined || token.color === 'var(--rx-code-foreground)'
        ? {}
        : { color: token.color }),
      ...fontStyleOf(token.fontStyle ?? 0),
    })),
  );
}
