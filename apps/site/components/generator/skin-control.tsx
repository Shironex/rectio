'use client';

import { Segmented } from '@/components/segmented';
import type { SkinTemplate } from '@/lib/generator-template';

import { ControlGroup } from './controls';

const NONE = 'none';

/**
 * The skin the preview and the output show the theme with. A skin is not part of the theme: it
 * restyles type, corners and rhythm on top of it, so the choice stays out of the theme code.
 */
export function SkinControl({
  skins,
  skin,
  onChange,
}: {
  skins: readonly Pick<SkinTemplate, 'id' | 'title'>[];
  skin: string | undefined;
  onChange: (skin: string | undefined) => void;
}) {
  const options = [
    { value: NONE, label: 'Default' },
    ...skins.map((s) => ({ value: s.id, label: s.id.charAt(0).toUpperCase() + s.id.slice(1) })),
  ];
  return (
    <ControlGroup title="Skin">
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-fg">Preview with a skin</span>
        <Segmented
          label="Skin"
          value={skin ?? NONE}
          touch
          className="grid w-full grid-cols-3 [&>*]:justify-center [&>*]:px-1"
          options={options}
          onChange={(value) => {
            onChange(value === NONE ? undefined : value);
          }}
        />
        <p className="text-sm text-fg-muted">
          Dense tightens type and controls for data-heavy apps; editorial sets serif headings and
          hairlines. A skin changes no colour, so every contrast check above still holds. It
          installs as its own item, beside the theme. Compact density is separate and still applies
          inside a skin.
        </p>
      </div>
    </ControlGroup>
  );
}
