'use client';

import {
  CODE_PARAM,
  ThemeCodeError,
  decodeTheme,
  encodeTheme,
  renderThemeCss,
  resolveTheme,
  templateColors,
  type ThemeInputs,
} from '@rectio/tokens/generator';
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';

import { DATA, DEFAULT_PRESET, PAIRS, PREVIEW_ID, STORAGE_KEY, fresh } from './model';

function readStored(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function store(code: string) {
  try {
    localStorage.setItem(STORAGE_KEY, code);
  } catch {
    // Private windows and blocked storage: the URL still holds the theme.
  }
}

/** Where the theme came from when the page opened, for the notice above the editor. */
export type Origin = { kind: 'default' | 'link' | 'stored' } | { kind: 'broken'; reason: string };

/**
 * The editor state. The theme inputs are the whole state; the URL carries them as `?theme=<code>`
 * (replaced, not pushed, so Back leaves the page), and the browser keeps a copy for the next
 * visit. Resolution (derive, correct, check) runs on a deferred copy, so a dragged slider stays
 * smooth while the preview catches up.
 */
export function useGenerator(template: string) {
  const [inputs, setInputs] = useState<ThemeInputs>(() => fresh(DEFAULT_PRESET.inputs));
  const [origin, setOrigin] = useState<Origin>({ kind: 'default' });
  const ready = useRef(false);

  // Read the link (or the stored theme) once, after hydration: the static HTML shows Default.
  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get(CODE_PARAM);
    const candidate = fromUrl ?? readStored();
    if (candidate !== null) {
      try {
        setInputs(decodeTheme(candidate));
        setOrigin({ kind: fromUrl === null ? 'stored' : 'link' });
      } catch (error) {
        if (fromUrl !== null)
          setOrigin({
            kind: 'broken',
            reason: error instanceof ThemeCodeError ? error.message : 'the code could not be read',
          });
      }
    }
    ready.current = true;
  }, []);

  const code = useMemo(() => encodeTheme(inputs), [inputs]);

  useEffect(() => {
    if (!ready.current) return;
    const id = window.setTimeout(() => {
      const url = new URL(window.location.href);
      url.searchParams.set(CODE_PARAM, code);
      window.history.replaceState(window.history.state, '', url);
      store(code);
    }, 250);
    return () => {
      window.clearTimeout(id);
    };
  }, [code]);

  const shipped = useMemo(() => templateColors(template), [template]);
  const deferred = useDeferredValue(inputs);
  const resolved = useMemo(() => resolveTheme(deferred, PAIRS, shipped), [deferred, shipped]);
  const previewCss = useMemo(
    () =>
      renderThemeCss(template, deferred, resolved, DATA.compact, { scoped: true, id: PREVIEW_ID }),
    [template, deferred, resolved],
  );
  const css = useMemo(
    () => renderThemeCss(template, deferred, resolved, DATA.compact),
    [template, deferred, resolved],
  );

  const update = useCallback((change: (draft: ThemeInputs) => void) => {
    setInputs((current) => {
      const next = fresh(current);
      change(next);
      return next;
    });
  }, []);

  return {
    inputs,
    setInputs,
    update,
    code,
    resolved,
    previewCss,
    css,
    origin,
    stale: deferred !== inputs,
  };
}

export type Generator = ReturnType<typeof useGenerator>;
