import { motioned } from '../lib/motion-parts';
import { Team as PlainTeam, type TeamProps } from './team';

export type { TeamProps };

/** Team with entrances that play once, on first view; plain under reduced motion. */
export const Team = motioned<TeamProps>(PlainTeam, 'Team');
