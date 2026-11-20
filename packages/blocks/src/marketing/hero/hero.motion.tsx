'use client';

import { motioned } from '../lib/motion-parts';
import {
  HeroCentered as PlainHeroCentered,
  HeroSplit as PlainHeroSplit,
  HeroFloating as PlainHeroFloating,
  type HeroCenteredProps,
  type HeroSplitProps,
  type HeroFloatingProps,
} from './hero';
import { HeroWordCycle as PlainHeroWordCycle, type HeroWordCycleProps } from './hero-word-cycle';

export type { HeroCenteredProps, HeroSplitProps, HeroFloatingProps, HeroWordCycleProps };

/** HeroCentered with entrances that play once, on first view; plain under reduced motion. */
export const HeroCentered = motioned<HeroCenteredProps>(PlainHeroCentered, 'HeroCentered');
/** HeroSplit with entrances that play once, on first view; plain under reduced motion. */
export const HeroSplit = motioned<HeroSplitProps>(PlainHeroSplit, 'HeroSplit');
/** HeroFloating with entrances that play once, on first view; plain under reduced motion. */
export const HeroFloating = motioned<HeroFloatingProps>(PlainHeroFloating, 'HeroFloating');
/** HeroWordCycle with entrances that play once, on first view; plain under reduced motion. */
export const HeroWordCycle = motioned<HeroWordCycleProps>(PlainHeroWordCycle, 'HeroWordCycle');
