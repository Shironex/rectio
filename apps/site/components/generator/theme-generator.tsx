'use client';

import { InfoIcon, WarningIcon } from '@phosphor-icons/react';
import { Collapsible, CollapsiblePanel, CollapsibleTrigger } from '@rectio/ui';
import { useMemo, useState, useSyncExternalStore } from 'react';

import type { SkinTemplate } from '@/lib/generator-template';

import { AdvancedOverrides } from './advanced';
import { ContrastStatus } from './contrast-status';
import { ColourControls, FineTuning, NameField, ShapeControls } from './controls';
import { fresh, matchingPreset, presetById } from './model';
import { Output } from './output';
import { PresetPicker } from './presets';
import { Preview, type PreviewMode } from './preview';
import { SkinControl } from './skin-control';
import { useGenerator, type Origin } from './use-generator';
import { useSkin } from './use-skin';

const MODE_KEY = 'rectio-theme-generator-mode';

const noop = () => () => undefined;
function storedMode(): PreviewMode {
  try {
    const stored = localStorage.getItem(MODE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    // No storage: follow the site.
  }
  // Until a mode is picked here, the preview opens in the mode the site is in.
  return document.documentElement.dataset.mode === 'dark' ? 'dark' : 'light';
}

function OriginNotice({ origin }: { origin: Origin }) {
  if (origin.kind === 'broken')
    return (
      <p
        role="alert"
        className="flex items-start gap-2 rounded-control border border-warning bg-warning-subtle px-3 py-2 text-sm text-fg"
      >
        <WarningIcon
          aria-hidden
          weight="fill"
          className="mt-0.5 size-4 shrink-0 text-warning-strong"
        />
        This link&apos;s theme could not be read ({origin.reason}). The editor starts from Default.
      </p>
    );
  if (origin.kind === 'link')
    return (
      <p className="flex items-center gap-2 text-sm text-fg-muted">
        <InfoIcon aria-hidden weight="bold" className="size-4 shrink-0" />
        Opened from a shared link.
      </p>
    );
  return null;
}

/**
 * The theme generator: guided inputs on the left, the live preview on the right, the install
 * command and the CSS below. Every colour is derived in OKLCH and corrected until each gated pair
 * passes WCAG 2.2 AA; overrides in the advanced panel are the one way to break that, and they are
 * reported.
 */
export function ThemeGenerator({
  template,
  skins,
}: {
  template: string;
  /** The registry's skins, read at build time. */
  skins: readonly SkinTemplate[];
}) {
  const g = useGenerator(template);
  const { inputs, resolved, update } = g;
  const ids = useMemo(() => skins.map((s) => s.id), [skins]);
  const [skin, setSkin] = useSkin(ids);
  // The remembered preview mode, read after hydration; a choice made here wins over it.
  const remembered = useSyncExternalStore(noop, storedMode, () => 'light' as const);
  const [chosen, setChosen] = useState<PreviewMode | null>(null);
  const mode = chosen ?? remembered;

  const changeMode = (next: PreviewMode) => {
    setChosen(next);
    try {
      localStorage.setItem(MODE_KEY, next);
    } catch {
      // A convenience only.
    }
  };

  const matching = matchingPreset(inputs);
  // The preset last picked: once the inputs move away from it, its card says Edited.
  const [picked, setPicked] = useState<string>('default');
  const active = matching ?? picked;

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-4">
        <OriginNotice origin={g.origin} />
        <PresetPicker
          template={template}
          active={active}
          edited={matching === undefined}
          onPick={(next, id) => {
            if (presetById(id) === undefined) return;
            setPicked(id);
            g.setInputs((current) => ({
              ...fresh(next),
              name: current.name,
              overrides: current.overrides,
            }));
          }}
        />
      </div>

      {/* On a phone the preview follows the colour controls, so a colour change shows at once;
          from lg the controls form one column beside a sticky preview. */}
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        <div className="flex flex-col gap-6 max-lg:contents lg:w-80 lg:shrink-0">
          <div className="order-1 lg:order-none">
            <ColourControls inputs={inputs} resolved={resolved} update={update} />
          </div>
          <div className="order-3 flex flex-col gap-6 lg:order-none">
            <ShapeControls inputs={inputs} update={update} />
            <SkinControl skins={skins} skin={skin} onChange={setSkin} />
            <FineTuning inputs={inputs} update={update} />
            <div className="flex flex-col gap-5 border-t border-line pt-5">
              <NameField inputs={inputs} update={update} />
            </div>
          </div>
        </div>
        <div className="order-2 flex min-w-0 flex-1 flex-col gap-4 lg:sticky lg:top-20 lg:order-none">
          <ContrastStatus resolved={resolved} />
          <Preview
            css={g.previewCss}
            mode={mode}
            skin={skin}
            onModeChange={changeMode}
            stale={g.stale}
          />
        </div>
      </div>

      <Collapsible className="border-t border-line pt-4">
        <CollapsibleTrigger className="text-base">
          Advanced: override single tokens
        </CollapsibleTrigger>
        <CollapsiblePanel>
          <div className="flex flex-col gap-4 pt-4">
            <p className="max-w-prose text-sm text-fg-muted">
              Set any colour token by hand, per mode. Overrides skip the correction, so one can
              break AA: the pairs it is in are listed with their ratios, and a failing override
              stays in the theme with a warning.
            </p>
            <AdvancedOverrides inputs={inputs} resolved={resolved} update={update} />
          </div>
        </CollapsiblePanel>
      </Collapsible>

      <Output
        code={g.code}
        css={g.css}
        name={inputs.name}
        skin={skins.find((s) => s.id === skin)}
      />
    </div>
  );
}
