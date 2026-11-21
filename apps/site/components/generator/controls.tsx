'use client';

import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
  Field,
  FieldDescription,
  FieldLabel,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  Slider,
  Switch,
  cn,
} from '@rectio/ui';
import {
  DEFAULT_STEPS,
  FONTS,
  RADII,
  RANGES,
  cuspLightness,
  slugName,
  type FontRole,
  type ResolvedTheme,
  type ThemeInputs,
} from '@rectio/tokens/generator';
import { useState, type ReactNode } from 'react';

import { Segmented } from '@/components/segmented';

import { ColorField } from './color-field';
import {
  brandHex,
  clamp,
  layerScale,
  moveBorder,
  neutralFor,
  percent,
  stepsFor,
  temperatureLabel,
  temperatureOf,
} from './model';

type Update = (change: (draft: ThemeInputs) => void) => void;

/** A group of controls under a small caps heading; groups are split by space and a rule. */
export function ControlGroup({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      aria-label={title}
      className={cn('flex flex-col gap-5 border-t border-line pt-6', className)}
    >
      <h3 className="text-xs font-medium tracking-caps text-fg-subtle uppercase">{title}</h3>
      {children}
    </section>
  );
}

/** Colour changes leave the shipped light behind: the theme is derived from here on. */
const colour = (update: Update, change: (color: ThemeInputs['color']) => void) => {
  update((draft) => {
    draft.base = 'derived';
    change(draft.color);
  });
};

export function ColourControls({
  inputs,
  resolved,
  update,
}: {
  inputs: ThemeInputs;
  resolved: ResolvedTheme;
  update: Update;
}) {
  const temperature = temperatureOf(inputs.color.neutral);
  return (
    <ControlGroup title="Colour">
      <ColorField
        label="Brand colour"
        value={brandHex(inputs, resolved.light.tokens)}
        description="Sets the accent hue and strength. Lightness is set per mode so text on it passes AA."
        onCommit={(color) => {
          colour(update, (c) => {
            c.brand = {
              hue: Number(color.h.toFixed(1)),
              chroma: Number(clamp(color.c, RANGES.brandChroma).toFixed(4)),
            };
          });
        }}
      />
      <Field>
        <Slider
          label="Neutral temperature"
          showValue
          min={-100}
          max={100}
          step={5}
          largeStep={25}
          value={temperature}
          formatValue={() => temperatureLabel(temperature)}
          onValueChange={(value) => {
            colour(update, (c) => {
              c.neutral = neutralFor(value as number, c.neutral);
            });
          }}
        />
        <div aria-hidden className="flex justify-between text-xs text-fg-subtle">
          <span>Warm</span>
          <span>Grey</span>
          <span>Cool</span>
        </div>
        <FieldDescription>
          <span className="sr-only">{temperatureLabel(temperature)}. </span>Tints every surface,
          border and text colour.
        </FieldDescription>
      </Field>
      <Field>
        <Slider
          label="Dark surface depth"
          showValue
          min={RANGES.depth[0]}
          max={RANGES.depth[1]}
          step={0.005}
          largeStep={0.02}
          value={inputs.color.depth}
          formatValue={() => depthLabel(inputs.color.depth)}
          format={{ style: 'percent', maximumFractionDigits: 1 }}
          onValueChange={(value) => {
            colour(update, (c) => {
              const depth = value as number;
              moveBorder(c, depth - c.depth);
              c.depth = depth;
            });
          }}
        />
        <div aria-hidden className="flex justify-between text-xs text-fg-subtle">
          <span>Near black</span>
          <span>Charcoal</span>
        </div>
        <FieldDescription>
          The lightness of the dark canvas, the base of every dark layer.
        </FieldDescription>
      </Field>
    </ControlGroup>
  );
}

function depthLabel(depth: number) {
  return `${percent(depth)} lightness`;
}

const DENSITY = [
  { value: 'comfortable', label: 'Comfortable' },
  { value: 'compact', label: 'Compact' },
] as const;

