'use client';

import { ArrowCounterClockwiseIcon, CheckIcon, WarningIcon } from '@phosphor-icons/react';
import { Badge, Button, SearchInput, cn } from '@rectio/ui';
import {
  colorRoles,
  formatOklch,
  pairsOf,
  type ResolvedTheme,
  type ThemeInputs,
} from '@rectio/tokens/generator';
import { useMemo, useState } from 'react';

import { Segmented } from '@/components/segmented';

import { ColorField } from './color-field';
import { swatch } from './model';

type Mode = 'light' | 'dark';
type Update = (change: (draft: ThemeInputs) => void) => void;

const ROLES = colorRoles().map((role) => role.slice('--rx-'.length));

const GROUPS: { label: string; test: (name: string) => boolean }[] = [
  { label: 'Surfaces', test: (n) => n.startsWith('surface') || n === 'scrim' },
  { label: 'Text and lines', test: (n) => /^(text|border|focus)/.test(n) },
  { label: 'Accent', test: (n) => n.startsWith('accent') },
  { label: 'Status', test: (n) => /^(positive|negative|warning|info)/.test(n) },
  { label: 'Charts', test: (n) => n.startsWith('chart') },
  { label: 'Identity', test: (n) => n.startsWith('identity') },
  { label: 'Code', test: (n) => n.startsWith('code') },
];

const MODES = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
] as const;

/**
 * Overrides for single tokens, per mode. An override is never corrected: it is checked against
 * every gated pair it takes part in, and a failing pair is shown with its ratio, but kept.
 */
