import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ResetPassword, newPasswordErrors, resetRequestError } from '../../src/index';

const noop = () => undefined;

describe('reset rules', () => {
  it('checks the email of the request', () => {
    expect(resetRequestError('')).toBe('Enter the email address of your account.');
    expect(resetRequestError('callum@')).toBe('Enter an email address like name@company.com.');
    expect(resetRequestError(' callum@fernhill.io ')).toBeNull();
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
    await userEvent.type(screen.getByLabelText('Email'), 'callum@fernhill.io');
    await userEvent.click(screen.getByRole('button', { name: 'Email me a reset link' }));
    expect(onRequest).toHaveBeenCalledWith('callum@fernhill.io');
  });

  it('says where the link went', () => {
    render(
      <ResetPassword step="sent" sentTo="callum@fernhill.io" onRequest={noop} onReset={noop} />,
    );
    expect(screen.getByRole('heading', { name: 'Check your email' })).toBeInTheDocument();
    expect(screen.getByText('callum@fernhill.io')).toBeInTheDocument();
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

  it('keeps the way back to sign in on every step', () => {
    for (const step of ['request', 'sent', 'reset', 'done'] as const) {
      const { unmount } = render(
        <ResetPassword step={step} signIn="/sign-in" onRequest={noop} onReset={noop} />,
      );
      expect(screen.getByRole('link', { name: 'Back to sign in' })).toHaveAttribute(
        'href',
        '/sign-in',
      );
      unmount();
    }
  });

  it('says live whether the two passwords match', async () => {
    render(<ResetPassword step="reset" onRequest={noop} onReset={noop} />);
    await userEvent.type(screen.getByLabelText('New password'), 'Ledger-Lines-42');
    await userEvent.type(screen.getByLabelText('Confirm new password'), 'Ledger');
    expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('Confirm new password'), '-Lines-42');
    expect(screen.getByText('Passwords match')).toBeInTheDocument();
    expect(screen.getByText('Signed out elsewhere.')).toBeInTheDocument();
  });

  it('points the new password at both its rules and its error', async () => {
    render(<ResetPassword step="reset" onRequest={noop} onReset={noop} />);
    await userEvent.click(screen.getByRole('button', { name: 'Save new password' }));
    const password = screen.getByLabelText('New password');
    const ids = (password.getAttribute('aria-describedby') ?? '').split(' ');
    const described = ids.map((id) => document.getElementById(id)?.textContent ?? '').join(' ');
    expect(described).toContain('Upper and lower case letters');
    expect(described.length).toBeGreaterThan('Upper and lower case letters'.length);
    await waitFor(() => {
      expect(password).toHaveFocus();
    });
  });

  it('keeps one live region for the match state', async () => {
    const { container } = render(<ResetPassword step="reset" onRequest={noop} onReset={noop} />);
    const live = container.querySelector('[aria-live="polite"]');
    expect(live).toBeEmptyDOMElement();
    await userEvent.type(screen.getByLabelText('Confirm new password'), 'x');
    expect(container.querySelector('[aria-live="polite"]')).toBe(live);
    expect(live).toHaveTextContent('Passwords do not match');
  });

  it('moves focus to the heading of a step that replaces another', () => {
    render(<ResetPassword step="sent" sentTo="a@b.io" onRequest={noop} onReset={noop} />);
    expect(screen.getByRole('heading', { name: 'Check your email' })).toHaveFocus();
  });

  it('moves focus to the request heading when coming back from the sent step', () => {
    const { rerender } = render(
      <ResetPassword step="sent" sentTo="a@b.io" onRequest={noop} onReset={noop} />,
    );
    rerender(<ResetPassword step="request" onRequest={noop} onReset={noop} />);
    expect(screen.getByRole('heading', { name: 'Reset your password' })).toHaveFocus();
  });
});