const ROLE_LABELS: Record<FontRole, { label: string; hint: string }> = {
  sans: { label: 'Text', hint: 'Body copy, labels and controls' },
  display: { label: 'Headings', hint: 'Titles and large figures' },
  mono: { label: 'Code', hint: 'Code and identifiers' },
  numeric: { label: 'Figures', hint: 'Amounts and tables, with tabular figures' },
};

export function ShapeControls({ inputs, update }: { inputs: ThemeInputs; update: Update }) {
  return (
    <ControlGroup title="Shape and type">
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-fg">Corner radius</span>
        <Segmented
          label="Corner radius"
          value={inputs.radius}
          touch
          className="grid w-full grid-cols-5 [&>*]:justify-center [&>*]:px-1"
          options={RADII.map((r) => ({ value: r.id, label: r.label }))}
          onChange={(value) => {
            update((draft) => {
              draft.radius = value;
            });
          }}
        />
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-fg">Density</span>
        <Segmented
          label="Density"
          value={inputs.density}
          touch
          options={DENSITY}
          onChange={(value) => {
            update((draft) => {
              draft.density = value;
            });
          }}
        />
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-4">
        {(Object.keys(ROLE_LABELS) as FontRole[]).map((role) => (
          <FontSelect key={role} role={role} inputs={inputs} update={update} />
        ))}
      </div>
    </ControlGroup>
  );
}

