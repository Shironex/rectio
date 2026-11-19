import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import {
  ProfileSettings,
  profileChanges,
  profileDeleteConfirmed,
  profileEmailChanged,
  profileErrors,
  timeZoneLabel,
} from '../../src/index';

const NOW = new Date(2026, 2, 19, 14, 20);
const PROFILE = {
  name: 'Ines Duarte',
  email: 'ines@fernhill.io',
  jobTitle: 'Head of finance operations',
  timeZone: 'Europe/Lisbon',
};

describe('profile rules', () => {
  it('needs a name and a valid email', () => {
    expect(profileErrors({ ...PROFILE, name: ' ', email: 'ines@' })).toEqual({
      name: 'Enter the name your team knows you by.',
      email: 'Enter an email address like name@company.com.',
    });
    expect(profileErrors(PROFILE)).toEqual({});
  });

  it('lists the changed fields, spaces aside', () => {
    expect(profileChanges(PROFILE, { ...PROFILE, name: 'Ines Duarte ' })).toEqual([]);
    expect(
      profileChanges(PROFILE, { ...PROFILE, jobTitle: 'CFO', timeZone: 'Europe/Warsaw' }),
    ).toEqual(['jobTitle', 'timeZone']);
    expect(profileEmailChanged(PROFILE, { ...PROFILE, email: 'INES@fernhill.io' })).toBe(false);
  });

  it('confirms a delete only with the email typed back', () => {
    expect(profileDeleteConfirmed('ines@fernhill.io', ' INES@fernhill.io')).toBe(true);
    expect(profileDeleteConfirmed('ines@fernhill.io', 'ines')).toBe(false);
    expect(profileDeleteConfirmed('', '')).toBe(false);
  });

  it('labels a time zone with its offset', () => {
    expect(timeZoneLabel('Europe/Warsaw', NOW, 'en-GB')).toBe('Warsaw (GMT+1)');
    expect(timeZoneLabel('America/Los_Angeles', NOW, 'en-GB')).toBe('Los Angeles (GMT-7)');
  });
});

describe('ProfileSettings', () => {
  it('saves only what changed, and discards back to the saved profile', async () => {
    const onSave = vi.fn();
    render(<ProfileSettings profile={PROFILE} onSave={onSave} now={NOW} locale="en-GB" />);
    const title = screen.getByLabelText(/Job title/);
    await userEvent.clear(title);
    await userEvent.type(title, 'Finance lead');
    expect(screen.getByText('1 unsaved change')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(onSave).toHaveBeenCalledWith({ ...PROFILE, jobTitle: 'Finance lead' }, ['jobTitle']);
    await userEvent.click(screen.getByRole('button', { name: 'Discard' }));
    expect(title).toHaveValue(PROFILE.jobTitle);
  });

  it('refuses to save without a name', async () => {
    const onSave = vi.fn();
    render(<ProfileSettings profile={PROFILE} onSave={onSave} now={NOW} />);
    await userEvent.clear(screen.getByLabelText('Full name'));
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByText('Enter the name your team knows you by.')).toBeInTheDocument();
  });

  it('deletes the account only after the email is typed back', async () => {
    const onDeleteAccount = vi.fn();
    render(
      <ProfileSettings
        profile={PROFILE}
        onSave={vi.fn()}
        onDeleteAccount={onDeleteAccount}
        now={NOW}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Delete account' }));
    const dialog = await screen.findByRole('dialog');
    const confirm = within(dialog).getByRole('button', { name: 'Delete account' });
    expect(confirm).toBeDisabled();
    await userEvent.type(within(dialog).getByLabelText('Your email address'), 'ines@fernhill.io');
    await userEvent.click(confirm);
    expect(onDeleteAccount).toHaveBeenCalled();
  });

  it('marks an unverified email and offers the link again', async () => {
    const onResendVerification = vi.fn();
    render(
      <ProfileSettings
        profile={{ ...PROFILE, emailVerified: false }}
        onSave={vi.fn()}
        onResendVerification={onResendVerification}
        now={NOW}
      />,
    );
    expect(screen.getByText('Not verified.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Resend the link' }));
    expect(onResendVerification).toHaveBeenCalled();
  });

  it('says when the profile was last saved', () => {
    render(
      <ProfileSettings
        profile={{
          name: 'Ines Duarte',
          email: 'ines@fernhill.io',
          jobTitle: '',
          timeZone: 'Europe/Lisbon',
        }}
        savedAt={new Date(2026, 10, 19, 14, 32)}
        locale="en-GB"
        onSave={vi.fn()}
      />,
    );
    expect(screen.getByText('Saved at 14:32')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Save changes' })).not.toBeInTheDocument();
  });
});
