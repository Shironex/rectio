import { motioned } from '../lib/motion-parts';
import { LogoStrip as PlainLogoStrip, type LogoStripProps } from './logo-strip';

export type { LogoStripProps };

/** LogoStrip with entrances that play once, on first view; plain under reduced motion. */
export const LogoStrip = motioned<LogoStripProps>(PlainLogoStrip, 'LogoStrip');
