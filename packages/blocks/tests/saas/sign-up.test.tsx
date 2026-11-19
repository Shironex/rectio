import { render, screen } from '@testing-library/react';
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
    render(<SignUp onSubmit={vi.fn()} error="An account with this email already exists." />);
    expect(screen.getByRole('alert')).toHaveTextContent('already exists');
  });
});
