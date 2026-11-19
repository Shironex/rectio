import { createContext, use } from 'react';

/**
 * Closes the phone navigation sheet. `DocsHeader` provides it around the sheet, and `DocsSidebar`
 * calls it after a link press, so the sheet closes on navigation with any router.
 */
export const CloseNavContext = createContext<(() => void) | null>(null);

export function useCloseNav(): (() => void) | null {
  return use(CloseNavContext);
}
