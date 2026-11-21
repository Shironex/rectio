'use client';

import { useEffect, useRef, useState } from 'react';

/** The URL parameter that carries the previewed skin, beside the theme code. */
export const SKIN_PARAM = 'skin';

/**
 * The skin the generator previews, kept apart from the theme: a skin sets type, corners and rhythm
 * on top of any theme, so it never enters the theme code. The URL carries it as `?skin=<id>`
 * (replaced, like the theme), and a shared link opens with it. Unknown ids read as no skin.
 */
export function useSkin(ids: readonly string[]) {
  const [skin, setSkin] = useState<string | undefined>(undefined);
  const ready = useRef(false);

  // Read the link once, after hydration: the static HTML shows the theme with no skin.
  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get(SKIN_PARAM);
    if (fromUrl !== null && ids.includes(fromUrl)) setSkin(fromUrl);
    ready.current = true;
  }, [ids]);

  useEffect(() => {
    if (!ready.current) return;
    const url = new URL(window.location.href);
    if (skin === undefined) url.searchParams.delete(SKIN_PARAM);
    else url.searchParams.set(SKIN_PARAM, skin);
    window.history.replaceState(window.history.state, '', url);
  }, [skin]);

  return [skin, setSkin] as const;
}
