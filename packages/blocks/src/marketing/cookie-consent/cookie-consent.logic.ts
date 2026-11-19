/**
 * Consent decisions as data: what the visitor chose, for which version of your cookie list, and
 * when. Keep the record as proof of consent and ask again when the version changes.
 */
export interface CookieCategory {
  id: string;
  title: string;
  description: string;
  /** Needed for the site to work: always on, and never asked about. */
  required?: boolean;
}

export interface ConsentRecord {
  /** The version of your cookie list the visitor decided on. Bump it when the list changes. */
  version: string;
  /** ISO timestamp of the decision. */
  decidedAt: string;
  /** Every category's state; required categories are always true. */
  choices: Record<string, boolean>;
}

function record(
  categories: readonly CookieCategory[],
  version: string,
  pick: (category: CookieCategory) => boolean,
  now: Date,
): ConsentRecord {
  return {
    version,
    decidedAt: now.toISOString(),
    choices: Object.fromEntries(
      categories.map((category) => [category.id, category.required === true || pick(category)]),
    ),
  };
}

/** Every category on. */
export function acceptAll(
  categories: readonly CookieCategory[],
  version: string,
  now = new Date(),
): ConsentRecord {
  return record(categories, version, () => true, now);
}

/** Only the required categories on: the same weight and the same one press as accepting. */
export function rejectAll(
  categories: readonly CookieCategory[],
  version: string,
  now = new Date(),
): ConsentRecord {
  return record(categories, version, () => false, now);
}

/** The visitor's own choices; a category they never touched stays off. */
export function chooseConsent(
  categories: readonly CookieCategory[],
  choices: Readonly<Record<string, boolean>>,
  version: string,
  now = new Date(),
): ConsentRecord {
  return record(categories, version, (category) => choices[category.id] === true, now);
}

/** The starting state of the preferences: the saved choices, or required only. */
export function initialChoices(
  categories: readonly CookieCategory[],
  saved: ConsentRecord | null | undefined,
): Record<string, boolean> {
  return Object.fromEntries(
    categories.map((category) => [
      category.id,
      category.required === true || saved?.choices[category.id] === true,
    ]),
  );
}

/** True when a saved decision covers this version of the list, so the banner can stay away. */
export function hasDecided(saved: ConsentRecord | null | undefined, version: string): boolean {
  return saved?.version === version;
}

/** Whether a category may run: only with a current decision that allows it. */
export function isAllowed(
  saved: ConsentRecord | null | undefined,
  categoryId: string,
  version: string,
): boolean {
  return hasDecided(saved, version) && saved?.choices[categoryId] === true;
}

function isRecord(value: unknown): value is ConsentRecord {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as { version?: unknown; decidedAt?: unknown; choices?: unknown };
  const choices = candidate.choices;
  return (
    typeof candidate.version === 'string' &&
    typeof candidate.decidedAt === 'string' &&
    typeof choices === 'object' &&
    choices !== null &&
    Object.values(choices).every((choice) => typeof choice === 'boolean')
  );
}

/**
 * Reads a saved decision from storage such as `localStorage`; null when there is none, it is
 * unreadable, or storage is blocked.
 */
export function loadConsent(storage: Pick<Storage, 'getItem'>, key: string): ConsentRecord | null {
  try {
    const raw = storage.getItem(key);
    if (raw === null) return null;
    const parsed: unknown = JSON.parse(raw);
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/** Writes a decision to storage; returns false when storage is full or blocked. */
export function saveConsent(
  storage: Pick<Storage, 'setItem'>,
  key: string,
  consent: ConsentRecord,
): boolean {
  try {
    storage.setItem(key, JSON.stringify(consent));
    return true;
  } catch {
    return false;
  }
}
