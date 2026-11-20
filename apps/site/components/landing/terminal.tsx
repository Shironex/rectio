'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Real output of the rectio CLI adding a block against the local registry, trimmed of the package
 * install step. Long lines wrap.
 */
const SCRIPT = [
  { command: 'npx @rectio/cli add invoice-list' },
  {
    output: [
      'Installed theme-default@0.2.1, tokens@0.2.1, cn@0.2.0, badge@0.1.0, button@0.2.0, checkbox@0.2.0, field@0.2.0, theme-scope@0.1.0, select@0.1.0, data-table@0.2.0, money@0.1.0, blocks-core@0.1.0, invoice-list@0.1.0',
      '  + src/components/ui/badge.tsx',
      '  + src/components/ui/button.tsx',
      '  + src/components/ui/checkbox.tsx',
      '  + src/components/ui/field.tsx',
      '  + src/components/ui/theme-scope.tsx',
      '  + src/components/ui/select.tsx',
      '  + src/components/ui/table.tsx',
      '  + src/components/ui/data-table.tsx',
      '  + src/components/ui/pagination.tsx',
      '  + src/components/ui/sort.tsx',
      '  + src/components/ui/money.tsx',
      '  + src/lib/finance/finance.ts',
      '  + src/lib/finance/block-parts.tsx',
      '  + src/lib/finance/block-panel.tsx',
      '  + src/lib/finance/chart.tsx',
      '  + src/lib/finance/choice-select.tsx',
      '  + src/lib/finance/empty-note.tsx',
      '  + src/lib/finance/figures.tsx',
      '  + src/lib/finance/segmented.tsx',
      '  + src/lib/finance/state-badge.tsx',
      '  + src/components/blocks/finance/invoice-list.tsx',
      '  + src/components/blocks/finance/invoice-list.logic.ts',
      '  3 file(s) already up to date',
      '  added packages: @base-ui/react, @phosphor-icons/react, @tanstack/react-table, recharts',
    ],
  },
] as const;

/** A path that may wrap only after a slash, never inside a file name such as invoice-list. */
function Path({ path }: { path: string }) {
  const parts = path.split('/');
  return parts.map((part, i) => (
    <span key={i}>
      <span className="whitespace-nowrap">
        {part}
        {i < parts.length - 1 ? '/' : ''}
      </span>
      {i < parts.length - 1 && <wbr />}
    </span>
  ));
}

/**
 * One output line. Wrapped lines hang: their continuation starts under the text, not at the edge.
 * Written files keep their plus in its own column, so a wrapped path lines up under the path.
 */
function OutputLine({ line }: { line: string }) {
  const nested = line.startsWith('  ');
  const text = line.trimStart();
  if (text.startsWith('+ ')) {
    return (
      <p className="flex gap-2 ps-4 text-positive-strong">
        <span aria-hidden>+</span>
        <span className="min-w-0">
          <Path path={text.slice(2)} />
        </span>
      </p>
    );
  }
  // Words stay whole, so a wrap falls between them and never at the hyphen in theme-default.
  const words = text.split(' ');
  return (
    <p className={nested ? 'ps-10 -indent-6' : 'ps-6 -indent-6'}>
      {words.map((word, i) => (
        <span key={i}>
          <span className="whitespace-nowrap">{word}</span>
          {i < words.length - 1 ? ' ' : ''}
        </span>
      ))}
    </p>
  );
}

/** Everything the terminal can show, one entry per character of a command or per output line. */
const FRAMES = SCRIPT.flatMap((step, s) =>
  'command' in step
    ? Array.from({ length: step.command.length }, (_, c) => ({ step: s, chars: c + 1, lines: 0 }))
    : step.output.map((_, l) => ({ step: s, chars: 0, lines: l + 1 })),
);

function readStagger(element: HTMLElement) {
  const value = Number.parseFloat(
    getComputedStyle(element).getPropertyValue('--rx-motion-duration-stagger'),
  );
  return Number.isFinite(value) ? value : 50;
}

/**
 * The CLI in a terminal moment: once the panel is in view, the commands type themselves and their
 * output follows line by line. Typing speed comes from the theme's stagger token and varies per
 * character, as a person types. Reduced motion shows the finished session at once when it comes into view.
 */
