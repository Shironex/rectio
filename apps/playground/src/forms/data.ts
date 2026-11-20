import type { FileUploadEntry } from '@rectio/ui';

export interface TimeZone {
  value: string;
  label: string;
  /** Offset from UTC in winter, shown as a hint. */
  offset: string;
}

export const TIME_ZONES: TimeZone[] = [
  { value: 'Europe/Lisbon', label: 'Lisbon', offset: 'UTC+0' },
  { value: 'Europe/London', label: 'London', offset: 'UTC+0' },
  { value: 'Europe/Warsaw', label: 'Warsaw', offset: 'UTC+1' },
  { value: 'Europe/Berlin', label: 'Berlin', offset: 'UTC+1' },
  { value: 'Europe/Paris', label: 'Paris', offset: 'UTC+1' },
  { value: 'Europe/Stockholm', label: 'Stockholm', offset: 'UTC+1' },
  { value: 'Europe/Vilnius', label: 'Vilnius', offset: 'UTC+2' },
  { value: 'Europe/Helsinki', label: 'Helsinki', offset: 'UTC+2' },
  { value: 'America/New_York', label: 'New York', offset: 'UTC-5' },
  { value: 'America/Toronto', label: 'Toronto', offset: 'UTC-5' },
  { value: 'Asia/Singapore', label: 'Singapore', offset: 'UTC+8' },
];

export const CURRENCIES = [
  { value: 'EUR', label: 'Euro', name: 'Euro' },
  { value: 'CHF', label: 'Swiss franc', name: 'Swiss franc' },
  { value: 'GBP', label: 'Pound sterling', name: 'Pound sterling' },
  { value: 'SEK', label: 'Swedish krona', name: 'Swedish krona' },
  { value: 'USD', label: 'US dollar', name: 'US dollar' },
];

export interface Member {
  value: string;
  label: string;
}

export const MEMBERS: Member[] = [
  { value: 'isla', label: 'Isla Fraser' },
  { value: 'ben', label: 'Ben Okafor' },
  { value: 'chloe', label: 'Chloe Martin' },
  { value: 'dev', label: 'Dev Patel' },
  { value: 'eva', label: 'Eva Lindqvist' },
  { value: 'tomas', label: 'Tomas Jurgaitis' },
];

/** Documents already on the workspace, one still uploading and one failed, so every row shows. */
export const RECEIPTS: FileUploadEntry[] = [
  {
    id: 'policy',
    name: 'travel-policy-2026.pdf',
    size: 1.8 * 1024 * 1024,
    type: 'application/pdf',
    status: 'done',
  },
  {
    id: 'per-diem',
    name: 'per-diem-rates.pdf',
    size: 640 * 1024,
    type: 'application/pdf',
    status: 'uploading',
    progress: 64,
  },
  {
    id: 'card',
    name: 'card-terms-scan.jpg',
    size: 4.2 * 1024 * 1024,
    type: 'image/jpeg',
    status: 'error',
    error: 'The connection dropped. Try again.',
  },
];
