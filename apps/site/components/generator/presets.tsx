'use client';

import { CheckIcon } from '@phosphor-icons/react';
import { cn } from '@rectio/ui';
import {
  resolveTheme,
  templateColors,
  type ShippedColors,
  type ThemeInputs,
} from '@rectio/tokens/generator';
import { useMemo } from 'react';

import { PAIRS, PRESETS, swatch as swatchStyle } from './model';

const SWATCH_ROLES = ['--rx-surface-canvas', '--rx-accent', '--rx-text'] as const;

function swatches(shipped: ShippedColors) {
  return PRESETS.map((preset) => {
    const r = resolveTheme(preset.inputs, PAIRS, shipped);
    return {
      id: preset.id,
      light: SWATCH_ROLES.map((role) => r.light.tokens[role] ?? ''),
      dark: SWATCH_ROLES.map((role) => r.dark.tokens[role] ?? ''),
    };
  });
}

/**
 * The starting points, as a radio group: each one shows its light and dark canvas with the accent
 * and the text on them. Picking one replaces every guided input; overrides are kept.
 */
export function PresetPicker({
  template,
  active,
  edited,
  onPick,
}: {
  template: string;
  /** The preset the inputs still match, if any. */
  active: string | undefined;
  /** The inputs have moved away from the active preset. */
  edited: boolean;
  onPick: (inputs: ThemeInputs, id: string) => void;
}) {
  const colours = useMemo(() => swatches(templateColors(template)), [template]);
  return (
    <fieldset className="flex flex-col gap-2.5">
      <legend className="mb-2.5 text-xs font-medium tracking-caps text-fg-subtle uppercase">
        Start from
      </legend>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
        {PRESETS.map((preset) => {
          const swatch = colours.find((c) => c.id === preset.id);
          const checked = active === preset.id;
          return (
            <label
              key={preset.id}
              className={cn(
                'group relative flex cursor-pointer flex-col gap-2 rounded-control border p-2 transition-colors duration-fast ease-standard',
                'has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-focus',
                checked
                  ? 'border-accent bg-surface-raised ring-1 ring-accent ring-inset'
                  : 'border-line bg-surface pointer-fine:hover:border-line-strong',
              )}
            >
              <input
                type="radio"
                name="generator-preset"
                value={preset.id}
                checked={checked}
                onChange={() => {
                  onPick(preset.inputs, preset.id);
                }}
                className="sr-only"
              />
              <span
                aria-hidden
                className="flex h-9 overflow-hidden rounded-badge border border-line"
              >
                {swatch !== undefined &&
                  (['light', 'dark'] as const).map((mode) => (
                    <span
                      key={mode}
                      className="flex flex-1 items-center justify-center gap-1 bg-(--rx-swatch)"
                      style={swatchStyle(swatch[mode][0])}
                    >
                      <span
                        className="size-3 rounded-full bg-(--rx-swatch)"
                        style={swatchStyle(swatch[mode][1])}
                      />
                      <span
                        className="h-1 w-3 rounded-full bg-(--rx-swatch)"
                        style={swatchStyle(swatch[mode][2])}
                      />
                    </span>
                  ))}
              </span>
              <span className="flex items-center justify-between gap-1">
                <span className="text-sm font-medium text-fg">{preset.label}</span>
                {checked &&
                  (edited ? (
                    <span className="text-xs font-medium text-fg-muted">Edited</span>
                  ) : (
                    <CheckIcon aria-hidden weight="bold" className="size-3.5 text-accent-strong" />
                  ))}
              </span>
              <span className="text-xs leading-snug text-fg-muted">{preset.note}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
