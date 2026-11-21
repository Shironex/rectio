'use client';

import { CheckCircleIcon, InfoIcon, WarningIcon, WrenchIcon } from '@phosphor-icons/react';
import { Collapsible, CollapsiblePanel, CollapsibleTrigger, cn } from '@rectio/ui';
import { passCount, type ModeResult, type ResolvedTheme } from '@rectio/tokens/generator';

import { percent } from './model';

const MODES = ['light', 'dark'] as const;
/** Corrected tokens named inline; the rest are counted. */
const SHOWN = 4;
const ratio = (value: number) => value.toFixed(2);

/**
 * The live contrast report: how many gated pairs pass WCAG 2.2 AA in each mode, which tokens the
 * correction moved to get there, and any pair an override breaks. Icons and words carry the
 * status, colour only repeats it.
 */
export function ContrastStatus({ resolved }: { resolved: ResolvedTheme }) {
  const counts = MODES.map((mode) => ({ mode, ...passCount(resolved[mode]) }));
  const fails = MODES.flatMap((mode) => resolved[mode].fails.map((f) => ({ mode, ...f })));
  const corrections = MODES.flatMap((mode) =>
    resolved[mode].corrections.map((c) => ({ mode, ...c })),
  );
  const notes = MODES.flatMap((mode) => resolved[mode].notes.map((note) => ({ mode, note })));
  const ok = fails.length === 0;

  return (
    <section aria-labelledby="generator-contrast" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <h3 id="generator-contrast" className="sr-only">
          Contrast
        </h3>
        <p
          aria-live="polite"
          className={cn(
            'flex items-center gap-2 text-sm font-medium',
            ok ? 'text-positive-strong' : 'text-warning-strong',
          )}
        >
          {ok ? (
            <CheckCircleIcon aria-hidden weight="fill" className="size-4.5" />
          ) : (
            <WarningIcon aria-hidden weight="fill" className="size-4.5" />
          )}
          {ok
            ? 'Every gated pair passes WCAG AA'
            : `${String(fails.length)} ${fails.length === 1 ? 'pair fails' : 'pairs fail'} AA`}
        </p>
        <dl className="flex gap-4 text-sm text-fg-muted">
          {counts.map(({ mode, pass, total }) => (
            <div key={mode} className="flex gap-1.5">
              <dt className="capitalize">{mode}</dt>
              <dd className="font-medium text-fg numeric">
                {pass}/{total}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      {!ok && (
        <ul className="flex flex-col gap-1.5 rounded-control border border-warning bg-warning-subtle p-3 text-sm text-fg">
          {fails.map((f) => (
            <li key={`${f.mode}-${f.fg}-${f.bg}`} className="flex flex-wrap gap-x-2">
              <span className="font-mono text-xs leading-5">
                {f.fg} on {f.bg}
              </span>
              <span className="text-fg-muted numeric">
                {f.mode}, {ratio(f.ratio)}:1, needs {f.min}:1
              </span>
            </li>
          ))}
          <li className="pt-1 text-fg-muted">
            Only overrides can fail: the guided colours are always corrected. The theme still
            exports.
          </li>
        </ul>
      )}

      <p className="max-w-prose text-sm text-fg-muted">
        A gated pair is a colour the kit draws on another: text needs 4.5:1, controls and marks 3:1.
      </p>

      {notes.map(({ mode, note }) => (
        <p key={`${mode}-${note}`} className="flex items-start gap-2 text-sm text-fg">
          <InfoIcon aria-hidden weight="bold" className="mt-0.5 size-3.5 shrink-0 text-fg-subtle" />
          <span>
            <span className="font-medium capitalize">{mode}:</span> {note}
          </span>
        </p>
      ))}

      {corrections.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="flex flex-wrap items-center gap-1.5 text-sm text-fg">
            <WrenchIcon aria-hidden weight="bold" className="size-3.5 text-fg-subtle" />
            <span>
              {corrections.length} {corrections.length === 1 ? 'colour' : 'colours'} corrected:
            </span>
            {corrections.slice(0, SHOWN).map((c) => (
              <code
                key={`${c.mode}-${c.token}`}
                className="rounded-badge border border-line bg-surface-sunken px-1.5 font-mono text-xs text-fg"
              >
                {c.token}
                <span className="text-fg-subtle">, {c.mode}</span>
              </code>
            ))}
            {corrections.length > SHOWN && (
              <span className="text-fg-muted">and {corrections.length - SHOWN} more</span>
            )}
          </p>
          <Collapsible>
            <CollapsibleTrigger className="text-sm">What moved, and why</CollapsibleTrigger>
            <CollapsiblePanel>
              <div className="flex flex-col gap-3 pt-2">
                {MODES.map((mode) => (
                  <CorrectionList key={mode} mode={mode} result={resolved[mode]} />
                ))}
              </div>
            </CollapsiblePanel>
          </Collapsible>
        </div>
      )}
    </section>
  );
}

function CorrectionList({ mode, result }: { mode: string; result: ModeResult }) {
  if (result.corrections.length === 0) return null;
  return (
    <div className="flex flex-col gap-1">
      <h4 className="text-xs font-medium tracking-caps text-fg-subtle uppercase">{mode}</h4>
      <table className="w-full text-sm">
        <caption className="sr-only">
          Tokens the correction moved in {mode} mode, with their lightness before and after
        </caption>
        <thead className="sr-only">
          <tr>
            <th scope="col">Token</th>
            <th scope="col">Lightness</th>
            <th scope="col">For the pair</th>
          </tr>
        </thead>
        <tbody>
          {result.corrections.map((c) => (
            <tr key={c.token} className="border-t border-line first:border-t-0">
              <td className="py-1 pe-2 font-mono text-xs text-fg">{c.token}</td>
              <td className="py-1 pe-2 whitespace-nowrap text-fg-muted numeric">
                {percent(c.from)} to {percent(c.to)}
              </td>
              <td className="hidden py-1 text-xs text-fg-subtle sm:table-cell">{c.because}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
