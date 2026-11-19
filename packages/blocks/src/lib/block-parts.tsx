import { Button, Money, TableRow } from '@rectio/ui';
import { createContext, use, type ComponentProps, type ReactNode } from 'react';

/**
 * The pieces of a block that move in the motion variant. A block draws these instead of importing
 * them, so one block body serves both variants: `@rectio/blocks` renders it with the plain parts,
 * `@rectio/blocks/motion` with the motioned ones. Apps never need this context; they pick a
 * variant by import path.
 */
export interface BlockParts {
  Button: typeof Button;
  Money: typeof Money;
  /** The block's body. The motion parts fade it up once, the first time it scrolls into view. */
  Reveal: (props: { children: ReactNode; className?: string }) => ReactNode;
  /**
   * A chart's plot. The motion parts grow its bars from the zero line and fade its lines in, once,
   * on first view; later data changes redraw in place.
   */
  ChartStage: (props: { children: ReactNode; className?: string }) => ReactNode;
  /** A body of rows that can leave, such as requests leaving the pending queue. */
  Rows: (props: { children: ReactNode }) => ReactNode;
  Row: (props: ComponentProps<'tr'>) => ReactNode;
}

function Passthrough({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}

export const PLAIN_PARTS: BlockParts = {
  Button,
  Money,
  Reveal: Passthrough,
  ChartStage: Passthrough,
  Rows: ({ children }) => children,
  Row: TableRow,
};

const PartsContext = createContext<BlockParts>(PLAIN_PARTS);

export function BlockPartsProvider({
  parts,
  children,
}: {
  parts: BlockParts;
  children: ReactNode;
}) {
  return <PartsContext value={parts}>{children}</PartsContext>;
}

export function useBlockParts(): BlockParts {
  return use(PartsContext);
}
