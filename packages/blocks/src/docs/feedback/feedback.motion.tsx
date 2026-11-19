import { motioned } from '../lib/motion-parts';
import { DocsFeedback as PlainDocsFeedback, type DocsFeedbackProps } from './feedback';

export type { DocsFeedbackProps };

/** DocsFeedback whose thanks fades in and whose send button presses with a spring. */
export const DocsFeedback = motioned<DocsFeedbackProps>(PlainDocsFeedback, 'DocsFeedback');
