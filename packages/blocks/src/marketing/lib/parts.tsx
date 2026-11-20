import { Button } from './client-button';
import * as React from 'react';
import type { ElementType, ReactNode } from 'react';

/**
 * The pieces of a marketing block that move in the motion variant. A block draws these instead of
 * importing them, so one block body serves both variants: `@rectio/blocks/marketing` renders it
 * with the plain parts, `@rectio/blocks/marketing/motion` with the motioned ones. Apps never need
 * this context; they pick a variant by import path.
 */
export interface MarketingParts {
  /** Form buttons. The motion parts press with a spring and morph into their loading state. */
  Button: typeof Button;
  /**
   * A section's content. The motion parts fade it up once, the first time it scrolls into view;
   * with `stagger`, each direct child arrives a beat after the one before.
   */
  Reveal: (props: RevealProps) => ReactNode;
  /** A figure such as a stat. The motion parts count up to it once, on first view. */
  Count: (props: CountProps) => ReactNode;
  /** One word of a cycling headline. The motion parts slide the new word up as the old one leaves. */
  Swap: (props: SwapProps) => ReactNode;
}

export interface RevealProps {
  children: ReactNode;
  className?: string | undefined;
  /** Animate each direct child in turn instead of the whole. */
  stagger?: boolean | undefined;
  /** The element to render, such as `ul` for a list of features. */
  as?: ElementType | undefined;
}

export interface CountProps {
  /** The final figure. It is exact from the first frame for assistive technology. */
  value: number;
  format: (value: number) => string;
  className?: string | undefined;
}

export interface SwapProps {
  /** Changes when the word changes; the transition plays on every change. */
  swapKey: string;
  children: ReactNode;
  className?: string | undefined;
}

function PlainReveal({ children, className, as: Tag = 'div' }: RevealProps) {
  return <Tag className={className}>{children}</Tag>;
}

function PlainCount({ value, format, className }: CountProps) {
  return <span className={className}>{format(value)}</span>;
}

/** Plain words change in place; the cycling headline reserves the widest word's width. */
function PlainSwap({ children, className }: SwapProps) {
  return <span className={className}>{children}</span>;
}

export const PLAIN_MARKETING_PARTS: MarketingParts = {
  Button,
  Reveal: PlainReveal,
  Count: PlainCount,
  Swap: PlainSwap,
};

// A server component has no context (React's server build ships no createContext): a block
// rendered there draws the plain parts, and only a client tree can swap in the motion ones. The
// namespace read keeps this module importable from both, so static blocks stay server components.
const PartsContext =
  typeof React.createContext === 'function'
    ? React.createContext<MarketingParts>(PLAIN_MARKETING_PARTS)
    : undefined;

export function MarketingPartsProvider({
  parts,
  children,
}: {
  parts: MarketingParts;
  children: ReactNode;
}) {
  if (PartsContext === undefined) return children;
  return <PartsContext value={parts}>{children}</PartsContext>;
}

export function useMarketingParts(): MarketingParts {
  return PartsContext === undefined ? PLAIN_MARKETING_PARTS : React.use(PartsContext);
}
