/**
 * The sample week the product visuals show: one café team, one week. Deterministic, so every build
 * and every screenshot draws the same rota.
 */

export type RoleId = 'front' | 'kitchen' | 'floor' | 'close';

export interface Role {
  id: RoleId;
  label: string;
  /** Which identity colour pair the role's shifts use: 1 to 6, from the tokens. */
  identity: 1 | 2 | 3 | 4;
}

export const ROLES: readonly Role[] = [
  { id: 'front', label: 'Front desk', identity: 1 },
  { id: 'kitchen', label: 'Kitchen', identity: 2 },
  { id: 'floor', label: 'Floor', identity: 3 },
  { id: 'close', label: 'Close', identity: 4 },
];

export interface Shift {
  start: string;
  end: string;
  role: RoleId;
}

export interface Person {
  id: string;
  name: string;
  /** One shift per day, Monday first; null is a day off. */
  week: readonly (Shift | null)[];
}

export const DAYS = [
  { short: 'Mon', date: 17 },
  { short: 'Tue', date: 18 },
  { short: 'Wed', date: 19 },
  { short: 'Thu', date: 20 },
  { short: 'Fri', date: 21 },
  { short: 'Sat', date: 22 },
  { short: 'Sun', date: 23 },
] as const;

const early = (role: RoleId): Shift => ({ start: '07:00', end: '15:00', role });
const mid = (role: RoleId): Shift => ({ start: '10:00', end: '18:00', role });
const late = (role: RoleId): Shift => ({ start: '14:00', end: '22:00', role });

export const TEAM_WEEK: readonly Person[] = [
  {
    id: 'ana',
    name: 'Ana Ribeiro',
    week: [early('front'), early('front'), null, early('front'), mid('front'), null, mid('front')],
  },
  {
    id: 'marco',
    name: 'Marco Lindqvist',
    week: [
      late('kitchen'),
      null,
      late('kitchen'),
      late('kitchen'),
      late('kitchen'),
      mid('kitchen'),
      null,
    ],
  },
  {
    id: 'priya',
    name: 'Priya Natarajan',
    week: [mid('floor'), mid('floor'), mid('floor'), null, null, early('floor'), early('floor')],
  },
  {
    id: 'kofi',
    name: 'Kofi Mensah',
    week: [null, late('close'), late('close'), mid('floor'), late('close'), late('close'), null],
  },
  {
    id: 'elin',
    name: 'Elin Sato',
    week: [
      early('kitchen'),
      early('kitchen'),
      early('kitchen'),
      null,
      early('kitchen'),
      null,
      late('close'),
    ],
  },
];

/** Shifts each day needs filled, and the gaps the rota still has. */
export const NEEDED = [4, 4, 4, 3, 5, 4, 3] as const;

export function filledOn(day: number): number {
  return TEAM_WEEK.filter((person) => person.week[day] != null).length;
}

/** The open shifts in the sample week, as the open shift board lists them. */
export const OPEN_SHIFTS = [
  { id: 'o1', day: 'Fri 21', start: '16:00', end: '22:00', role: 'Floor', pay: 'Weekend rate' },
  { id: 'o2', day: 'Sat 22', start: '07:00', end: '13:00', role: 'Front desk', pay: 'Standard' },
] as const;
