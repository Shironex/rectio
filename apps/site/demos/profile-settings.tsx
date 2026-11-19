'use client';

import { ProfileSettings, type ProfileValues } from '@rectio/blocks';
import { useState } from 'react';

export const PROFILE: ProfileValues & { avatarUrl?: string; emailVerified?: boolean } = {
  name: 'Ines Duarte',
  email: 'ines.duarte@fernhill.io',
  jobTitle: 'Head of finance operations',
  timeZone: 'Europe/Lisbon',
  emailVerified: false,
};

/** The app owns the saved profile; the block starts again from it after each save. */
export default function ProfileSettingsDemo() {
  const [profile, setProfile] = useState(PROFILE);
  const [pending, setPending] = useState(false);
  return (
    <div className="w-full">
      <ProfileSettings
        profile={profile}
        pending={pending}
        locale="en-GB"
        onSave={(values: ProfileValues) => {
          setPending(true);
          setTimeout(() => {
            setPending(false);
            setProfile({ ...profile, ...values });
          }, 700);
        }}
        onAvatarChange={(file) => {
          setProfile({ ...profile, avatarUrl: URL.createObjectURL(file) });
        }}
        onResendVerification={() => {
          console.info('verification link sent');
        }}
        onDeleteAccount={() => {
          console.info('delete account');
        }}
      />
    </div>
  );
}
