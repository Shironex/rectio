'use client';

import { EyeIcon, EyeSlashIcon, KeyIcon } from '@phosphor-icons/react';
import {
  Alert,
  Button,
  Checkbox,
  Field,
  FieldError,
  FieldLabel,
  Input,
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  Separator,
} from '@rectio/ui';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type SubmitEvent } from 'react';

import { COMPANY } from '@/data/company';
import { CompanyMark } from '../shell/app-sidebar';
import { usePageState } from '../use-page-state';

export interface Credentials {
  email: string;
  password: string;
  remember: boolean;
}

export type SignInResult = { ok: true } | { ok: false; message: string };

/**
 * Wire your authentication here: call your auth provider or API with the credentials and resolve
 * with `{ ok: true }` once the session is set, or `{ ok: false, message }` to show the error.
 * The sample accepts any well-formed email and a password of eight characters or more.
 */
export async function signIn(credentials: Credentials): Promise<SignInResult> {
  await new Promise((resolve) => setTimeout(resolve, 600));
  if (credentials.password.length < 8)
    return { ok: false, message: 'That email and password do not match an account.' };
  return { ok: true };
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** The sign-in screen: email and password, single sign-on, and a clear error when it fails. */
export function SignInForm({ onSignIn = signIn }: { onSignIn?: typeof signIn }) {
  const state = usePageState();
  // Keyed by the state, so ?state=error seeds the form once the URL is read after hydration.
  return <SignInScreen key={state} onSignIn={onSignIn} failedFromUrl={state === 'error'} />;
}

function SignInScreen({
  onSignIn,
  failedFromUrl,
}: {
  onSignIn: typeof signIn;
  failedFromUrl: boolean;
}) {
  const router = useRouter();
  const [email, setEmail] = useState(failedFromUrl ? 'niamh.walsh@fernhill.ie' : '');
  const [password, setPassword] = useState(failedFromUrl ? 'fernhill' : '');
  const [remember, setRemember] = useState(true);
  const [reveal, setReveal] = useState(false);
  const [tried, setTried] = useState(false);
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const message =
    failure ?? (failedFromUrl ? 'That email and password do not match an account.' : null);

  const emailError =
    email.trim() === ''
      ? 'Enter your work email.'
      : EMAIL.test(email.trim())
        ? null
        : 'Enter an email address, such as name@company.ie.';
  const passwordError = password === '' ? 'Enter your password.' : null;

  const submit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTried(true);
    setFailure(null);
    if (emailError !== null || passwordError !== null) return;
    setPending(true);
    const result = await onSignIn({ email: email.trim(), password, remember });
    setPending(false);
    if (result.ok) router.push('/');
    else setFailure(result.message);
  };

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex items-center gap-2 px-6 py-5">
        <CompanyMark hideNameWhenCollapsed={false} />
      </header>
      <main
        id="main"
        className="flex flex-1 items-start justify-center px-4 pt-8 pb-16 sm:items-center sm:pt-0"
      >
        <div className="flex w-full max-w-sm flex-col gap-6">
          <div className="flex flex-col gap-1.5">
            <h1 className="font-display text-2xl font-heading tracking-tight">Sign in</h1>
            <p className="text-sm text-fg-muted">To the books of {COMPANY.legalName}.</p>
          </div>

          {message !== null && (
            <Alert tone="danger" title="Sign in failed" live="assertive">
              {message} Check the email, or reset your password.
            </Alert>
          )}

          <form
            noValidate
            onSubmit={(event) => {
              void submit(event);
            }}
            className="flex flex-col gap-4"
          >
            <Field invalid={tried && emailError !== null}>
              <FieldLabel>Work email</FieldLabel>
              <Input
                type="email"
                value={email}
                autoComplete="username"
                autoFocus
                onChange={(event) => {
                  setEmail(event.target.value);
                }}
              />
              <FieldError>{tried ? emailError : null}</FieldError>
            </Field>
            <Field invalid={tried && passwordError !== null}>
              <div className="flex items-baseline justify-between gap-3">
                <FieldLabel>Password</FieldLabel>
                <Link
                  href="/sign-in"
                  className="rounded-control text-sm text-accent-strong hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                >
                  Forgot password?
                </Link>
              </div>
              <InputGroup>
                <InputGroupInput
                  type={reveal ? 'text' : 'password'}
                  value={password}
                  autoComplete="current-password"
                  onChange={(event) => {
                    setPassword(event.target.value);
                  }}
                />
                <InputGroupAddon align="end">
                  <InputGroupButton
                    type="button"
                    iconOnly
                    aria-label={reveal ? 'Hide password' : 'Show password'}
                    aria-pressed={reveal}
                    onClick={() => {
                      setReveal((on) => !on);
                    }}
                  >
                    {reveal ? (
                      <EyeSlashIcon aria-hidden weight="bold" />
                    ) : (
                      <EyeIcon aria-hidden weight="bold" />
                    )}
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
              <FieldError>{tried ? passwordError : null}</FieldError>
            </Field>
            <label className="flex w-fit cursor-pointer items-center gap-2.5 text-sm pointer-coarse:min-h-(--rx-control-height-touch)">
              <Checkbox
                checked={remember}
                onCheckedChange={(checked) => {
                  setRemember(checked);
                }}
              />
              Keep me signed in for 30 days
            </label>
            <Button type="submit" loading={pending} className="w-full">
              Sign in
            </Button>
          </form>

          <div className="flex items-center gap-3 text-sm text-fg-subtle">
            <Separator className="flex-1" />
            or
            <Separator className="flex-1" />
          </div>
          <Button variant="secondary" className="w-full">
            <KeyIcon aria-hidden weight="bold" className="size-4" />
            Continue with single sign-on
          </Button>
        </div>
      </main>
      <footer className="flex flex-wrap justify-center gap-x-6 gap-y-2 px-6 py-5 text-sm text-fg-subtle">
        <span>{COMPANY.legalName}</span>
        <a href={`mailto:${COMPANY.email}`} className="hover:text-fg-muted hover:underline">
          Need access? Ask your finance team
        </a>
      </footer>
    </div>
  );
}
