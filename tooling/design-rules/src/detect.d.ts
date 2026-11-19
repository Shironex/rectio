export interface Violation {
  /** Offset of the match in the scanned text. */
  index: number;
  /** The offending text. */
  match: string;
  /** Why it is not allowed, written for the person fixing it. */
  reason: string;
}

/** DOM methods whose first argument is a CSS selector. */
export const SELECTOR_METHODS: ReadonlySet<string>;

/**
 * `selector`: the text is a CSS selector passed to one of `SELECTOR_METHODS`, so brackets are
 * attribute selectors, not arbitrary Tailwind values. Every other check still runs.
 */
export function findDesignValueViolations(
  text: string,
  options?: { selector?: boolean },
): Violation[];
