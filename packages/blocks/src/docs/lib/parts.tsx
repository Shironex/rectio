import { Button, TabsList } from '@rectio/ui';
import { createContext, use, type CSSProperties, type ElementType, type ReactNode } from 'react';

/**
 * The pieces of a docs block that move in the motion variant. A block draws these instead of
 * importing them, so one block body serves both variants: `@rectio/blocks/docs` renders it with
 * the plain parts, `@rectio/blocks/docs/motion` with the motioned ones. Apps never need this
 * context; they pick a variant by import path.
 */
export interface DocsParts {
  /** Form buttons. The motion parts press with a spring and morph into their loading state. */
  Button: typeof Button;
  /** The row of tabs. The motion parts glide the indicator to the new tab. */
  TabsList: typeof TabsList;
  /**
   * Content that arrives once. The motion parts fade it up the first time it scrolls into view;
   * with `stagger`, each direct child arrives a beat after the one before.
   */
  Reveal: (props: RevealProps) => ReactNode;
  /** The active marker of the table of contents. The motion parts glide it between headings. */
  Marker: (props: MarkerProps) => ReactNode;
  /** One state of a widget that changes in place. The motion parts fade the new state in. */
  Swap: (props: SwapProps) => ReactNode;
}

export interface RevealProps {
  children: ReactNode;
  className?: string | undefined;
  stagger?: boolean | undefined;
  as?: ElementType | undefined;
}

export interface MarkerProps {
  /** Distance from the top of the list and height of the active entry, in pixels. */
  top: number;
  height: number;
  className?: string | undefined;
}

export interface SwapProps {
  /** Changes when the state changes; the transition plays on every change. */
  swapKey: string;
  children: ReactNode;
  className?: string | undefined;
}

function PlainReveal({ children, className, as: Tag = 'div' }: RevealProps) {
  return <Tag className={className}>{children}</Tag>;
}

/**
 * A one pixel line scaled to the entry's height: only transform changes, so the motion variant can
 * glide it without animating a layout property.
 */
export function markerStyle(top: number, height: number): CSSProperties {
  return { transform: `translateY(${String(top)}px) scaleY(${String(height)})` };
}

function PlainMarker({ top, height, className }: MarkerProps) {
  return <span aria-hidden className={className} style={markerStyle(top, height)} />;
}

function PlainSwap({ children, className }: SwapProps) {
  return <div className={className}>{children}</div>;
}

export const PLAIN_DOCS_PARTS: DocsParts = {
  Button,
  TabsList,
  Reveal: PlainReveal,
  Marker: PlainMarker,
  Swap: PlainSwap,
};

const PartsContext = createContext<DocsParts>(PLAIN_DOCS_PARTS);

export function DocsPartsProvider({ parts, children }: { parts: DocsParts; children: ReactNode }) {
  return <PartsContext value={parts}>{children}</PartsContext>;
}

export function useDocsParts(): DocsParts {
  return use(PartsContext);
}