export function AdvancedOverrides({
  inputs,
  resolved,
  update,
}: {
  inputs: ThemeInputs;
  resolved: ResolvedTheme;
  update: Update;
}) {
  const [mode, setMode] = useState<Mode>('light');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState('accent');
  const result = resolved[mode];
  const overrides = inputs.overrides[mode];
  const count =
    Object.keys(inputs.overrides.light).length + Object.keys(inputs.overrides.dark).length;
  const failing = useMemo(() => new Set(result.fails.flatMap((f) => [f.fg, f.bg])), [result.fails]);
  const shown = ROLES.filter((name) => name.includes(query.trim().toLowerCase()));

  const setOverride = (name: string, value: string | undefined) => {
    update((draft) => {
      const rest = Object.entries(draft.overrides[mode]).filter(([key]) => key !== name);
      draft.overrides[mode] = Object.fromEntries(
        value === undefined ? rest : [...rest, [name, value]],
      );
    });
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <Segmented label="Mode to edit" value={mode} options={MODES} onChange={setMode} touch />
        <SearchInput
          aria-label="Find a token"
          placeholder="Find a token"
          value={query}
          onValueChange={setQuery}
          groupClassName="w-full sm:w-64"
        />
        {count > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="sm:ms-auto"
            onClick={() => {
              update((draft) => {
                draft.overrides = { light: {}, dark: {} };
              });
            }}
          >
            <ArrowCounterClockwiseIcon aria-hidden weight="bold" className="size-3.5" />
            Clear {count} {count === 1 ? 'override' : 'overrides'}
          </Button>
        )}
      </div>

      <div className="flex flex-col overflow-hidden rounded-panel border border-line lg:flex-row-reverse">
        <TokenEditor
          key={`${mode}-${selected}`}
          name={selected}
          mode={mode}
          resolved={resolved}
          override={overrides[selected]}
          onChange={(value) => {
            setOverride(selected, value);
          }}
        />
        <div className="flex max-h-120 min-w-0 flex-1 flex-col gap-4 overflow-y-auto border-t border-line p-3 lg:border-t-0">
          {shown.length === 0 && (
            <p className="text-sm text-fg-muted">No colour token matches {query}.</p>
          )}
          {GROUPS.map((group) => {
            const names = shown.filter(group.test);
            if (names.length === 0) return null;
            return (
              <div
                key={group.label}
                role="group"
                aria-label={group.label}
                className="flex flex-col gap-1"
              >
                <h4 className="px-1 text-xs font-medium tracking-caps text-fg-subtle uppercase">
                  {group.label}
                </h4>
                <ul className="grid gap-0.5 sm:grid-cols-2 xl:grid-cols-3">
                  {names.map((name) => {
                    const edited = overrides[name] !== undefined;
                    const fails = failing.has(name);
                    return (
                      <li key={name}>
                        <button
                          type="button"
                          aria-pressed={selected === name}
                          onClick={() => {
                            setSelected(name);
                          }}
                          className={cn(
                            'flex min-h-9 w-full cursor-pointer items-center gap-2 rounded-control px-1.5 text-start text-sm',
                            'outline-offset-1 focus-visible:outline-2 focus-visible:outline-focus',
                            selected === name
                              ? 'bg-accent-subtle text-fg ring-1 ring-accent ring-inset'
                              : 'text-fg-muted pointer-fine:hover:bg-surface-hover pointer-fine:hover:text-fg',
                          )}
                        >
                          <span
                            aria-hidden
                            className="h-5 w-8 shrink-0 rounded-badge border border-line-strong bg-(--rx-swatch)"
                            style={swatch(result.tokens[`--rx-${name}`])}
                          />
                          <span className="min-w-0 flex-1 truncate font-mono text-xs">{name}</span>
                          {edited && <Badge>Edited</Badge>}
                          {fails && (
                            <WarningIcon
                              aria-label="Fails a contrast pair"
                              weight="fill"
                              className="size-3.5 shrink-0 text-warning-strong"
                            />
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function TokenEditor({
  name,
  mode,
  resolved,
  override,
  onChange,
}: {
  name: string;
  mode: Mode;
  resolved: ResolvedTheme;
  override: string | undefined;
  onChange: (value: string | undefined) => void;
}) {
  const result = resolved[mode];
  const value = result.tokens[`--rx-${name}`] ?? '';
  const pairs = pairsOf(result, name).sort((a, b) => a.ratio / a.min - b.ratio / b.min);
  const failing = pairs.filter((p) => !p.pass).length;
  return (
    <div className="flex w-full flex-col gap-4 bg-surface p-4 lg:w-80 lg:shrink-0 lg:border-s lg:border-line">
      <ColorField
        label={`${name}, ${mode}`}
        value={override ?? value}
        description={
          override === undefined
            ? 'Derived and corrected. Type a value to override it.'
            : 'Overridden: kept as typed, never corrected.'
        }
        action={
          override !== undefined && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onChange(undefined);
              }}
            >
              <ArrowCounterClockwiseIcon aria-hidden weight="bold" className="size-3.5" />
              Reset
            </Button>
          )
        }
        onCommit={(color) => {
          onChange(formatOklch(color));
        }}
      />
      <div className="flex flex-col gap-2">
        <h4 className="text-sm font-medium text-fg">
          {pairs.length === 0
            ? 'Not in a gated pair'
            : failing === 0
              ? `Passes all ${String(pairs.length)} pairs it is in`
              : `Fails ${String(failing)} of ${String(pairs.length)} pairs`}
        </h4>
        {pairs.length > 0 && (
          <ul
            aria-label={`Pairs ${name} is in`}
            tabIndex={0}
            className="flex max-h-56 flex-col overflow-y-auto rounded-control text-sm outline-offset-2 focus-visible:outline-2 focus-visible:outline-focus"
          >
            {pairs.map((p) => {
              const other = p.fg === name ? p.bg : p.fg;
              return (
                <li
                  key={`${p.fg}-${p.bg}`}
                  className="flex items-center gap-2 border-t border-line py-1.5 first:border-t-0"
                >
                  {p.pass ? (
                    <CheckIcon
                      aria-label="Passes"
                      weight="bold"
                      className="size-3.5 shrink-0 text-positive-strong"
                    />
                  ) : (
                    <WarningIcon
                      aria-label="Fails"
                      weight="fill"
                      className="size-3.5 shrink-0 text-warning-strong"
                    />
                  )}
                  <span className="min-w-0 flex-1 truncate font-mono text-xs text-fg">
                    {p.fg === name ? `on ${other}` : `${other} on it`}
                  </span>
                  <span className={cn('numeric', p.pass ? 'text-fg-muted' : 'font-medium text-fg')}>
                    {p.ratio.toFixed(2)}:1
                  </span>
                  <span className="w-12 text-end text-xs text-fg-subtle numeric">min {p.min}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