function FontSelect({
  role,
  inputs,
  update,
}: {
  role: FontRole;
  inputs: ThemeInputs;
  update: Update;
}) {
  const items = FONTS.filter((f) => f.roles.includes(role)).map((f) => ({
    value: f.id,
    label: f.label,
  }));
  return (
    <Field>
      <FieldLabel>{ROLE_LABELS[role].label}</FieldLabel>
      <Select
        items={items}
        value={inputs.fonts[role]}
        onValueChange={(value) => {
          if (value === null) return;
          update((draft) => {
            draft.fonts[role] = value;
          });
        }}
      >
        <SelectTrigger aria-label={`${ROLE_LABELS[role].label} font`} />
        <SelectContent>
          {items.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <FieldDescription className="sr-only">{ROLE_LABELS[role].hint}</FieldDescription>
    </Field>
  );
}

const LIGHT_SOLIDS = [
  { value: 'light', label: 'Brand fill' },
  { value: 'ink', label: 'Ink fill' },
] as const;
const DARK_SOLIDS = [
  { value: 'light', label: 'White text' },
  { value: 'dark', label: 'Dark text' },
] as const;

/** The finer derivation inputs, folded away: each has a sound default. */
export function FineTuning({ inputs, update }: { inputs: ThemeInputs; update: Update }) {
  const { color } = inputs;
  const scale = layerScale(color.steps);
  const autoAccent = color.accentL === undefined;
  return (
    <Collapsible className="border-t border-line pt-1">
      <CollapsibleTrigger className="min-h-11 w-full text-sm">Fine tuning</CollapsibleTrigger>
      <CollapsiblePanel>
        <div className="flex flex-col gap-5 pt-3 pb-1">
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-fg">Light accent style</span>
            <Segmented
              label="Light accent style"
              value={color.solids.light}
              touch
              options={LIGHT_SOLIDS}
              onChange={(value) => {
                colour(update, (c) => {
                  c.solids.light = value;
                });
              }}
            />
            <p className="text-sm text-fg-muted">
              {color.solids.light === 'ink'
                ? 'Primary buttons are ink with brand text, a ledger look.'
                : 'Primary buttons are the brand colour with white text.'}
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-fg">Dark accent text</span>
            <Segmented
              label="Dark accent text"
              value={color.solids.dark}
              touch
              options={DARK_SOLIDS}
              onChange={(value) => {
                colour(update, (c) => {
                  c.solids.dark = value;
                  delete c.accentL;
                });
              }}
            />
          </div>
          <Field>
            <div className="flex items-center justify-between gap-3">
              <FieldLabel>Dark accent lightness</FieldLabel>
              <label className="flex items-center gap-2 text-sm text-fg-muted">
                Auto
                <Switch
                  checked={autoAccent}
                  onCheckedChange={(auto) => {
                    colour(update, (c) => {
                      if (auto) delete c.accentL;
                      else
                        c.accentL =
                          c.solids.dark === 'dark'
                            ? Number(cuspLightness(c.brand.hue).toFixed(3))
                            : 0.56;
                    });
                  }}
                />
              </label>
            </div>
            <Slider
              aria-label="Dark accent lightness"
              disabled={autoAccent}
              showValue
              min={RANGES.accentL[0]}
              max={RANGES.accentL[1]}
              step={0.01}
              value={color.accentL ?? 0.56}
              format={{ style: 'percent' }}
              onValueChange={(value) => {
                colour(update, (c) => {
                  c.accentL = value as number;
                });
              }}
            />
          </Field>
          <Field>
            <Slider
              label="Dark layer contrast"
              showValue
              min={0.5}
              max={1.8}
              step={0.05}
              value={scale}
              format={{ style: 'percent' }}
              onValueChange={(value) => {
                colour(update, (c) => {
                  const steps = stepsFor(value as number);
                  moveBorder(c, steps[3] - (c.steps ?? DEFAULT_STEPS)[3]);
                  c.steps = steps;
                });
              }}
            />
            <FieldDescription>
              How far raised and overlay surfaces step above the canvas.
            </FieldDescription>
          </Field>
          <Field>
            <Slider
              label="Dark text lightness"
              showValue
              min={RANGES.text[0]}
              max={RANGES.text[1]}
              step={0.005}
              value={color.text ?? 0.93}
              format={{ style: 'percent', maximumFractionDigits: 1 }}
              onValueChange={(value) => {
                colour(update, (c) => {
                  c.text = value as number;
                });
              }}
            />
          </Field>
          <Field>
            <Slider
              label="Selected row tint"
              showValue
              min={RANGES.selectedChroma[0]}
              max={RANGES.selectedChroma[1]}
              step={0.005}
              value={color.selectedChroma ?? 0.035}
              format={{ maximumFractionDigits: 3 }}
              onValueChange={(value) => {
                colour(update, (c) => {
                  c.selectedChroma = value as number;
                });
              }}
            />
          </Field>
          <Field>
            <Slider
              label="Neutral hue"
              showValue
              min={0}
              max={359}
              step={1}
              largeStep={15}
              value={Math.round(color.neutral.hue)}
              formatValue={(formatted) => `${formatted[0] ?? ''}°`}
              onValueChange={(value) => {
                colour(update, (c) => {
                  c.neutral = { ...c.neutral, hue: value as number };
                });
              }}
            />
            <FieldDescription>
              The exact tint the temperature slider picks a side for.
            </FieldDescription>
          </Field>
        </div>
      </CollapsiblePanel>
    </Collapsible>
  );
}

/** The theme's id: the data-theme value, the registry item and the file name. */
export function NameField({ inputs, update }: { inputs: ThemeInputs; update: Update }) {
  const [text, setText] = useState<string | null>(null);
  const shown = text ?? inputs.name;
  const slug = slugName(shown);
  const reserved = slug === 'default';
  return (
    <Field invalid={reserved}>
      <FieldLabel>Theme name</FieldLabel>
      <Input
        value={shown}
        spellCheck={false}
        autoComplete="off"
        onValueChange={(next) => {
          setText(next);
          const id = slugName(next);
          if (id !== 'default')
            update((draft) => {
              draft.name = id;
            });
        }}
        onBlur={() => {
          setText(null);
        }}
      />
      {reserved ? (
        <p role="alert" className="text-sm text-negative-strong">
          The shipped theme is called default. Pick another name.
        </p>
      ) : (
        <FieldDescription>
          Installs as <code className="font-mono text-fg">theme-{slug}</code> and sets{' '}
          <code className="font-mono text-fg">data-theme=&quot;{slug}&quot;</code>.
        </FieldDescription>
      )}
    </Field>
  );
}
