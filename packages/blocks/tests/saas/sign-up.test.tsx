import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { SignUp, signUpErrors } from '../../src/index';

const VALID = {
  name: 'Margot Leclerc',
  email: 'margot@fernhill.io',
  password: 'Ledger-Lines-42',
  acceptedTerms: true,
};

describe('signUpErrors', () => {
  it('asks for every field and the terms', () => {
    expect(signUpErrors({ name: ' ', email: '', password: '', acceptedTerms: false })).toEqual({
      name: 'Enter your name.',
      email: 'Enter your work email address.',
      password: 'Choose a password.',
      acceptedTerms: 'Accept the terms to create your account.',
    });
  });

  it('holds the password to every rule and the terms only when asked', () => {
    expect(signUpErrors({ ...VALID, password: 'short' }).password).toBe(
      'Meet every rule below to continue.',
    );
    expect(signUpErrors({ ...VALID, acceptedTerms: false }, { requireTerms: false })).toEqual({});
    expect(signUpErrors(VALID)).toEqual({});
  });
});

describe('SignUp', () => {
  it('ticks off the password rules as they are typed', async () => {
    render(<SignUp onSubmit={vi.fn()} />);
    await userEvent.type(screen.getByLabelText('Password'), 'abc1');
    expect(screen.getByText(/A number/)).toHaveTextContent('A number, met');
    expect(screen.getByText(/At least 12 characters/)).toHaveTextContent('not met yet');
  });

  it('refuses without the terms and says why', async () => {
    const onSubmit = vi.fn();
    render(<SignUp onSubmit={onSubmit} terms="/terms" />);
    await userEvent.type(screen.getByLabelText('Full name'), VALID.name);
    await userEvent.type(screen.getByLabelText('Work email'), VALID.email);
    await userEvent.type(screen.getByLabelText('Password'), VALID.password);
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText('Accept the terms to create your account.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('checkbox'));
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }));
    expect(onSubmit).toHaveBeenCalledWith(VALID);
  });

  it('announces a refusal from the server', () => {
    render(<SignUp onSubmit={vi.fn()} error="We could not reach the server." />);
    expect(screen.getByRole('alert')).toHaveTextContent('could not reach');
  });

  it('shows the password rules from the start', () => {
    render(<SignUp onSubmit={vi.fn()} />);
    expect(screen.getByText(/Upper and lower case letters/)).toHaveTextContent('not met yet');
  });

  it('says a taken email under the field with a way to sign in, until it changes', async () => {
    const signIn = vi.fn();
    render(
      <SignUp onSubmit={vi.fn()} emailTaken signIn={signIn} defaultEmail="margot@fernhill.io" />,
    );
    const email = screen.getByLabelText('Work email');
    expect(email).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText(/has an account/)).toBeInTheDocument();
    // The first "Sign in" is the one under the field; the footer holds the second.
    const [inline] = screen.getAllByRole('button', { name: 'Sign in' });
    if (inline === undefined) throw new Error('No sign-in link under the email field');
    await userEvent.click(inline);
    expect(signIn).toHaveBeenCalled();
    await userEvent.type(email, 'x');
    expect(screen.queryByText(/has an account/)).not.toBeInTheDocument();
  });

  it('points the password at both its rules and its error', async () => {
    render(<SignUp onSubmit={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }));
    const password = screen.getByLabelText('Password');
    const ids = (password.getAttribute('aria-describedby') ?? '').split(' ');
    const described = ids.map((id) => document.getElementById(id)?.textContent ?? '').join(' ');
    expect(described).toContain('Choose a password.');
    expect(described).toContain('Upper and lower case letters');
  });

  it('moves focus to the first invalid field after a refused submit', async () => {
    render(<SignUp onSubmit={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }));
    await waitFor(() => {
      expect(screen.getByLabelText('Full name')).toHaveFocus();
    });
  });
});
