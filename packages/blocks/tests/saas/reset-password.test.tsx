import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ResetPassword, newPasswordErrors, resetRequestError } from '../../src/index';

const noop = () => undefined;

describe('reset rules', () => {
  it('checks the email of the request', () => {
    expect(resetRequestError('')).toBe('Enter the email address of your account.');
    expect(resetRequestError('tomasz@')).toBe('Enter an email address like name@company.com.');
    expect(resetRequestError(' tomasz@fernhill.io ')).toBeNull();
  });

  it('wants an accepted password typed the same twice', () => {
    expect(newPasswordErrors('', '')).toEqual({
      password: 'Choose a new password.',
      confirm: 'Type the new password again.',
    });
    expect(newPasswordErrors('Ledger-Lines-42', 'Ledger-Lines-43')).toEqual({
      confirm: 'The two passwords do not match.',
    });
    expect(newPasswordErrors('Ledger-Lines-42', 'Ledger-Lines-42')).toEqual({});
  });
});

describe('ResetPassword', () => {
  it('requests a link for a valid email', async () => {
    const onRequest = vi.fn();
    render(<ResetPassword step="request" onRequest={onRequest} onReset={noop} />);
    await userEvent.type(screen.getByLabelText('Email'), 'tomasz@fernhill.io');
    await userEvent.click(screen.getByRole('button', { name: 'Email me a reset link' }));
    expect(onRequest).toHaveBeenCalledWith('tomasz@fernhill.io');
  });

  it('says where the link went', () => {
    render(
      <ResetPassword step="sent" sentTo="tomasz@fernhill.io" onRequest={noop} onReset={noop} />,
    );
    expect(screen.getByRole('heading', { name: 'Check your email' })).toBeInTheDocument();
    expect(screen.getByText('tomasz@fernhill.io')).toBeInTheDocument();
  });

  it('saves only a matching, accepted password', async () => {
    const onReset = vi.fn();
    render(<ResetPassword step="reset" onRequest={noop} onReset={onReset} />);
    await userEvent.type(screen.getByLabelText('New password'), 'Ledger-Lines-42');
    await userEvent.type(screen.getByLabelText('Confirm new password'), 'Ledger-Lines-4');
    await userEvent.click(screen.getByRole('button', { name: 'Save new password' }));
    expect(onReset).not.toHaveBeenCalled();
    expect(screen.getByText('The two passwords do not match.')).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('Confirm new password'), '2');
    await userEvent.click(screen.getByRole('button', { name: 'Save new password' }));
    expect(onReset).toHaveBeenCalledWith('Ledger-Lines-42');
  });

  it('offers a new link when the old one expired', async () => {
    const onRestart = vi.fn();
    render(
      <ResetPassword
        step="reset"
        error="This reset link has expired."
        onRestart={onRestart}
        onRequest={noop}
        onReset={noop}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Request a new link' }));
    expect(onRestart).toHaveBeenCalled();
  });

  it('confirms the change and leads back to sign in', async () => {
    const signIn = vi.fn();
    render(<ResetPassword step="done" signIn={signIn} onRequest={noop} onReset={noop} />);
    await userEvent.click(screen.getByRole('button', { name: 'Continue to sign in' }));
    expect(signIn).toHaveBeenCalled();
  });
});
