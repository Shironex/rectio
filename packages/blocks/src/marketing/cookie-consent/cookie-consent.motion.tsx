import { motioned } from '../lib/motion-parts';
import {
  CookieConsent as PlainCookieConsent,
  CookiePreferences as PlainCookiePreferences,
  type CookieConsentProps,
  type CookiePreferencesProps,
} from './cookie-consent';

export type { CookieConsentProps, CookiePreferencesProps };

/** CookieConsent with entrances that play once, on first view; plain under reduced motion. */
export const CookieConsent = motioned<CookieConsentProps>(PlainCookieConsent, 'CookieConsent');
/** CookiePreferences with entrances that play once, on first view; plain under reduced motion. */
export const CookiePreferences = motioned<CookiePreferencesProps>(
  PlainCookiePreferences,
  'CookiePreferences',
);
