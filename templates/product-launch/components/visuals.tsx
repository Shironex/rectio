'use client';

import { MagnifyingGlassIcon, QuotesIcon, WaveformIcon } from '@phosphor-icons/react';
import { AvatarGroup, Badge, cn } from '@rectio/ui';
import { useState } from 'react';

import { INTERVIEW, THEMES_FOUND } from '@/data/launch';

/**
 * Pieces of the product, built from rectio components. The tags in the interview can be switched
 * on and off, the theme list filters the quotes: small, but real.
 */

export function InterviewBoard({ className }: { className?: string }) {
  const [active, setActive] = useState<string | null>(null);
  return (
    <div className={cn('@container', className)}>
      <div className="grid overflow-hidden rounded-panel border border-line bg-surface text-fg @2xl:grid-cols-5">
        <div className="flex flex-col gap-4 border-line p-5 @2xl:col-span-3 @2xl:border-e">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-control bg-accent-subtle text-accent-strong">
              <WaveformIcon aria-hidden weight="bold" className="size-5" />
            </span>
            <div className="flex min-w-0 flex-col">
              <span className="truncate font-medium">{INTERVIEW.title}</span>
              <span className="text-sm text-fg-muted">{INTERVIEW.meta}</span>
            </div>
          </div>
          <ol className="flex flex-col gap-3">
            {INTERVIEW.lines.map((line) => {
              const dim = active !== null && line.theme !== active;
              return (
                <li
                  key={line.id}
                  className={cn(
                    'flex gap-3 transition-opacity duration-fast ease-standard',
                    dim && 'opacity-40',
                  )}
                >
                  <span className="numeric w-10 shrink-0 pt-0.5 text-xs text-fg-subtle">
                    {line.time}
                  </span>
                  <p className="text-sm text-pretty text-fg">
                    {line.before}
                    <mark className="rounded-badge bg-accent-subtle px-0.5 text-fg">
                      {line.highlight}
                    </mark>
                    {line.after}
                  </p>
                </li>
              );
            })}
          </ol>
        </div>
        <div className="flex flex-col gap-3 border-t border-line bg-surface-sunken p-5 @2xl:col-span-2 @2xl:border-t-0">
          <span className="text-sm font-medium text-fg-muted">Themes across 12 interviews</span>
          <ul className="flex flex-col gap-1">
            {THEMES_FOUND.map((theme) => {
              const on = active === theme.id;
              return (
                <li key={theme.id}>
                  <button
                    type="button"
                    aria-pressed={on}
                    onClick={() => {
                      setActive(on ? null : theme.id);
                    }}
                    className={cn(
                      'flex min-h-(--rx-button-height-md) w-full cursor-pointer items-center justify-between gap-3 rounded-control px-2.5 text-start text-sm',
                      'transition-colors duration-fast ease-standard pointer-coarse:min-h-(--rx-button-height-touch)',
                      'outline-offset-2 focus-visible:outline-2 focus-visible:outline-focus',
                      on
                        ? 'bg-surface-selected text-fg'
                        : 'text-fg pointer-fine:hover:bg-surface-hover',
                    )}
                  >
                    <span className="truncate">{theme.label}</span>
                    <span className="numeric shrink-0 text-xs text-fg-muted">
                      {theme.quotes} quotes
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}

export function EvidenceCard() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 text-sm text-fg-muted">
          <QuotesIcon aria-hidden weight="fill" className="size-4" />
          Evidence
        </span>
        <Badge tone="positive">Strong</Badge>
      </div>
      <p className="font-medium text-pretty text-fg">Admins give up when invites need IT.</p>
      <div className="flex items-center justify-between gap-3">
        <AvatarGroup
          label="Teams quoted"
          size="sm"
          items={[{ name: 'Sofie Lund' }, { name: 'Kwame Asante' }, { name: 'Ines Moreau' }]}
        />
        <span className="text-sm text-fg-muted">9 quotes, 7 teams</span>
      </div>
    </div>
  );
}

export function SearchCard() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex h-(--rx-button-height-md) items-center gap-2 rounded-control border border-line bg-surface px-3 text-sm text-fg-muted">
        <MagnifyingGlassIcon aria-hidden weight="bold" className="size-4" />
        <span className="text-fg">why did they switch</span>
      </div>
      <ul className="flex flex-col gap-2 text-sm">
        <li className="flex justify-between gap-3">
          <span className="truncate text-fg">“The old tool lost our notes…”</span>
          <span className="numeric shrink-0 text-fg-subtle">12:40</span>
        </li>
        <li className="flex justify-between gap-3">
          <span className="truncate text-fg">“Our PM could never find the call…”</span>
          <span className="numeric shrink-0 text-fg-subtle">03:15</span>
        </li>
      </ul>
    </div>
  );
}

export function TagCloud() {
  return (
    <ul aria-label="Tags" className="flex flex-wrap gap-2">
      {THEMES_FOUND.map((theme) => (
        <li key={theme.id}>
          <Badge tone="info">{theme.label}</Badge>
        </li>
      ))}
    </ul>
  );
}
