import { at, minutesAgo } from './workspace';

/** A device signed in to the account. */
export interface Session {
  id: string;
  device: string;
  kind: 'desktop' | 'phone' | 'tablet';
  browser: string;
  location: string;
  ip: string;
  lastActive: Date;
  current?: boolean;
}

export const SESSIONS: readonly Session[] = [
  {
    id: 's1',
    device: 'MacBook Pro',
    kind: 'desktop',
    browser: 'Chrome 142',
    location: 'Boston, United States',
    ip: '73.181.24.9',
    lastActive: minutesAgo(0),
    current: true,
  },
  {
    id: 's2',
    device: 'iPhone 16',
    kind: 'phone',
    browser: 'Lindwell for iOS',
    location: 'Boston, United States',
    ip: '73.181.24.9',
    lastActive: minutesAgo(35),
  },
  {
    id: 's3',
    device: 'iPad Air',
    kind: 'tablet',
    browser: 'Safari 19',
    location: 'Providence, United States',
    ip: '24.62.140.77',
    lastActive: minutesAgo(60 * 24 * 3),
  },
  {
    id: 's4',
    device: 'Windows desktop',
    kind: 'desktop',
    browser: 'Edge 141',
    location: 'Lisbon, Portugal',
    ip: '85.243.11.102',
    lastActive: at(11, 2, 18, 20),
  },
];

/** Recent sign-ins to the account, newest first. */
export const SIGN_INS: readonly {
  id: string;
  at: Date;
  method: string;
  location: string;
  result: 'ok' | 'blocked';
}[] = [
  {
    id: 'l1',
    at: minutesAgo(60 * 2),
    method: 'Password and authenticator',
    location: 'Boston, United States',
    result: 'ok',
  },
  {
    id: 'l2',
    at: minutesAgo(60 * 26),
    method: 'Google',
    location: 'Boston, United States',
    result: 'ok',
  },
  {
    id: 'l3',
    at: at(11, 14, 22, 3),
    method: 'Password',
    location: 'Kharkiv, Ukraine',
    result: 'blocked',
  },
  {
    id: 'l4',
    at: at(11, 12, 8, 51),
    method: 'Password and authenticator',
    location: 'Providence, United States',
    result: 'ok',
  },
];
