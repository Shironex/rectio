import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import {
  TwoFactor,
  backupCodeError,
  formatTwoFactorWait,
  maskTwoFactorDestination,
  normalizeBackupCode,
  twoFactorCodeComplete,
  twoFactorInstruction,
  twoFactorResendWait,
} from '../../src/index';

describe('two-factor rules', () => {
  it('knows a complete code', () => {
    expect(twoFactorCodeComplete('123456')).toBe(true);
    expect(twoFactorCodeComplete('12345')).toBe(false);
    expect(twoFactorCodeComplete('12a456')).toBe(false);
    expect(twoFactorCodeComplete('1234', 4)).toBe(true);
  });

  it('counts down to the next resend', () => {
    const sent = new Date(2026, 2, 19, 14, 20, 0);
    expect(twoFactorResendWait(sent, new Date(2026, 2, 19, 14, 20, 12))).toBe(18);
    expect(twoFactorResendWait(sent, new Date(2026, 2, 19, 14, 21, 0))).toBe(0);
    expect(twoFactorResendWait(undefined, sent)).toBe(0);
    expect(formatTwoFactorWait(18)).toBe('0:18');
    expect(formatTwoFactorWait(75)).toBe('1:15');
  });

  it('cleans and checks backup codes', () => {
    expect(normalizeBackupCode('ab3k9-x2 mq7')).toBe('AB3K9X2MQ7');
    expect(backupCodeError('ab3k9-x2mq7')).toBeNull();
    expect(backupCodeError('')).toBe('Enter one of your backup codes.');
    expect(backupCodeError('ab3k9')).toMatch(/10 letters and digits/);
  });

  it('masks where the code went', () => {
    expect(maskTwoFactorDestination('+44 7700 900829', 'sms')).toBe('+44 ••• 829');
    expect(maskTwoFactorDestination('ines@fernhill.io', 'email')).toBe('i•••@fernhill.io');
    expect(twoFactorInstruction('app', 6)).toBe(
      'Open your authenticator app and enter the 6-digit code it shows.',
    );
  });
});

describe('TwoFactor', () => {
  it('verifies as soon as the last digit lands', async () => {
    const onVerify = vi.fn();
    render(<TwoFactor onVerify={onVerify} />);
    await userEvent.click(screen.getByRole('textbox', { name: 'Verification code' }));
    await userEvent.keyboard('482913');
    expect(onVerify).toHaveBeenCalledWith('482913', { remember: false });
  });

  it('asks for every digit before verifying', async () => {
    const onVerify = vi.fn();
    render(<TwoFactor onVerify={onVerify} />);
    await userEvent.click(screen.getByRole('textbox', { name: 'Verification code' }));
    await userEvent.keyboard('48');
    await userEvent.click(screen.getByRole('button', { name: 'Verify' }));
    expect(onVerify).not.toHaveBeenCalled();
    expect(screen.getByText('Enter all 6 digits.')).toBeInTheDocument();
  });

  it('holds the resend until the cooldown ends', () => {
    render(<TwoFactor onVerify={vi.fn()} method="sms" onResend={vi.fn()} sentAt={new Date()} />);
    expect(screen.getByRole('button', { name: /New code in 0:\d\d/ })).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Send a new code' })).not.toBeInTheDocument();
  });

  it('offers the resend once the cooldown has passed', async () => {
    const onResend = vi.fn();
    render(
      <TwoFactor
        onVerify={vi.fn()}
        method="sms"
        onResend={onResend}
        sentAt={new Date(Date.now() - 60_000)}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Send a new code' }));
    expect(onResend).toHaveBeenCalled();
  });

  it('takes a backup code instead', async () => {
    const onUseBackupCode = vi.fn();
    render(<TwoFactor onVerify={vi.fn()} onUseBackupCode={onUseBackupCode} />);
    await userEvent.click(screen.getByRole('button', { name: 'Use a backup code' }));
    await userEvent.type(screen.getByLabelText('Backup code'), 'ab3k9-x2mq7');
    await userEvent.click(screen.getByRole('button', { name: 'Verify backup code' }));
    expect(onUseBackupCode).toHaveBeenCalledWith('AB3K9X2MQ7');
  });

  it('ties a refusal to the code field', () => {
    render(<TwoFactor onVerify={vi.fn()} error="That code has expired." />);
    expect(screen.getByText('That code has expired.')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Verification code' })).toHaveAttribute(
      'aria-invalid',
      'true',
    );
  });

  it('says it checks on the last digit and puts focus back on a refusal', () => {
    render(<TwoFactor onVerify={vi.fn()} error="That code has expired." />);
    expect(screen.getByText(/as soon as you enter the last digit/)).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Verification code' })).toHaveFocus();
  });

  it('leaves focus alone on mount unless asked', () => {
    const { unmount } = render(<TwoFactor onVerify={vi.fn()} />);
    expect(screen.getByRole('textbox', { name: 'Verification code' })).not.toHaveFocus();
    unmount();
    render(<TwoFactor onVerify={vi.fn()} autoFocus />);
    expect(screen.getByRole('textbox', { name: 'Verification code' })).toHaveFocus();
  });
});
