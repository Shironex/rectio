'use client';

import { type ProfileValues } from '@rectio/blocks';
import { ProfileSettings } from '@rectio/blocks/motion';
import { useState } from 'react';

import { PROFILE } from './profile-settings';

export default function ProfileSettingsMotionDemo() {
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
        onDeleteAccount={() => {
          console.info('delete account');
        }}
      />
    </div>
  );
}
