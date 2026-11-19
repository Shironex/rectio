'use client';

import { Section, SectionHeader } from '@rectio/blocks/marketing/motion';
import type { ReactNode } from 'react';

/**
 * The top of an inner page: its one h1, a sentence under it and anything that belongs with them,
 * such as a billing switch or a filter. The soft accent wash ties it to the home hero.
 */
export function PageIntro({
  title,
  description,
  eyebrow,
  align = 'start',
  children,
}: {
  title: ReactNode;
  description?: ReactNode;
  eyebrow?: ReactNode;
  align?: 'start' | 'center';
  children?: ReactNode;
}) {
  return (
    <Section
      tone="plain"
      width="wide"
      labelledBy="page-title"
      className="pt-12 pb-10 sm:pt-16 sm:pb-14"
    >
      <SectionHeader
        id="page-title"
        level={1}
        size="xl"
        align={align}
        title={title}
        description={description}
        eyebrow={eyebrow}
      >
        {children}
      </SectionHeader>
    </Section>
  );
}