export function Terminal({ onDone }: { onDone?: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [frame, setFrame] = useState(0);
  const done = frame >= FRAMES.length;

  useEffect(() => {
    const element = ref.current;
    if (element === null) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const stagger = readStagger(element);
    const tick = (index: number) => {
      setFrame(index);
      if (index >= FRAMES.length) return;
      const current = FRAMES[index];
      const next = FRAMES[index + 1];
      const commandEnds = current !== undefined && current.chars > 0 && next?.lines === 1;
      const outputEnds = current !== undefined && current.lines > 0 && next?.chars === 1;
      // Characters at an uneven typing pace; a beat before output, a longer one before the next command.
      const wait = commandEnds
        ? stagger * 7
        : outputEnds
          ? stagger * 12
          : current !== undefined && current.lines > 0
            ? stagger
            : stagger * (0.6 + ((index * 7) % 5) * 0.2);
      timer = setTimeout(() => {
        tick(index + 1);
      }, wait);
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting !== true) return;
        observer.disconnect();
        if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
          setFrame(FRAMES.length);
          return;
        }
        timer = setTimeout(() => {
          tick(1);
        }, stagger * 2);
      },
      // Starts a little before the panel is on screen, so the session is under way when it arrives.
      { threshold: 0, rootMargin: '0px 0px 25% 0px' },
    );
    observer.observe(element);
    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (done) onDone?.();
  }, [done, onDone]);

  const at = FRAMES[Math.min(frame, FRAMES.length - 1)];
  const typingStep = done ? -1 : (at?.step ?? 0);

  return (
    <div
      ref={ref}
      data-typing={done ? undefined : ''}
      className="flex flex-col overflow-hidden rounded-panel border border-line bg-surface-sunken"
    >
      <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
        <span className="font-mono text-xs text-fg-muted">~/acme-expenses</span>
        <span className="font-mono text-xs text-fg-muted">zsh</span>
      </div>
      {/* The full session is always in the DOM for screen readers; the animation only hides parts. */}
      <pre className="sr-only">
        {SCRIPT.map((step) =>
          'command' in step ? `$ ${step.command}` : step.output.join('\n'),
        ).join('\n')}
      </pre>
      {/* The pane holds a whole number of lines (20 on a phone, 16 wider) and the gap is one line,
          so the oldest line leaves at the top edge whole, never cut through. */}
      {/* Padding sits outside the clipping box, so no part of a clipped line shows above the text. */}
      <div aria-hidden className="px-4 py-2 sm:px-5 sm:py-4">
        <div className="flex h-100 flex-col justify-end overflow-hidden font-mono text-xs leading-5 text-fg sm:h-96 sm:text-sm sm:leading-6">
          {frame === 0 && (
            <p className="whitespace-pre">
              <span className="text-accent-strong">$ </span>
              <span className="site-caret inline-block h-4 w-2 translate-y-0.5 bg-fg" />
            </p>
          )}
          {SCRIPT.map((step, s) => {
            if (at === undefined || frame === 0) return null;
            if (!done && s > at.step) return null;
            if ('command' in step) {
              const shown = done || s < at.step ? step.command.length : at.chars;
              return (
                <p key={step.command} className="whitespace-pre-wrap sm:whitespace-pre">
                  <span className="text-accent-strong">$ </span>
                  {step.command.slice(0, shown)}
                  {s === typingStep && (
                    <span className="site-caret ms-px inline-block h-4 w-2 translate-y-0.5 bg-fg" />
                  )}
                </p>
              );
            }
            const shown = done || s < at.step ? step.output.length : at.lines;
            return (
              <div key={s} className="mb-5 text-fg-muted sm:mb-6">
                {step.output.slice(0, shown).map((line, l) => (
                  <OutputLine key={l} line={line} />
                ))}
              </div>
            );
          })}
          {done && (
            <p className="whitespace-pre">
              <span className="text-accent-strong">$ </span>
              <span className="site-caret inline-block h-4 w-2 translate-y-0.5 bg-fg" />
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
