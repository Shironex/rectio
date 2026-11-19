import { motioned } from '../lib/motion-parts';
import { Changelog as PlainChangelog, type ChangelogProps } from './changelog';

export type { ChangelogProps };

/** Changelog whose releases fade up once, as each first scrolls into view. */
export const Changelog = motioned<ChangelogProps>(PlainChangelog, 'Changelog');
