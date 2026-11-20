'use client';

import { Skeleton, cn } from '@rectio/ui';
import { useEffect, useRef, useState } from 'react';

import type { Mode, ThemeId } from '@/lib/site';
import { fitScale } from '@/lib/viewer';

export interface Look {
  theme: ThemeId;
  mode: Mode;
}

/** After this long without a page, the veil offers the preview in a tab of its own. */
const SLOW_MS = 8000;

/** How often the viewer checks where the template has routed to on the client. */
const FOLLOW_MS = 250;

/**
 * Every template keeps its look on <html> as `data-theme` and `data-mode`, and follows changes to
 * them. The preview is served from the site's own origin, so the viewer sets the same attributes
 * the template's own switch would: tokens only, nothing in the template changes.
 */
function applyLook(doc: Document, look: Look) {
  const root = doc.documentElement;
  if (root.dataset.theme !== look.theme) root.dataset.theme = look.theme;
  if (root.dataset.mode !== look.mode) root.dataset.mode = look.mode;
}

function readLook(win: Window): Look {
  const { theme, mode } = win.document.documentElement.dataset;
  const dark =
    mode === undefined ? win.matchMedia('(prefers-color-scheme: dark)').matches : mode === 'dark';
  return { theme: theme === 'ledger' ? 'ledger' : 'default', mode: dark ? 'dark' : 'light' };
}

/** The frame's document, or null when it is not on the site's origin (nothing to drive then). */
function documentOf(frame: HTMLIFrameElement | null): Document | null {
  try {
    return frame?.contentDocument ?? null;
  } catch {
    return null;
  }
}

/**
 * A template running in an iframe at a device's real width, scaled down to fit the stage when the
 * stage is narrower, and as tall as the stage. Reports where the template navigates and a look the
 * visitor picks inside it, so the viewer's controls stay true.
 */
export function PreviewFrame({
  src,
  fullScreen,
  width,
  stage,
  look,
  title,
  onNavigate,
  onLookChange,
}: {
  src: string;
  /** The page on show as a URL of its own, offered when the frame is slow to load. */
  fullScreen: string;
  /** The device width the template lays out at, in CSS pixels. */
  width: number;
  /** The room the frame has. */
  stage: { width: number; height: number };
  look: Look;
  title: string;
  /** The frame's pathname and title after every navigation, full loads and client routing alike. */
  onNavigate: (pathname: string, title: string) => void;
  onLookChange: (look: Look) => void;
}) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  // The source whose page has loaded: a new source is a full load, veiled until its look is set.
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const [doc, setDoc] = useState<Document | null>(null);
  const loaded = loadedSrc === src;
  const [slowSrc, setSlowSrc] = useState<string | null>(null);
  useEffect(() => {
    if (loaded) return;
    const timer = setTimeout(() => {
      setSlowSrc(src);
    }, SLOW_MS);
    return () => {
      clearTimeout(timer);
    };
  }, [loaded, src]);
  const latest = useRef({ look, onNavigate, onLookChange });
  useEffect(() => {
    latest.current = { look, onNavigate, onLookChange };
  });

  useEffect(() => {
    if (loaded && doc !== null) applyLook(doc, look);
  }, [look, loaded, doc]);

  // Follow the template: where it routes to, and a look picked with its own controls.
  useEffect(() => {
    const win = doc?.defaultView;
    if (doc === null || !win) return;
    let last = '';
    const follow = () => {
      const { pathname } = win.location;
      // The title lands a moment after the URL on client routing: follow both.
      const key = `${pathname}\n${doc.title}`;
      if (key === last) return;
      last = key;
      latest.current.onNavigate(pathname, doc.title);
    };
    follow();
    const timer = setInterval(follow, FOLLOW_MS);
    const observer = new MutationObserver(() => {
      const next = readLook(win);
      const current = latest.current.look;
      if (next.theme !== current.theme || next.mode !== current.mode) {
        latest.current.onLookChange(next);
      }
    });
    observer.observe(doc.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'data-mode'],
    });
    return () => {
      clearInterval(timer);
      observer.disconnect();
    };
  }, [doc]);

  const scale = fitScale(stage.width, width);
  if (stage.width <= 0) return null;

  return (
    <div
      className="relative overflow-hidden rounded-panel border border-line-strong bg-surface-canvas shadow-overlay"
      style={{ width: Math.min(width, stage.width), height: stage.height }}
    >
      <iframe
        ref={frameRef}
        src={src}
        title={title}
        onLoad={() => {
          const next = documentOf(frameRef.current);
          if (next !== null) applyLook(next, latest.current.look);
          setDoc(next);
          setLoadedSrc(src);
        }}
        className={cn(
          'absolute start-0 top-0 block origin-top-left border-0 bg-surface-canvas transition-opacity duration-fast ease-standard rtl:origin-top-right',
          'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus',
          loaded ? 'opacity-100' : 'opacity-0',
        )}
        style={{ width, height: stage.height / scale, scale: String(scale) }}
      />
      {!loaded && (
        <div
          role="status"
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center text-sm text-fg-muted"
        >
          {slowSrc === src ? (
            <>
              <p>The preview is taking longer than usual.</p>
              <a
                href={fullScreen}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center font-medium text-fg underline decoration-line-strong underline-offset-4 pointer-fine:hover:decoration-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
              >
                Open it in a new tab
              </a>
            </>
          ) : (
            <>
              <span className="sr-only">Loading the preview</span>
              <div aria-hidden className="flex w-full max-w-sm flex-col gap-3">
                <Skeleton className="block h-6 w-2/5" />
                <Skeleton className="block h-4 w-4/5" />
                <Skeleton className="block h-24 w-full" />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
