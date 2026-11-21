'use client';

import {
  Suspense,
  lazy,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentType,
  type LazyExoticComponent,
} from 'react';

/**
 * When a deferred part takes its code: `visible` as it nears the screen (or is pointed at or
 * focused first), `never` for a picture of the kit that has nothing to do on the client.
 */
export type DeferWhen = 'visible' | 'never';

interface Gate<P> {
  open: () => void;
  Part: LazyExoticComponent<ComponentType<P>>;
}

function makeGate<P>(load: () => Promise<ComponentType<P>>): Gate<P> {
  // The server renders the part straight away, so the exported HTML has it in full.
  if (typeof window === 'undefined') {
    return { open: () => undefined, Part: lazy(() => load().then((Part) => ({ default: Part }))) };
  }
  let open: () => void = () => undefined;
  const ready = new Promise<undefined>((resolve) => {
    open = () => {
      resolve(undefined);
    };
  });
  return { open, Part: lazy(() => ready.then(load).then((Part) => ({ default: Part }))) };
}

/**
 * The server's HTML of a part, frozen, for the rare case React must render the part on the client
 * before its code is in (a change of site mode reaches every part still waiting). Comments are the
 * markers React left in it, not content.
 */
function Frozen({ read, onShow }: { read: () => string; onShow: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (ref.current !== null) ref.current.innerHTML = read();
    onShow();
  }, [read, onShow]);
  return <div ref={ref} className="contents" />;
}

/**
 * Wraps a client part so it is rendered on the server and shown from the HTML at once, but its
 * JavaScript loads, and it hydrates, only when `when` says so. Until then React leaves the server's
 * markup in place: the part is visible and laid out, it only does nothing yet. The part's module
 * must be imported nowhere else on the page, or its code ships with the page anyway.
 */
export function deferred<P extends object>(
  load: () => Promise<ComponentType<P>>,
  when: DeferWhen = 'visible',
) {
  function Deferred({ className, ...props }: P & { className?: string }) {
    const ref = useRef<HTMLDivElement>(null);
    const [gate] = useState(() => makeGate(load));
    // Kept in a ref, not state: re-rendering this wrapper would hand the waiting part new props,
    // and React would then render it on the client at once instead of waiting.
    const snapshot = useRef('');
    const [read] = useState(() => () => snapshot.current);
    const { Part } = gate;

    useEffect(() => {
      const element = ref.current;
      if (element === null) return;
      snapshot.current = element.innerHTML.replaceAll(/<!--[\s\S]*?-->/g, '');
      if (when === 'never') return;
      const open = () => {
        cleanup();
        gate.open();
      };
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry?.isIntersecting === true) open();
        },
        { rootMargin: '25% 0px' },
      );
      observer.observe(element);
      element.addEventListener('pointerover', open);
      element.addEventListener('focusin', open);
      function cleanup() {
        observer.disconnect();
        element?.removeEventListener('pointerover', open);
        element?.removeEventListener('focusin', open);
      }
      return cleanup;
    }, [gate]);

    return (
      <div ref={ref} className={className}>
        <Suspense fallback={<Frozen read={read} onShow={gate.open} />}>
          <Part {...(props as P)} />
        </Suspense>
      </div>
    );
  }
  return Deferred;
}
