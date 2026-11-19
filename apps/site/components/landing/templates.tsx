import { readTemplates } from '@/lib/templates';

import { Section, SectionIntro } from './section';
import { TemplateGallery } from './template-gallery';

/**
 * The templates showcase: every template.json in the repo, read at build time, so a new template
 * shows up here without a landing change.
 */
export function Templates() {
  const templates = readTemplates();
  if (templates.length === 0) return null;
  return (
    <Section id="templates" className="flex flex-col gap-10 py-16 md:py-24">
      <SectionIntro
        eyebrow="Templates"
        title={
          <>
            <span className="font-regular">Start from a whole app,</span> not a blank page.
          </>
        }
      >
        Complete apps built only from the kit, with real data and every state. One command copies
        one into a new folder, as source you own.
      </SectionIntro>
      <TemplateGallery templates={templates} />
    </Section>
  );
}
