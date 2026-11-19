import { HexagonIcon } from '@phosphor-icons/react';

/** The sample product's mark: an icon from the kit's icon set and the name in the display face. */
export function Brand() {
  return (
    <span className="flex items-center gap-2 font-display text-lg font-heading tracking-tight">
      <HexagonIcon aria-hidden weight="duotone" className="size-6 text-accent" />
      Fernhill
    </span>
  );
}
