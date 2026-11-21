'use client';

import {
  Component,
  createElement,
  lazy,
  type ReactNode,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ComponentType,
} from 'react';
import { usePathname } from 'next/navigation';

import { BASE_PATH } from '@/lib/base-path';

/**
 * When a deferred part takes its code: `visible` as it nears the screen (or is pointed at or
 * focused first), `never` for a picture of the kit that has nothing to do on the client.
 */
export type DeferWhen = 'visible' | 'never';

/** Hydrating this keeps the server's markup as it is: React does not look inside it. */
const KEEP = { __html: '' };

const noSubscribe = () => () => undefined;

/** An element in the kept markup, found again in the live part by its place, tag and text. */
interface Mark {
  path: number[];
  tag: string;
  text: string;
}

const textOf = (element: Element) => element.textContent.trim().slice(0, 120);

function markOf(root: Element, node: Element): Mark | undefined {
  const path: number[] = [];
  for (let at: Element = node; at !== root;) {
    const parent = at.parentElement;
    if (parent === null) return undefined;
    path.unshift(Array.prototype.indexOf.call(parent.children, at));
    at = parent;
  }
  return { path, tag: node.tagName, text: textOf(node) };
}

/**
 * The live twin of a marked element. The place comes first; when the live part lays out a little
 * differently (an extra or missing wrapper), the first element with the same tag and text.
 */
function find(root: Element, mark: Mark): HTMLElement | undefined {
  let at: Element | undefined = root;
  for (const index of mark.path) at = at?.children[index];
  const same = (element: Element | undefined): element is HTMLElement =>
    element instanceof HTMLElement && element.tagName === mark.tag && textOf(element) === mark.text;
  if (same(at)) return at;
  return Array.from(root.getElementsByTagName(mark.tag)).find(same);
}

/**
 * Presses the live control as a pointer would: some open on pointer down, others on click. A slider
 * only takes focus: its drag wants a real pointer to capture, which a replay does not have.
 */
function press(target: HTMLElement) {
  if (target.closest('[role="slider"]') !== null) {
    target.focus({ preventScroll: true });
    return;
  }
  const init = { bubbles: true, cancelable: true, composed: true, button: 0, view: window };
  const pointer = { ...init, pointerType: 'mouse', isPrimary: true };
  try {
    target.dispatchEvent(new PointerEvent('pointerdown', pointer));
    target.dispatchEvent(new MouseEvent('mousedown', init));
    target.dispatchEvent(new PointerEvent('pointerup', pointer));
    target.dispatchEvent(new MouseEvent('mouseup', init));
    target.click();
  } catch {
    // A control that refuses a replayed press keeps the focus it was given instead.
    target.focus({ preventScroll: true });
  }
}

/**
 * Around a part the client loads during a navigation: if its code fails, load the page from the
 * server instead (its HTML has the part in full) rather than showing the error screen.
 */
class LoadOrReload extends Component<{ to: string; children: ReactNode }, { failed: boolean }> {
  override state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  override componentDidCatch() {
    // The route being navigated to: the address bar may still show the page it came from.
    window.location.assign(this.props.to);
  }

  override render() {
    return this.state.failed ? null : this.props.children;
  }
}

