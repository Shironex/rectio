import type {
  LeaveRequest,
  LeaveType,
  OrgPerson,
  PayrollLine,
  TimesheetRow,
} from '@rectio/blocks/people';

/** The day the playground pretends it is: a Thursday, so the week has past and coming days. */
export const TODAY = '2026-11-26';
export const WEEK = '2026-11-23';
export const HOLIDAYS = { '2026-12-25': 'Christmas Day', '2026-12-28': 'Boxing Day (substitute)' };

export const TIMESHEET: TimesheetRow[] = [
  {
    id: 'harbor',
    project: 'Harbor Freight portal',
    task: 'Build',
    minutes: { '2026-11-23': 330, '2026-11-24': 270, '2026-11-26': 300 },
    notes: { '2026-11-24': 'Pairing on the carrier rate import with Ines.' },
  },
  {
    id: 'harbor-review',
    project: 'Harbor Freight portal',
    task: 'Code review',
    minutes: { '2026-11-23': 60, '2026-11-24': 45, '2026-11-26': 30 },
  },
  {
    id: 'mesa',
    project: 'Mesa Clinics',
    task: 'Discovery workshop',
    minutes: { '2026-11-24': 240 },
    notes: { '2026-11-24': 'On site in Leeds, travel not billed.' },
  },
  {
    id: 'internal',
    project: 'Internal',
    task: 'Hiring panel',
    minutes: { '2026-11-23': 90, '2026-11-26': 60 },
  },
];

export const LEAVE_TYPES: LeaveType[] = [
  { id: 'annual', label: 'Annual leave', allowance: 25 },
  { id: 'sick', label: 'Sick leave' },
  { id: 'parental', label: 'Parental leave', allowance: 10 },
  { id: 'study', label: 'Study leave', allowance: 5 },
];

const who = (id: string, name: string, avatar?: string) => ({
  id,
  name,
  ...(avatar === undefined ? {} : { avatar }),
});
const ines = who('ines', 'Ines Carvalho');
const tomasz = who('tomasz', 'Tomasz Wrona');
const amara = who('amara', 'Amara Nwosu');
const felix = who('felix', 'Felix Lindqvist');
const priya = who('priya', 'Priya Raman');
const jonah = who('jonah', 'Jonah Feld');

export const LEAVE: LeaveRequest[] = [
  {
    id: 'l1',
    person: ines,
    type: 'annual',
    start: '2026-12-21',
    end: '2026-12-25',
    status: 'pending',
    note: 'Family in Porto for the holidays.',
  },
  {
    id: 'l2',
    person: tomasz,
    type: 'annual',
    start: '2026-12-22',
    end: '2027-01-02',
    status: 'approved',
    decision: { by: 'Dana Whitfield', on: '2026-11-10' },
  },
  {
    id: 'l3',
    person: amara,
    type: 'study',
    start: '2026-12-03',
    end: '2026-12-05',
    halfStart: true,
    status: 'pending',
    note: 'CIPD exam on the Friday.',
  },
  {
    id: 'l4',
    person: felix,
    type: 'sick',
    start: '2026-11-19',
    end: '2026-11-21',
    status: 'approved',
    decision: { by: 'Dana Whitfield', on: '2026-11-19' },
  },
  {
    id: 'l5',
    person: priya,
    type: 'annual',
    start: '2026-12-14',
    end: '2026-12-19',
    status: 'declined',
    decision: { by: 'Dana Whitfield', on: '2026-11-18', reason: 'Year-end release week.' },
  },
  {
    id: 'l6',
    person: jonah,
    type: 'annual',
    start: '2026-12-07',
    end: '2026-12-08',
    halfEnd: true,
    status: 'cancelled',
  },
  {
    id: 'l7',
    person: ines,
    type: 'annual',
    start: '2026-10-12',
    end: '2026-10-17',
    status: 'approved',
    decision: { by: 'Dana Whitfield', on: '2026-09-30' },
  },
  {
    id: 'l8',
    person: priya,
    type: 'parental',
    start: '2026-12-01',
    end: '2026-12-02',
    status: 'pending',
    note: 'Settling-in day at nursery.',
  },
];

const FIRST = [
  'Ada',
  'Bilal',
  'Chiara',
  'Dmitri',
  'Elif',
  'Farah',
  'Goran',
  'Hana',
  'Ivo',
  'Jia',
  'Kemal',
  'Lucía',
  'Mateo',
  'Nadia',
  'Oskar',
  'Paloma',
  'Quentin',
  'Rania',
  'Soren',
  'Tomoko',
  'Uma',
  'Viktor',
  'Wen',
  'Ximena',
  'Yusuf',
  'Zoë',
  'Anouk',
  'Bram',
  'Céline',
  'Darius',
  'Esme',
  'Fintan',
  'Greta',
  'Hamid',
  'Isla',
  'Jarrah',
  'Kaito',
  'Leila',
  'Malik',
  'Noor',
];
const LAST = [
  'Abara',
  'Becker',
  'Costa',
  'Dubois',
  'Eriksen',
  'Fontaine',
  'García',
  'Haddad',
  'Ito',
  'Jansen',
  'Kowalczyk',
  'Lindgren',
  'Moreau',
  'Nakamura',
  'Okafor',
  'Petrov',
  'Quinn',
  'Rossi',
  'Silva',
  'Tanaka',
  'Ueda',
  'Varga',
  'Weber',
  'Xu',
  'Yilmaz',
  'Zielinski',
  'Achebe',
  'Byrne',
  'Castillo',
  'Dahl',
  'Esposito',
  'Fischer',
  'Gallo',
  'Horvat',
  'Iqbal',
  'Jovanovic',
  'Kaur',
  'Larsen',
];
const DEPARTMENTS = [
  ['Engineering', 'Software Engineer', 'Engineering Manager'],
  ['Product', 'Product Designer', 'Product Lead'],
  ['Finance', 'Financial Analyst', 'Finance Manager'],
  ['People', 'People Partner', 'People Lead'],
  ['Sales', 'Account Executive', 'Sales Manager'],
  ['Customer Success', 'Success Manager', 'Support Lead'],
  ['Operations', 'Operations Analyst', 'Operations Lead'],
  ['Legal', 'Counsel', 'Head of Legal Ops'],
] as const;
const HEADS = [
  'VP Engineering',
  'VP Product',
  'Chief Financial Officer',
  'Chief People Officer',
  'VP Sales',
  'VP Customer Success',
  'Chief Operating Officer',
  'General Counsel',
];
const CITIES = ['London', 'Lisbon', 'Berlin', 'Warsaw', 'Toronto', 'Remote'];

