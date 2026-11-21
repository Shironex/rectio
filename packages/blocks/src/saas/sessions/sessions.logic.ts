export type SessionDevice = 'desktop' | 'laptop' | 'phone' | 'tablet' | 'unknown';

export interface Session {
  id: string;
  device: SessionDevice;
  /** The browser or app, such as "Chrome 131" or "Fernhill for iOS". */
  client: string;
  /** The operating system, such as "macOS". */
  os?: string;
  /** Where the session was last seen, as your geolocation names it: "Berlin, Germany". */
  location?: string;
  ip?: string;
  signedInAt: Date;
  lastActiveAt: Date;
  /** The session this page is open in. It can only end by signing out. */
  current?: boolean;
}

/** Seen within this many minutes reads as "Active now". */
export const ACTIVE_MINUTES = 5;

/** True when the session was seen in the last few minutes, or is the one in use. */
export function isActiveNow(session: Session, now: Date): boolean {
  return (
    session.current === true ||
    now.getTime() - session.lastActiveAt.getTime() < ACTIVE_MINUTES * 60_000
  );
}

/** This device first, then the most recently active, then by when they signed in. */
export function sortSessions(sessions: readonly Session[]): Session[] {
  return [...sessions].sort(
    (a, b) =>
      Number(b.current === true) - Number(a.current === true) ||
      b.lastActiveAt.getTime() - a.lastActiveAt.getTime() ||
      b.signedInAt.getTime() - a.signedInAt.getTime(),
  );
}

/** "Chrome on macOS", or the client alone when the system is not known. */
export function sessionName(session: Pick<Session, 'client' | 'os'>): string {
  return session.os === undefined ? session.client : `${session.client} on ${session.os}`;
}

/** The sessions that can be signed out from here: every one but this device. */
export function otherSessions(sessions: readonly Session[]): Session[] {
  return sessions.filter((session) => session.current !== true);
}
