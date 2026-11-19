import { readMotionTokens, usePlainMotion, type MotionTokens } from '@rectio/motion';
import { AnimatePresence, PresenceContext, usePresence } from 'motion/react';
import { use, useLayoutEffect, useRef, type ComponentProps, type ReactNode } from 'react';

import { MotionParts } from '../../lib/motion-parts';
import { SaasPartsProvider, type SaasParts } from './saas-parts';

/**
 * The SaaS blocks' motion parts: the shared ones (first-view entrance, motioned buttons and
 * figures) plus list items that arrive with a short rise and leave with a quicker fade, after which
 * the items below slide up into the gap (FLIP, transforms only). Reduced motion renders plain.
 */

function easing(element: Element, name: keyof MotionTokens['easing']): string {
  return (
    getComputedStyle(element).getPropertyValue(`--rx-motion-easing-${name}`).trim() || 'linear'
  );
}

function Items({ children }: { children: ReactNode }) {
  const plain = usePlainMotion();
  return plain ? children : <AnimatePresence initial={false}>{children}</AnimatePresence>;
}

/**
 * Takes a leaver out of the layout and slides its later siblings from where they were. Every
 * layout read happens before any animation starts, so the browser lays out once.
 */
function closeGap(item: HTMLElement, tokens: MotionTokens) {
  const parent = item.parentElement;
  if (parent === null) return;
  const rest = [...parent.children].filter(
    (child): child is HTMLElement => child instanceof HTMLElement && child !== item,
  );
  const before = rest.map((child) => child.getBoundingClientRect());
  item.style.display = 'none';
  const after = rest.map((child) => child.getBoundingClientRect());
  const ease = easing(parent, 'standard');
  rest.forEach((child, index) => {
    const was = before[index];
    const now = after[index];
    if (was === undefined || now === undefined) return;
    const dx = was.left - now.left;
    const dy = was.top - now.top;
    if (dx === 0 && dy === 0) return;
    child.animate(
      [{ transform: `translate(${String(dx)}px, ${String(dy)}px)` }, { transform: 'none' }],
      { duration: tokens.duration.base * 1000, easing: ease },
    );
  });
}

/**
 * Before a leaver goes inert, hands focus to the item after it (or before it, or the list), so
 * a keyboard user who just removed a row is not dropped to the top of the page.
 */
function keepFocus(item: HTMLElement) {
  if (!item.contains(document.activeElement)) return;
  const next = item.nextElementSibling ?? item.previousElementSibling;
  const target =
    next?.querySelector<HTMLElement>(
      'button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ) ?? item.parentElement;
  if (target === null) return;
  if (target === item.parentElement && !target.hasAttribute('tabindex')) target.tabIndex = -1;
  target.focus({ preventScroll: true });
}

function Item({ ref, ...props }: ComponentProps<'li'>) {
  const plain = usePlainMotion();
  const [isPresent, safeToRemove] = usePresence();
  const presence = use(PresenceContext);
  const node = useRef<HTMLLIElement | null>(null);
  const settled = useRef(presence === null || presence.initial === false);

  useLayoutEffect(() => {
    const item = node.current;
    const tokens = item === null || plain ? null : readMotionTokens(item);
    if (item === null || tokens === null) {
      settled.current = true;
      if (!isPresent) safeToRemove();
      return;
    }
    const ease = easing(item, 'enter');
    if (isPresent) {
      if (settled.current) return;
      settled.current = true;
      item.animate(
        [
          { opacity: 0, transform: `translateY(calc(-1 * ${tokens.distance.shift}))` },
          { opacity: 1, transform: 'none' },
        ],
        { duration: tokens.duration.base * 1000, easing: ease },
      );
      return;
    }
    // Leaving: out of the tab order at once, then a fade faster than the entrance.
    keepFocus(item);
    item.inert = true;
    const exit = item.animate(
      [
        { opacity: 1, transform: 'none' },
        { opacity: 0, transform: `translateX(${tokens.distance.shift})` },
      ],
      { duration: tokens.duration.fast * 1000, easing: ease, fill: 'forwards' },
    );
    // A cancelled animation rejects: remove the item either way so it never sticks.
    const done = () => {
      closeGap(item, tokens);
      safeToRemove();
    };
    exit.finished.then(done, done);
  }, [isPresent, plain, safeToRemove]);

  return (
    <li
      ref={(value: HTMLLIElement | null) => {
        node.current = value;
        if (typeof ref === 'function') ref(value);
        else if (ref !== null && ref !== undefined) ref.current = value;
      }}
      {...props}
    />
  );
}

export const SAAS_MOTION_PARTS: SaasParts = { Items, Item };

/** Renders a SaaS block with the motion parts. Each motion SaaS block wraps itself in it. */
export function SaasMotionParts({ children }: { children: ReactNode }) {
  return (
    <MotionParts>
      <SaasPartsProvider parts={SAAS_MOTION_PARTS}>{children}</SaasPartsProvider>
    </MotionParts>
  );
}
