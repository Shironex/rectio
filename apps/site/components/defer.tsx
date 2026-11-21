'use client';

import {
  createElement,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ComponentType,
} from 'react';

/**
 * When a deferred part takes its code: `visible` as it nears the screen (or is pointed at or
 * focused first), `never` for a picture of the kit that has nothing to do on the client.
 */
export type DeferWhen = 'visible' | 'never';

/** Hydrating this keeps the server's markup as it is: React does not look inside it. */
const KEEP = { __html: '' };

const noSubscribe = () => () => undefined;

/** Where `node` sits under `root`, as child indexes, to find its twin once the part is live. */
function pathTo(root: Element, node: Element): number[] | undefined {
  const path: number[] = [];
  for (let at: Element = node; at !== root;) {
    const parent = at.parentElement;
    if (parent === null) return undefined;
    path.unshift(Array.prototype.indexOf.call(parent.children, at));
    at = parent;
  }
  return path;
}

function follow(root: Element, path: readonly number[]): HTMLElement | undefined {
  let at: Element | undefined = root;
  for (const index of path) at = at?.children[index];
  return at instanceof HTMLElement ? at : undefined;
}

/**
 * Wraps a client part so the server renders it in full (the HTML has it, readable without
 * JavaScript, with no Suspense boundary that a script would have to reveal), while its JavaScript
 * loads only when `when` says so. Until then the client keeps the server's markup untouched, not
 * hydrated; then the part mounts live in its place. A press on a control in between is held and
 * replayed on the live part, and focus moves across with it; links work as plain HTML throughout.
 *
 * `onServer` is the part itself, taken synchronously on the server only (see parts.tsx). The
 * part's module must be imported nowhere else on the page, or its code ships with the page anyway.
 */
export function deferred<P extends object>(
  load: () => Promise<ComponentType<P>>,
  onServer: ComponentType<P> | undefined,
  when: DeferWhen = 'visible',
) {
  function Deferred({ className, ...props }: P & { className?: string }) {
    const ref = useRef<HTMLDivElement>(null);
    // True while hydrating server HTML, false when the client renders the part with no HTML to keep
    // (a navigation inside the site): then the part loads at once.
    const hydrating = useSyncExternalStore(
      noSubscribe,
      () => false,
      () => true,
    );
    const [fresh] = useState(() => !hydrating);
    const [Live, setLive] = useState<ComponentType<P> | null>(null);
    const held = useRef<{ press?: number[] | undefined; focus?: number[] | undefined }>({});

    useEffect(() => {
      const element = ref.current;
      if (element === null || Live !== null || (when === 'never' && !fresh)) return;
      let started = false;
      let gone = false;
      const open = () => {
        if (started) return;
        started = true;
        stopWatching();
        void load().then((Part) => {
          if (gone) return;
          const kept = element.firstElementChild;
          const focused = document.activeElement;
          if (kept !== null && focused !== null && kept.contains(focused)) {
            held.current.focus = pathTo(kept, focused);
          }
          setLive(() => Part);
        });
      };
      const hold = (event: MouseEvent) => {
        const kept = element.firstElementChild;
        if (!(event.target instanceof Element) || kept === null) return;
        if (event.target.closest('a[href]') !== null) return;
        event.preventDefault();
        held.current.press = pathTo(kept, event.target);
        open();
      };
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry?.isIntersecting === true) open();
        },
        { rootMargin: '25% 0px' },
      );
      function stopWatching() {
        observer.disconnect();
        element?.removeEventListener('pointerover', open);
        element?.removeEventListener('focusin', open);
      }
      element.addEventListener('click', hold, true);
      if (fresh) {
        open();
      } else {
        observer.observe(element);
        element.addEventListener('pointerover', open);
        element.addEventListener('focusin', open);
      }
      return () => {
        gone = true;
        stopWatching();
        element.removeEventListener('click', hold, true);
      };
    }, [Live, fresh]);

    // Once live, give back what happened while the code was on its way.
    useLayoutEffect(() => {
      const live = ref.current?.firstElementChild;
      if (Live === null || live === null || live === undefined) return;
      const { press, focus } = held.current;
      held.current = {};
      if (focus !== undefined) follow(live, focus)?.focus({ preventScroll: true });
      if (press !== undefined) follow(live, press)?.click();
    }, [Live]);

    let inner;
    if (Live !== null) {
      inner = (
        <div key="live" className="contents">
          {createElement(Live, props as P)}
        </div>
      );
    } else if (onServer !== undefined) {
      inner = (
        <div key="kept" className="contents">
          {createElement(onServer, props as P)}
        </div>
      );
    } else {
      inner = fresh ? (
        <div key="kept" className="contents" />
      ) : (
        <div
          key="kept"
          className="contents"
          suppressHydrationWarning
          dangerouslySetInnerHTML={KEEP}
        />
      );
    }
    return (
      <div ref={ref} className={className}>
        {inner}
      </div>
    );
  }
  return Deferred;
}
