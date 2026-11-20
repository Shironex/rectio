/**
 * The template viewer's arithmetic, kept apart from React so it can be tested on its own: the widths
 * it frames a template at, how far a frame scales to fit, and which declared page a URL is.
 */

export const DEVICES = [
  { id: 'desktop', label: 'Desktop', width: 1280 },
  { id: 'tablet', label: 'Tablet', width: 834 },
  { id: 'phone', label: 'Phone', width: 390 },
] as const;
export type DeviceId = (typeof DEVICES)[number]['id'];

export const deviceWidth = (id: DeviceId): number =>
  DEVICES.find((device) => device.id === id)?.width ?? DEVICES[0].width;

/** The widest device that fits the stage without scaling, else the phone (which then scales). */
export function initialDevice(stageWidth: number): DeviceId {
  return DEVICES.find((device) => device.width <= stageWidth)?.id ?? 'phone';
}

/**
 * The frame keeps the device's real width, so the template lays out as it would on that screen,
 * and scales down when the stage is narrower. Never up: a desktop frame on a wide screen stays 1:1.
 */
export function fitScale(stageWidth: number, width: number): number {
  if (stageWidth <= 0) return 1;
  return Math.min(1, stageWidth / width);
}

/** `/invoices/[id]` matches `/invoices/inv-2026-0216`; `[...slug]` matches one or more segments. */
export function routeMatches(route: string, path: string): boolean {
  const want = route.split('/').filter(Boolean);
  const have = path.split('/').filter(Boolean);
  for (let i = 0; i < want.length; i += 1) {
    const segment = want[i] ?? '';
    if (/^\[\[?\.\.\./.test(segment)) return have.length > i || segment.startsWith('[[');
    if (have[i] === undefined) return false;
    if (!segment.startsWith('[') && segment !== have[i]) return false;
  }
  return want.length === have.length;
}

/** The declared route a path inside the preview belongs to, preferring a static match. */
export function routeFor(routes: readonly string[], path: string): string | undefined {
  const clean = path.replace(/\/+$/, '') || '/';
  return (
    routes.find((route) => route === clean) ?? routes.find((route) => routeMatches(route, clean))
  );
}

/** The path inside a preview from a full pathname: `/preview/x/invoices/` is `/invoices`. */
export function pathInPreview(base: string, pathname: string): string {
  const rest = pathname.startsWith(base) ? pathname.slice(base.length) : pathname;
  return rest.replace(/\/+$/, '') || '/';
}
