'use client';

import { GithubLogoIcon, LinkedinLogoIcon, XLogoIcon } from '@phosphor-icons/react';
import {
  AnnouncementBar,
  CookieConsent,
  CookiePreferences,
  loadConsent,
  Newsletter,
  saveConsent,
  SiteFooter,
  SiteHeader,
  type ConsentRecord,
} from '@rectio/blocks/marketing/motion';
import { cn } from '@rectio/ui';
import { usePathname } from 'next/navigation';
import { useState, type ReactNode } from 'react';

import { COOKIE_CATEGORIES } from '@/data/cookies';
import {
  ANNOUNCEMENT,
  CONSENT_VERSION,
  FOOTER_COLUMNS,
  LEGAL_LINKS,
  NAV,
  SIGN_IN,
  SITE,
  START,
  STORAGE,
} from '@/data/site';
import { subscribe } from '@/lib/forms';
import { useStored, writeStored } from '@/lib/stored';

import { Brand } from './brand';
import { ThemeSwitch } from './theme-switch';

const SOCIAL = [
  { label: 'Rostra on LinkedIn', href: 'https://www.linkedin.com', icon: <LinkedinLogoIcon /> },
  { label: 'Rostra on X', href: 'https://x.com', icon: <XLogoIcon /> },
  { label: 'Rostra on GitHub', href: 'https://github.com', icon: <GithubLogoIcon /> },
];

/** The nav entry a path belongs to: `/blog/some-post` lights up Blog. */
function currentNav(pathname: string): string | undefined {
  return NAV.find((link) => pathname === link.href || pathname.startsWith(`${link.href}/`))?.href;
}

function useConsent() {
  const raw = useStored(STORAGE.consent);
  const consent =
    raw === undefined
      ? undefined
      : loadConsent({ getItem: (key) => (key === STORAGE.consent ? raw : null) }, STORAGE.consent);
  const save = (record: ConsentRecord) => {
    // saveConsent reports blocked storage; the choice still holds for this page view.
    saveConsent(
      {
        setItem: (key, value) => {
          writeStored(key, value);
        },
      },
      STORAGE.consent,
      record,
    );
  };
  return { consent, known: raw !== undefined, save };
}

/** Theme, colour mode and cookie choices, in the footer of every page. */
function SiteSettings({ onCookieSettings }: { onCookieSettings: () => void }) {
  return (
    <div className="flex flex-col gap-3 border-t border-line pt-6">
      <h3 className="text-sm font-strong text-fg">Appearance</h3>
      <ThemeSwitch />
      <button
        type="button"
        onClick={onCookieSettings}
        className={cn(
          'inline-flex min-h-(--rx-button-height-md) w-fit cursor-pointer items-center rounded-control text-sm text-fg-muted underline-offset-4',
          'pointer-fine:hover:text-fg pointer-fine:hover:underline pointer-coarse:min-h-(--rx-button-height-touch)',
          'outline-offset-2 focus-visible:outline-2 focus-visible:outline-focus',
        )}
      >
        Cookie settings
      </button>
    </div>
  );
}

/**
 * Everything around a page: the announcement, the header with its phone menu, the footer with the
 * newsletter, theme switch and cookie settings, and the cookie banner on a first visit.
 */
export function SiteShell({ children }: { children: ReactNode }) {
  const current = currentNav(usePathname());
  const dismissed = useStored(STORAGE.announcement) === ANNOUNCEMENT.id;
  const { consent, known, save } = useConsent();
  const [preferences, setPreferences] = useState(false);
  return (
    <>
      <a
        href="#main"
        className="sr-only z-50 rounded-control bg-surface-overlay px-4 py-2 text-fg shadow-overlay focus:not-sr-only focus:fixed focus:start-4 focus:top-4"
      >
        Skip to content
      </a>
      {!dismissed && (
        <div className="site-announcement">
          <AnnouncementBar
            tag={ANNOUNCEMENT.tag}
            message={ANNOUNCEMENT.message}
            action={ANNOUNCEMENT.action}
            onDismiss={() => {
              writeStored(STORAGE.announcement, ANNOUNCEMENT.id);
            }}
          />
        </div>
      )}
      <SiteHeader
        brand={<Brand />}
        brandLabel={`${SITE.name} home`}
        links={NAV}
        {...(current === undefined ? {} : { currentHref: current })}
        primary={START}
        secondary={SIGN_IN}
      />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter
        brand={<Brand />}
        brandLabel={`${SITE.name} home`}
        tagline={SITE.tagline}
        columns={FOOTER_COLUMNS}
        legal={LEGAL_LINKS}
        social={SOCIAL}
        copyright={`© 2026 ${SITE.legalName}`}
        extra={
          <div className="flex flex-col gap-6">
            <Newsletter
              layout="compact"
              title="The rota letter"
              description="One email a month on running fair schedules. No tracking pixels."
              onSubscribe={subscribe}
            />
            <SiteSettings
              onCookieSettings={() => {
                setPreferences(true);
              }}
            />
          </div>
        }
      />
      {known && (
        <CookieConsent
          categories={COOKIE_CATEGORIES}
          version={CONSENT_VERSION}
          consent={consent}
          policyHref="/cookies"
          onSave={save}
        />
      )}
      <CookiePreferences
        open={preferences}
        onOpenChange={setPreferences}
        categories={COOKIE_CATEGORIES}
        version={CONSENT_VERSION}
        consent={consent}
        policyHref="/cookies"
        onSave={(record) => {
          save(record);
          setPreferences(false);
        }}
      />
    </>
  );
}
