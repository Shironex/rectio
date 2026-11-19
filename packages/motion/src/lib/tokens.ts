/**
 * Motion values come from the design tokens, read at the moment an animation starts from the
 * element that moves. The element inherits its theme's custom properties, so a dialog inside a
 * `ledger` scope moves with ledger's slower springs while one beside it keeps the default.
 *
 * Nothing here has a fallback value: without the token stylesheet there is no motion at all,
 * which is the plain behaviour, never a guessed duration.
 */

/** Spring physics in Motion's terms. */
export interface SpringToken {
  stiffness: number;
  damping: number;
  mass: number;
}

/** A cubic Bézier easing as Motion takes it. */
export type Bezier = [number, number, number, number];

export interface MotionTokens {
  /** Seconds, as Motion takes them. */
  duration: { fast: number; base: number; slow: number; count: number };
  easing: { standard: Bezier; enter: Bezier; exit: Bezier; settle: Bezier };
  /** CSS lengths, used as they are in transforms. */
  distance: { shift: string; tick: string };
  scale: { from: number; press: number };
  spring: { press: SpringToken; overlay: SpringToken };
}

/** `180ms` or `0.18s` to seconds. */
export function parseDuration(value: string): number | null {
  const m = /^\s*(-?[\d.]+)(ms|s)\s*$/.exec(value);
  if (m === null) return null;
  const amount = Number(m[1]);
  if (!Number.isFinite(amount)) return null;
  return m[2] === 'ms' ? amount / 1000 : amount;
}

/** `cubic-bezier(0.2, 0, 0, 1)` to `[0.2, 0, 0, 1]`. */
export function parseBezier(value: string): Bezier | null {
  const m = /^\s*cubic-bezier\(([^)]*)\)\s*$/.exec(value);
  if (m === null) return null;
  const parts = (m[1] ?? '').split(',').map((part) => Number(part.trim()));
  if (parts.length !== 4 || parts.some((n) => !Number.isFinite(n))) return null;
  const [x1 = 0, y1 = 0, x2 = 0, y2 = 0] = parts;
  return [x1, y1, x2, y2];
}

export function parseNumber(value: string): number | null {
  if (value.trim() === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/** A CSS length kept as text, such as `0.25rem` or `0px`. */
export function parseLength(value: string): string | null {
  const trimmed = value.trim();
  return /^-?[\d.]+[a-z%]*$/.test(trimmed) ? trimmed : null;
}

type Read = (name: string) => string;

/** Builds the token set from a custom property reader; null if any token is missing or malformed. */
export function motionTokensFrom(read: Read): MotionTokens | null {
  const d = (name: string) => parseDuration(read(`--rx-motion-duration-${name}`));
  const e = (name: string) => parseBezier(read(`--rx-motion-easing-${name}`));
  const n = (name: string) => parseNumber(read(`--rx-motion-${name}`));
  const l = (name: string) => parseLength(read(`--rx-motion-distance-${name}`));
  const spring = (name: string): SpringToken | null => {
    const stiffness = n(`spring-${name}-stiffness`);
    const damping = n(`spring-${name}-damping`);
    const mass = n(`spring-${name}-mass`);
    return stiffness === null || damping === null || mass === null
      ? null
      : { stiffness, damping, mass };
  };

  const duration = { fast: d('fast'), base: d('base'), slow: d('slow'), count: d('count') };
  const easing = {
    standard: e('standard'),
    enter: e('enter'),
    exit: e('exit'),
    settle: e('settle'),
  };
  const distance = { shift: l('shift'), tick: l('tick') };
  const scale = { from: n('scale-from'), press: n('scale-press') };
  const springs = { press: spring('press'), overlay: spring('overlay') };

  const groups = [duration, easing, distance, scale, springs];
  if (groups.some((group) => Object.values(group).some((value) => value === null))) return null;
  return { duration, easing, distance, scale, spring: springs } as MotionTokens;
}

/** The motion tokens in effect on an element, read from its computed style. */
export function readMotionTokens(element: Element): MotionTokens | null {
  const style = getComputedStyle(element);
  return motionTokensFrom((name) => style.getPropertyValue(name));
}
