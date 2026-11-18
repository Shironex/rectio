export interface Violation {
  /** Offset of the match in the scanned text. */
  index: number;
  /** The offending text. */
  match: string;
  /** Why it is not allowed, written for the person fixing it. */
  reason: string;
}

export function findDesignValueViolations(text: string): Violation[];
