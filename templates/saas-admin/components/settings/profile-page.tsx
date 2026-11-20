'use client';

import type { ProfileValues } from '@rectio/blocks';
import { ProfileSettings } from '@rectio/blocks/motion';
import { useToast } from '@rectio/ui';
import { useState } from 'react';

import { CURRENT_USER, LOCALE, NOW } from '@/data/workspace';
import { ErrorPanel, LoadingPanel, LoadingRegion } from '../states/state-views';
import { usePageState } from '../use-page-state';
import { SettingsFrame } from './settings-frame';

const TIME_ZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/Lisbon',
  'Europe/London',
];

/**
 * Save the profile here: send the changed fields to your API and resolve once they are stored.
 * The sample waits a moment so the saving state shows.
 */
async function saveProfile(values: ProfileValues): Promise<ProfileValues> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return values;
}

export function ProfilePage() {
  const state = usePageState();
  const toast = useToast();
  const [profile, setProfile] = useState<ProfileValues & { emailVerified: boolean }>({
    name: CURRENT_USER.name,
    email: CURRENT_USER.email,
    jobTitle: CURRENT_USER.role,
    timeZone: 'America/New_York',
    emailVerified: true,
  });
  const [pending, setPending] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | undefined>(undefined);

  return (
    <SettingsFrame title="Profile" description="How you appear to your team and to customers">
      {state === 'loading' ? (
        <LoadingRegion label="Loading your profile">
          <LoadingPanel kind="list" rows={4} />
        </LoadingRegion>
      ) : state === 'error' ? (
        <ErrorPanel title="Your profile did not load" />
      ) : (
        <ProfileSettings
          title="Name and contact"
          profile={profile}
          timeZones={TIME_ZONES}
          now={NOW}
          locale={LOCALE}
          pending={pending}
          savedAt={savedAt}
          onSave={(values, changed) => {
            setPending(true);
            void saveProfile(values).then((saved) => {
              setPending(false);
              setSavedAt(new Date());
              setProfile((p) => ({
                ...saved,
                emailVerified: changed.includes('email') ? false : p.emailVerified,
              }));
            });
          }}
          onAvatarChange={() => {
            toast.add({ title: 'Picture uploaded' });
          }}
          onResendVerification={() => {
            toast.add({ title: 'Verification link sent', description: profile.email });
          }}
          onDeleteAccount={() => {
            toast.add({
              type: 'error',
              title: 'Hand over the workspace first',
              description: 'An owner can only leave once another owner is set.',
            });
          }}
        />
      )}
    </SettingsFrame>
  );
}
