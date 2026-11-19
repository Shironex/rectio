'use client';

import { useEffect, useRef, useState } from 'react';

/** Real output of the rectio CLI against the local registry, trimmed of the install step. */
const SCRIPT = [
  { command: 'pnpm dlx rectio init --theme ledger' },
  {
    output: [
      'Set up rectio for next (Tailwind 4.3.5).',
      'Installed theme-default@0.1.1, tokens@0.1.1, theme-ledger@0.1.1, cn@0.1.0',
      '  + src/styles/rectio/themes/default.css',
      '  + src/styles/rectio/tokens.css',
      '  + src/styles/rectio/themes/ledger.css',
      '  + src/lib/cn.ts',
      '',
      'Config: rectio.json. Add components with `rectio add button`.',
    ],
  },
  { command: 'pnpm dlx rectio add data-table money' },
  {
    output: [
      'Installed button@0.1.0, checkbox@0.1.0, data-table@0.1.0, money@0.1.0',
      '  + src/components/ui/button.tsx',
      '  + src/components/ui/checkbox.tsx',
      '  + src/components/ui/table.tsx',
      '  + src/components/ui/data-table.tsx',
      '  + src/components/ui/pagination.tsx',
      '  + src/components/ui/money.tsx',
      '  added packages: @base-ui/react, @phosphor-icons/react, @tanstack/react-table',
    ],
  },
] as const;

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
export function Terminal() {
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
        ? stagger * 9
        : outputEnds
          ? stagger * 16
          : current !== undefined && current.lines > 0
            ? stagger * 1.4
            : stagger * (0.9 + ((index * 7) % 5) * 0.25);
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
        }, stagger * 6);
      },
      { threshold: 0.5 },
    );
    observer.observe(element);
    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, []);

  const at = FRAMES[Math.min(frame, FRAMES.length - 1)];
  const typingStep = done ? -1 : (at?.step ?? 0);

  return (
    <div
      ref={ref}
      className="flex flex-col overflow-hidden rounded-panel border border-line bg-surface-sunken"
    >
      <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
        <span className="font-mono text-xs text-fg-muted">~/acme-expenses</span>
        <span className="font-mono text-xs text-fg-subtle">zsh</span>
      </div>
      {/* The full session is always in the DOM for screen readers; the animation only hides parts. */}
      <pre className="sr-only">
        {SCRIPT.map((step) =>
          'command' in step ? `$ ${step.command}` : step.output.join('\n'),
        ).join('\n')}
      </pre>
      <div
        aria-hidden
        className="min-h-112 overflow-x-auto px-4 py-4 font-mono text-sm leading-6 text-fg sm:px-5"
      >
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
              <p key={step.command} className="whitespace-pre">
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
            <div key={s} className="mb-3 text-fg-muted">
              {step.output.slice(0, shown).map((line, l) => (
                <p
                  key={l}
                  className={
                    line.startsWith('  +')
                      ? 'whitespace-pre text-positive-strong'
                      : 'whitespace-pre'
                  }
                >
                  {line === '' ? ' ' : line}
                </p>
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
  );
}
