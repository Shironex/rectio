import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { SignIn, signInErrors } from '../../src/index';

describe('signInErrors', () => {
  it('asks for an email and, with a password, for the password', () => {
    expect(signInErrors({ email: '', password: '', remember: true }, 'password')).toEqual({
      email: 'Enter your email address.',
      password: 'Enter your password.',
    });
    expect(signInErrors({ email: 'ines@', password: '', remember: true }, 'magic-link')).toEqual({
      email: 'Enter an email address like name@company.com.',
    });
    expect(
      signInErrors({ email: 'ines@fernhill.io', password: 'x', remember: false }, 'password'),
    ).toEqual({});
  });
});

describe('SignIn', () => {
  it('shows field errors after a submit and sends nothing', async () => {
    const onSubmit = vi.fn();
    render(<SignIn onSubmit={onSubmit} />);
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText('Enter your email address.')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
  });

  it('marks the password field on a refusal until the password is edited', async () => {
    render(<SignIn onSubmit={vi.fn()} error="That email and password do not match." />);
    expect(screen.getByRole('alert')).toHaveTextContent('That email and password do not match.');
    const password = screen.getByLabelText('Password');
    expect(password).toHaveAttribute('aria-invalid', 'true');
    await userEvent.type(password, 'x');
    expect(password).not.toHaveAttribute('aria-invalid', 'true');
  });

  it('shows the password with a pressed toggle that keeps its name', async () => {
    render(<SignIn onSubmit={vi.fn()} />);
    const toggle = screen.getByRole('button', { name: 'Show password' });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'text');
  });

  it('sends trimmed values', async () => {
    const onSubmit = vi.fn();
    render(<SignIn onSubmit={onSubmit} />);
    await userEvent.type(screen.getByLabelText('Email'), ' ines@fernhill.io ');
    await userEvent.type(screen.getByLabelText('Password'), 'correct horse');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(onSubmit).toHaveBeenCalledWith({
      email: 'ines@fernhill.io',
      password: 'correct horse',
      remember: true,
    });
  });

  it('shows and hides the password', async () => {
    render(<SignIn onSubmit={vi.fn()} />);
    const password = screen.getByLabelText('Password');
    expect(password).toHaveAttribute('type', 'password');
    await userEvent.click(screen.getByRole('button', { name: 'Show password' }));
    expect(password).toHaveAttribute('type', 'text');
  });

  it('switches to a magic link and confirms where it went', async () => {
    const onMagicLink = vi.fn();
    const { rerender } = render(<SignIn onSubmit={vi.fn()} onMagicLink={onMagicLink} />);
    await userEvent.click(screen.getByRole('button', { name: /sign-in link instead/ }));
    expect(screen.queryByLabelText('Password')).not.toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('Email'), 'ines@fernhill.io');
    await userEvent.click(screen.getByRole('button', { name: 'Email me a link' }));
    expect(onMagicLink).toHaveBeenCalledWith('ines@fernhill.io');
    rerender(
      <SignIn onSubmit={vi.fn()} onMagicLink={onMagicLink} magicLinkSentTo="ines@fernhill.io" />,
    );
    expect(screen.getByRole('heading', { name: 'Check your inbox' })).toBeInTheDocument();
  });

  it('announces a refusal from the server', () => {
    render(<SignIn onSubmit={vi.fn()} error="That email and password do not match." />);
    expect(screen.getByRole('alert')).toHaveTextContent('That email and password do not match.');
  });
});