/** What a press can act on. A press anywhere else (text, a picture) just starts the load. */
const CONTROL_ROLES = [
  'button',
  'checkbox',
  'combobox',
  'switch',
  'radio',
  'tab',
  'option',
  'slider',
];
const CONTROL = [
  'button, input, select, textarea, label, summary',
  ...CONTROL_ROLES.map((role) => `[role="${role}"]`),
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

/**
 * Wraps a client part so the server renders it in full (the HTML has it, readable without
 * JavaScript, with no Suspense boundary that a script would have to reveal), while its JavaScript
 * loads only when `when` says so. Until then the client keeps the server's markup untouched, not
 * hydrated; then the part mounts live in its place. A press on a control in between is held and
 * replayed on the live part, and focus moves across with it; links work as plain HTML throughout.
 *
 * Rendered by the client with no markup to keep (a navigation inside the site), the part suspends
 * instead, with no boundary of its own: the navigation, a transition, keeps the page it came from
 * until the parts are in, so nothing shows empty and nothing moves.
 *
 * `onServer` is the part itself, taken synchronously on the server only (see parts.tsx). The
 * part's module must be imported nowhere else on the page, or its code ships with the page anyway.
 */
export function deferred<P extends object>(
  load: () => Promise<ComponentType<P>>,
  onServer: ComponentType<P> | undefined,
  when: DeferWhen = 'visible',
) {
  const Suspending = lazy(() => load().then((Part) => ({ default: Part })));

  function Deferred({ className, ...props }: P & { className?: string }) {
    const ref = useRef<HTMLDivElement>(null);
    const pathname = usePathname();
    // True while hydrating server HTML, false when the client renders the part with no HTML to keep.
    const hydrating = useSyncExternalStore(
      noSubscribe,
      () => false,
      () => true,
    );
    const [fresh] = useState(() => !hydrating);
    const [Live, setLive] = useState<ComponentType<P> | null>(null);
    const held = useRef<{ press?: Mark | undefined; focus?: Mark | undefined }>({});

    useEffect(() => {
      const element = ref.current;
      if (element === null || fresh || Live !== null || when === 'never') return;
      let started = false;
      let failed = false;
      let gone = false;
      const open = () => {
        if (started) return;
        started = true;
        failed = false;
        stopWatching();
        load().then(
          (Part) => {
            if (gone) return;
            const kept = element.firstElementChild;
            const focused = document.activeElement;
            if (kept !== null && focused !== null && kept.contains(focused)) {
              held.current.focus = markOf(kept, focused);
            }
            // Let go before the live part mounts, so the replayed press is not held again.
            element.removeEventListener('click', hold, true);
            setLive(() => Part);
          },
          () => {
            // The code did not come: keep the server's markup, stop holding presses, and try
            // again on the next one.
            if (gone) return;
            started = false;
            failed = true;
            held.current = {};
            watch();
          },
        );
      };
      const hold = (event: MouseEvent) => {
        const kept = element.firstElementChild;
        if (!(event.target instanceof Element) || kept === null) return;
        const control = event.target.closest(CONTROL);
        if (failed || event.target.closest('a[href]') !== null || control === null) {
          open();
          return;
        }
        if (!kept.contains(control)) return;
        event.preventDefault();
        held.current.press = markOf(kept, control);
        open();
      };
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry?.isIntersecting === true) open();
        },
        { rootMargin: '25% 0px' },
      );
      function watch() {
        element?.addEventListener('pointerover', open);
        element?.addEventListener('focusin', open);
      }
      function stopWatching() {
        observer.disconnect();
        element?.removeEventListener('pointerover', open);
        element?.removeEventListener('focusin', open);
      }
      element.addEventListener('click', hold, true);
      observer.observe(element);
      watch();
      return () => {
        gone = true;
        stopWatching();
        element.removeEventListener('click', hold, true);
      };
    }, [Live, fresh]);

    // Once live, give back what happened while the code was on its way. A press whose control is
    // not found again is not dropped silently: focus goes to the part, where it happened.
    useLayoutEffect(() => {
      const live = ref.current?.firstElementChild;
      if (Live === null || live === null || live === undefined) return;
      const { press: pressed, focus } = held.current;
      held.current = {};
      if (focus !== undefined) find(live, focus)?.focus({ preventScroll: true });
      if (pressed === undefined) return;
      const target = find(live, pressed);
      if (target === undefined) {
        const part = ref.current;
        if (part !== null) {
          part.tabIndex = -1;
          part.focus({ preventScroll: true });
        }
      } else {
        press(target);
      }
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
    } else if (fresh) {
      inner = (
        <div key="live" className="contents">
          <LoadOrReload to={`${BASE_PATH}${pathname}`}>
            {createElement(Suspending, props as P)}
          </LoadOrReload>
        </div>
      );
    } else {
      inner = (
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
