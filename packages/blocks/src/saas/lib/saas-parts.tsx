import { createContext, use, type ComponentProps, type ReactNode } from 'react';

/**
 * The list pieces of a SaaS block that move in the motion variant, beside the shared block parts:
 * items that arrive and leave, such as a notification marked read or a card moved to another
 * column. A block draws these instead of a bare `li`, so one body serves both variants.
 */
export interface SaasParts {
  /** A list whose items can leave. Items present on the first render never animate in. */
  Items: (props: { children: ReactNode }) => ReactNode;
  Item: (props: ComponentProps<'li'>) => ReactNode;
}

export const PLAIN_SAAS_PARTS: SaasParts = {
  Items: ({ children }) => children,
  Item: (props) => <li {...props} />,
};

const SaasPartsContext = createContext<SaasParts>(PLAIN_SAAS_PARTS);

export function SaasPartsProvider({ parts, children }: { parts: SaasParts; children: ReactNode }) {
  return <SaasPartsContext value={parts}>{children}</SaasPartsContext>;
}

export function useSaasParts(): SaasParts {
  return use(SaasPartsContext);
}
