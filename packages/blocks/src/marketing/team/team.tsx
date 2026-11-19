import { cn } from '@rectio/ui';
import type { ReactNode } from 'react';

import { Anchor, linkFocus, type MarketingLink } from '../lib/action';
import { Avatar } from '../lib/avatar';
import { useMarketingParts } from '../lib/parts';
import { Section, SectionHeader, useHeadingId, type SectionTone } from '../lib/section';

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  /** A photo. Without one their initials show on a soft tint. */
  avatar?: string;
  /** A sentence about what they do. */
  bio?: string;
  links?: readonly MarketingLink[];
}

export interface TeamValue {
  id: string;
  title: string;
  description: ReactNode;
}

export interface TeamProps {
  title: ReactNode;
  description?: ReactNode;
  eyebrow?: ReactNode;
  members: readonly TeamMember[];
  /** What the team believes or works by, shown as a short ruled list before the people. */
  values?: readonly TeamValue[];
  tone?: SectionTone;
  className?: string;
}

/**
 * An about section: who the team is, what it works by, and the people, each with their role and a
 * line on what they do.
 */
export function Team({ title, description, eyebrow, members, values, tone, className }: TeamProps) {
  const { Reveal } = useMarketingParts();
  const headingId = useHeadingId();
  return (
    <Section tone={tone} width="wide" labelledBy={headingId} className={className}>
      <SectionHeader id={headingId} title={title} description={description} eyebrow={eyebrow} />
      {values !== undefined && values.length > 0 && (
        <Reveal
          as="dl"
          stagger
          className="mt-12 grid gap-8 border-t border-line pt-10 @3xl:grid-cols-3"
        >
          {values.map((value) => (
            <div key={value.id} className="flex flex-col gap-2">
              <dt className="text-lg font-strong text-fg">{value.title}</dt>
              <dd className="text-base text-pretty text-fg-muted">{value.description}</dd>
            </div>
          ))}
        </Reveal>
      )}
      <Reveal
        as="ul"
        stagger
        aria-label="Team"
        className={cn(
          'grid grid-cols-1 gap-x-8 gap-y-12 @lg:grid-cols-2 @4xl:grid-cols-4',
          values !== undefined && values.length > 0 ? 'mt-16' : 'mt-12',
        )}
      >
        {members.map((member) => (
          <li key={member.id} className="flex flex-col gap-4">
            <Avatar name={member.name} src={member.avatar} size="lg" />
            <div className="flex flex-col gap-1">
              <h3 className="text-lg font-strong text-fg">{member.name}</h3>
              <p className="text-base text-accent-strong">{member.role}</p>
            </div>
            {member.bio !== undefined && (
              <p className="text-base text-pretty text-fg-muted">{member.bio}</p>
            )}
            {member.links !== undefined && member.links.length > 0 && (
              <ul className="flex flex-wrap gap-x-4 gap-y-1">
                {member.links.map((link) => (
                  <li key={link.href}>
                    <Anchor
                      href={link.href}
                      external={link.external}
                      aria-label={`${link.label}, ${member.name}`}
                      className={cn(
                        'inline-flex min-h-8 items-center text-sm text-fg-muted underline underline-offset-4 pointer-fine:hover:text-fg pointer-coarse:min-h-(--rx-button-height-touch)',
                        linkFocus,
                      )}
                    >
                      {link.label}
                    </Anchor>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </Reveal>
    </Section>
  );
}