/**
 * A made-up company of `size` people: a CEO, eight department heads, managers under them and
 * teams of six to nine under each manager. The same size always gives the same people.
 */
export function makeOrg(size: number): OrgPerson[] {
  const people: OrgPerson[] = [
    {
      id: 'ceo',
      name: 'Dana Whitfield',
      title: 'Chief Executive',
      department: 'Leadership',
      location: 'London',
      email: 'dana@fernhill.example',
    },
  ];
  // A cheap integer hash spreads first and last names, so teams never repeat the same few.
  const mix = (value: number) => (Math.imul(value ^ (value >>> 7), 2654435761) >>> 0) >>> 8;
  const name = (index: number) =>
    `${FIRST[mix(index) % FIRST.length] ?? ''} ${LAST[mix(index * 31 + 7) % LAST.length] ?? ''}`;
  let index = 1;
  const add = (person: Omit<OrgPerson, 'id' | 'name'>) => {
    const id = `p${String(index)}`;
    const full = name(index);
    people.push({
      id,
      name: full,
      email: `${full.split(' ')[0]?.toLowerCase() ?? 'person'}.${String(index)}@fernhill.example`,
      location: CITIES[index % CITIES.length],
      ...person,
    });
    index += 1;
    return id;
  };
  const heads = DEPARTMENTS.map(([department], d) =>
    add({ title: HEADS[d], department, managerId: 'ceo' }),
  );
  // Managers round robin under the heads, then people round robin under the managers.
  const managers: { id: string; d: number }[] = [];
  const managerCount = Math.max(8, Math.round(size / 9));
  for (let m = 0; m < managerCount && index < size; m += 1) {
    const d = m % DEPARTMENTS.length;
    const [department, , title] = DEPARTMENTS[d] ?? DEPARTMENTS[0];
    managers.push({ id: add({ title, department, managerId: heads[d] }), d });
  }
  for (let p = 0; index < size; p += 1) {
    const manager = managers[p % managers.length];
    if (manager === undefined) break;
    const [department, title] = DEPARTMENTS[manager.d] ?? DEPARTMENTS[0];
    const senior = p % 5 === 0 ? 'Senior ' : '';
    add({ title: `${senior}${title}`, department, managerId: manager.id });
  }
  return people;
}

/** November's run in pence: every line reconciles, two hold approval back. */
export function payroll(withIssues = true): PayrollLine[] {
  const line = (
    id: string,
    name: string,
    role: string,
    gross: number,
    rate: number,
    bankAccount: string | null,
  ): PayrollLine => {
    const deductions = Math.round(gross * rate);
    return {
      id,
      person: { name },
      role,
      gross,
      deductions,
      net: gross - deductions,
      employerCost: gross + Math.round(gross * 0.138) + Math.round(gross * 0.03),
      bankAccount,
    };
  };
  const lines = [
    line('pr1', 'Dana Whitfield', 'Chief Executive', 1_250_000, 0.38, '•• 4021'),
    line('pr2', 'Ines Carvalho', 'Senior Software Engineer', 641_667, 0.31, '•• 7720'),
    line('pr3', 'Tomasz Wrona', 'Engineering Manager', 716_667, 0.33, '•• 1184'),
    line('pr4', 'Amara Nwosu', 'People Partner', 412_500, 0.27, '•• 9035'),
    line('pr5', 'Felix Lindqvist', 'Product Designer', 487_500, 0.29, '•• 5561'),
    line('pr6', 'Priya Raman', 'Financial Analyst', 433_333, 0.28, withIssues ? null : '•• 3307'),
    line('pr7', 'Jonah Feld', 'Account Executive', 375_000, 0.26, '•• 6612'),
    line('pr8', 'Chiara Rossi', 'Success Manager', 358_333, 0.25, '•• 2290'),
    line('pr9', 'Kaito Ueda', 'Operations Analyst', 345_833, 0.25, '•• 8143'),
    line('pr10', 'Leila Haddad', 'Counsel', 595_833, 0.31, '•• 4478'),
    line('pr11', 'Bram Jansen', 'Software Engineer', 520_833, 0.29, '•• 0916'),
    line('pr12', 'Noor Iqbal', 'Support Lead', 395_833, 0.27, '•• 7354'),
  ];
  if (withIssues) {
    // A leaver whose final pay is less than what they owe back: net goes below zero.
    lines.push({
      id: 'pr13',
      person: { name: 'Soren Dahl' },
      role: 'Sales Manager (leaver)',
      gross: 120_000,
      deductions: 186_450,
      net: -66_450,
      employerCost: 139_160,
      bankAccount: '•• 5150',
    });
  }
  return lines;
}
