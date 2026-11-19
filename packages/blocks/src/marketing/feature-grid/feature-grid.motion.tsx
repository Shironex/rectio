import { motioned } from '../lib/motion-parts';
import {
  FeatureIconGrid as PlainFeatureIconGrid,
  FeatureRows as PlainFeatureRows,
  FeatureBento as PlainFeatureBento,
  type FeatureIconGridProps,
  type FeatureRowsProps,
  type FeatureBentoProps,
} from './feature-grid';

export type { FeatureIconGridProps, FeatureRowsProps, FeatureBentoProps };

/** FeatureIconGrid with entrances that play once, on first view; plain under reduced motion. */
export const FeatureIconGrid = motioned<FeatureIconGridProps>(
  PlainFeatureIconGrid,
  'FeatureIconGrid',
);
/** FeatureRows with entrances that play once, on first view; plain under reduced motion. */
export const FeatureRows = motioned<FeatureRowsProps>(PlainFeatureRows, 'FeatureRows');
/** FeatureBento with entrances that play once, on first view; plain under reduced motion. */
export const FeatureBento = motioned<FeatureBentoProps>(PlainFeatureBento, 'FeatureBento');
