export interface Piece {
  /** The literal as written, quotes included. */
  text: string;
  /** Where it starts in the file. */
  offset: number;
  /** The first argument of a selector method such as `querySelector`: a CSS selector, not classes. */
  selector: boolean;
}

/** String and template literal pieces of a TS or TSX file, found with the TypeScript scanner. */
export function stringPieces(text: string, jsx: boolean): Piece[];
