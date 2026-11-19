import { ProfileSettings as PlainProfileSettings } from '@rectio/blocks';
import { ProfileSettings as MotionProfileSettings } from '@rectio/blocks/motion';
import { useState } from 'react';

import { NOW, type DemoProps } from './demo';

const PROFILE = {
  name: 'Ines Duarte',
  email: 'ines.duarte@fernhill.io',
  jobTitle: 'Head of finance operations',
  timeZone: 'Europe/Lisbon',
  emailVerified: false,
};

export function ProfileSettingsDemo({ motion, empty, locale }: DemoProps) {
  const ProfileSettings = motion ? MotionProfileSettings : PlainProfileSettings;
  const [profile, setProfile] = useState(
    empty ? { ...PROFILE, jobTitle: '', emailVerified: true } : PROFILE,
  );
  const [pending, setPending] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | undefined>(empty ? undefined : NOW);
  return (
    <ProfileSettings
      profile={profile}
      pending={pending}
      savedAt={savedAt}
      now={NOW}
      locale={locale}
      onAvatarChange={() => undefined}
      onAvatarRemove={() => undefined}
      onResendVerification={() => undefined}
      onDeleteAccount={() => undefined}
      onSave={(values) => {
        setPending(true);
        setTimeout(() => {
          setPending(false);
          setProfile({ ...profile, ...values });
          setSavedAt(new Date());
        }, 800);
      }}
    />
  );
}
