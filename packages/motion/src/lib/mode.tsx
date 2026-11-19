import { createContext, use, useSyncExternalStore, type ReactNode } from 'react';

/**
 * `user` follows the operating system's reduced motion setting. `off` renders every motioned
 * component as its plain twin, for a user preference stored in the app or for screenshots.
 */
export type MotionPreference = 'user' | 'off';

const PreferenceContext = createContext<MotionPreference>('user');

export interface MotionPreferenceProps {
  value: MotionPreference;
  children?: ReactNode;
}

/** Optional. Without it, motioned components follow the system setting. */
export function MotionPreferenceProvider({ value, children }: MotionPreferenceProps) {
  return <PreferenceContext value={value}>{children}</PreferenceContext>;
}

const QUERY = '(prefers-reduced-motion: reduce)';

function subscribe(onChange: () => void) {
  if (typeof matchMedia !== 'function') return () => undefined;
  const list = matchMedia(QUERY);
  list.addEventListener('change', onChange);
  return () => {
    list.removeEventListener('change', onChange);
  };
}

/** Without the Web Animations API (old browsers, test DOMs) there is nothing to run. */
const canAnimate = () => typeof Element !== 'undefined' && 'animate' in Element.prototype;

const mustStayStill = () =>
  !canAnimate() || (typeof matchMedia === 'function' && matchMedia(QUERY).matches);

/**
 * True when a motioned component must collapse to the plain one: the user asked for reduced
 * motion, the app turned motion off, or the browser cannot run it. On the server it is false;
 * nothing animates before hydration anyway.
 */
export function usePlainMotion(): boolean {
  const preference = use(PreferenceContext);
  // The server renders the motioned markup; the client corrects it after hydration if needed.
  const still = useSyncExternalStore(subscribe, mustStayStill, () => false);
  return preference === 'off' || still;
}
