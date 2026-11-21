import { useSyncExternalStore } from 'react';

const REDUCED_QUERY = '(prefers-reduced-motion: reduce)';

/** Reads a duration token (`240ms` or `0.24s`) from an element, in milliseconds. */
export function readDuration(token: string, element: Element = document.documentElement): number {
  const raw = getComputedStyle(element).getPropertyValue(token).trim();
  const value = Number.parseFloat(raw);
  if (!Number.isFinite(value)) return 0;
  return raw.endsWith('ms') ? value : value * 1000;
}

/** Reads an easing token as a string WAAPI accepts. */
export function readEasing(token: string, element: Element = document.documentElement): string {
  return getComputedStyle(element).getPropertyValue(token).trim() || 'linear';
}

export const prefersReducedMotion = () => matchMedia(REDUCED_QUERY).matches;

function subscribeReduced(onChange: () => void) {
  const query = matchMedia(REDUCED_QUERY);
  query.addEventListener('change', onChange);
  return () => {
    query.removeEventListener('change', onChange);
  };
}

/**
 * Whether the visitor asked for reduced motion, kept in step with the system setting. `onServer`
 * is the answer the server HTML is rendered with, where the setting is unknown.
 */
export function useReducedMotion(onServer = false): boolean {
  return useSyncExternalStore(subscribeReduced, prefersReducedMotion, () => onServer);
}
