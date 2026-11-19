import { ProfileSettings as PlainProfileSettings } from '@rectio/blocks';
import { ProfileSettings as MotionProfileSettings } from '@rectio/blocks/motion';
import { useState } from 'react';

import { NOW, type DemoProps } from './demo';

/** A drawn portrait for the demo, so the filled state shows a real picture and the empty one initials. */
const PORTRAIT = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><rect width="80" height="80" fill="#c9d6c3"/><circle cx="40" cy="32" r="14" fill="#5b6b55"/><path d="M14 80c2-16 12-24 26-24s24 8 26 24z" fill="#3f4c3b"/></svg>',
)}`;

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
    empty ? { ...PROFILE, jobTitle: '', emailVerified: true } : { ...PROFILE, avatarUrl: PORTRAIT },
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
