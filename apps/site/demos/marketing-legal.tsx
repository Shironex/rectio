'use client';

import { LegalPage, PRIVACY_POLICY_TEMPLATE, templateSections } from '@rectio/blocks/marketing';

export default function LegalDemo() {
  return (
    <div className="w-full">
      <LegalPage
        title={PRIVACY_POLICY_TEMPLATE.title}
        intro={PRIVACY_POLICY_TEMPLATE.intro}
        lastUpdated="2026-03-04"
        sections={templateSections(PRIVACY_POLICY_TEMPLATE)}
        template
        locale="en-GB"
      />
    </div>
  );
}
