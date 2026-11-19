'use client';

import {
  COOKIE_POLICY_TEMPLATE,
  LegalPage,
  PRIVACY_POLICY_TEMPLATE,
  templateSections,
  TERMS_TEMPLATE,
} from '@rectio/blocks/marketing/motion';

import { SITE } from '@/data/site';

const TEMPLATES = {
  privacy: PRIVACY_POLICY_TEMPLATE,
  terms: TERMS_TEMPLATE,
  cookies: COOKIE_POLICY_TEMPLATE,
};

export type LegalDoc = keyof typeof TEMPLATES;

/**
 * A legal page from the kit's starting structures. The template notice stays at the top, saying the
 * text is a placeholder and not legal advice, until `template` is turned off with your own text in.
 */
export function LegalDocPage({ doc }: { doc: LegalDoc }) {
  const template = TEMPLATES[doc];
  return (
    <LegalPage
      template
      title={template.title}
      intro={template.intro}
      lastUpdated="2026-11-01"
      sections={templateSections(template)}
      contact={
        <p>
          Questions about this page? Write to{' '}
          <a href={`mailto:${SITE.email.privacy}`}>{SITE.email.privacy}</a>.
        </p>
      }
      locale="en-GB"
    />
  );
}
