import { motioned } from '../lib/motion-parts';
import { ContactSection as PlainContactSection, type ContactSectionProps } from './contact';

export type { ContactSectionProps };

/** ContactSection with entrances that play once, on first view; plain under reduced motion. */
export const ContactSection = motioned<ContactSectionProps>(PlainContactSection, 'ContactSection');
