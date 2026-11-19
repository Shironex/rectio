import { CheckCircleIcon, EnvelopeOpenIcon, LockKeyIcon } from '@phosphor-icons/react';
import { Field, FieldDescription, FieldError, FieldLabel, Input } from '@rectio/ui';
import { useId, useState, type ReactNode, type SyntheticEvent } from 'react';

import { useBlockParts } from '../../lib/block-parts';
import { AuthFrame, AuthLink, FormMessage, PasswordInput, type LinkTarget } from '../lib/auth';
import { hasErrors } from '../lib/saas';
import { PasswordRules } from '../lib/password-rules';
import {
  newPasswordErrors,
  resetRequestError,
  type NewPasswordErrors,
  type ResetPasswordStep,
} from './reset-password.logic';

export interface ResetPasswordProps {
  /** Which step to show. Your app moves it on: `sent` after the request, `done` after the reset. */
  step: ResetPasswordStep;
  /** Called with a valid email on the request step. */
  onRequest: (email: string) => void;
  /** Called with an accepted new password on the reset step. */
  onReset: (password: string) => void;
  /** Where the link went, shown on the sent step. */
  sentTo?: string | undefined;
  /** Offers "Send it again" on the sent step. */
  onResend?: () => void;
  /** Back to the request step, from the sent step or after an expired link. */
  onRestart?: () => void;
  pending?: boolean;
  /** Why the server refused, such as "This reset link has expired". */
  error?: ReactNode;
  minPasswordLength?: number;
  /** Back to sign in, and the way forward once the password changed. */
  signIn?: LinkTarget;
  defaultEmail?: string;
  brand?: ReactNode;
  className?: string;
}

function Mark({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex size-11 items-center justify-center rounded-full bg-accent-subtle text-accent-strong [&_svg]:size-5">
      {children}
    </span>
  );
}

/**
 * Forgotten password, end to end: request a link by email, a note that it went out with a resend,
 * a new password checked against its rules and typed twice, and a confirmation. The block shows one
 * step; your app holds the step and the token, and moves it on through the callbacks.
 */
export function ResetPassword({
  step,
  onRequest,
  onReset,
  sentTo,
  onResend,
  onRestart,
  pending = false,
  error,
  minPasswordLength = 12,
  signIn,
  defaultEmail = '',
  brand,
  className,
}: ResetPasswordProps) {
  const { Button } = useBlockParts();
  const hasError = error !== undefined && error !== null && error !== false;
  const back =
    signIn === undefined ? undefined : (
      <>
        Remembered it? <AuthLink to={signIn}>Back to sign in</AuthLink>
      </>
    );

  if (step === 'sent') {
    return (
      <AuthFrame
        brand={
          brand ?? (
            <Mark>
              <EnvelopeOpenIcon aria-hidden weight="bold" />
            </Mark>
          )
        }
        title="Check your email"
        description={
          <>
            If an account uses{' '}
            <span className="font-medium text-fg">{sentTo ?? 'that address'}</span>, a link to reset
            its password is on its way. It expires in 30 minutes.
          </>
        }
        footer={back}
        className={className}
      >
        {hasError && <FormMessage tone="error" title={error} />}
        <div className="flex flex-col gap-2">
          {onResend !== undefined && (
            <Button variant="secondary" loading={pending} className="w-full" onClick={onResend}>
              Send it again
            </Button>
          )}
          {onRestart !== undefined && (
            <Button variant="ghost" className="w-full text-fg-muted" onClick={onRestart}>
              Use a different email
            </Button>
          )}
        </div>
        <p className="text-sm text-fg-subtle">
          Nothing after a few minutes? Check spam, or ask your workspace admin which email your
          account uses.
        </p>
      </AuthFrame>
    );
  }

  if (step === 'done') {
    return (
      <AuthFrame
        brand={
          brand ?? (
            <span className="inline-flex size-11 items-center justify-center rounded-full bg-positive-subtle text-positive-strong">
              <CheckCircleIcon aria-hidden weight="bold" className="size-5" />
            </span>
          )
        }
        title="Your password is changed"
        description="You are signed out everywhere else. Sign in again with the new password."
        className={className}
      >
        {signIn !== undefined &&
          (typeof signIn === 'string' ? (
            <Button render={<a href={signIn} />} nativeButton={false} className="w-full">
              Continue to sign in
            </Button>
          ) : (
            <Button className="w-full" onClick={signIn}>
              Continue to sign in
            </Button>
          ))}
      </AuthFrame>
    );
  }

  if (step === 'reset') {
    return (
      <NewPassword
        brand={brand}
        className={className}
        pending={pending}
        error={hasError ? error : undefined}
        minLength={minPasswordLength}
        onReset={onReset}
        onRestart={onRestart}
      />
    );
  }

  return (
    <RequestLink
      brand={brand}
      className={className}
      footer={back}
      pending={pending}
      error={hasError ? error : undefined}
      defaultEmail={defaultEmail}
      onRequest={onRequest}
    />
  );
}

function RequestLink({
  brand,
  className,
  footer,
  pending,
  error,
  defaultEmail,
  onRequest,
}: {
  brand: ReactNode;
  className: string | undefined;
  footer: ReactNode;
  pending: boolean;
  error: ReactNode;
  defaultEmail: string;
  onRequest: (email: string) => void;
}) {
  const { Button } = useBlockParts();
  const [email, setEmail] = useState(defaultEmail);
  const [tried, setTried] = useState(false);
  const problem = tried ? resetRequestError(email) : null;

  const submit = (event: SyntheticEvent) => {
    event.preventDefault();
    setTried(true);
    if (pending || resetRequestError(email) !== null) return;
    onRequest(email.trim());
  };

  return (
    <AuthFrame
      brand={brand}
      title="Reset your password"
      description="Enter the email you sign in with and we will send you a link to choose a new password."
      footer={footer}
      className={className}
    >
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        {error !== undefined && <FormMessage tone="error" title={error} />}
        <Field invalid={problem !== null}>
          <FieldLabel>Email</FieldLabel>
          <Input
            type="email"
            name="email"
            autoComplete="username"
            inputMode="email"
            spellCheck={false}
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
            }}
          />
          {problem !== null && <FieldError>{problem}</FieldError>}
        </Field>
        <Button type="submit" loading={pending} className="mt-1 w-full">
          Email me a reset link
        </Button>
      </form>
    </AuthFrame>
  );
}

function NewPassword({
  brand,
  className,
  pending,
  error,
  minLength,
  onReset,
  onRestart,
}: {
  brand: ReactNode;
  className: string | undefined;
  pending: boolean;
  error: ReactNode;
  minLength: number;
  onReset: (password: string) => void;
  onRestart: (() => void) | undefined;
}) {
  const { Button } = useBlockParts();
  const rulesId = useId();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [tried, setTried] = useState(false);
  const errors: NewPasswordErrors = tried ? newPasswordErrors(password, confirm, minLength) : {};

  const submit = (event: SyntheticEvent) => {
    event.preventDefault();
    setTried(true);
    if (pending || hasErrors(newPasswordErrors(password, confirm, minLength))) return;
    onReset(password);
  };

  return (
    <AuthFrame
      brand={
        brand ?? (
          <Mark>
            <LockKeyIcon aria-hidden weight="bold" />
          </Mark>
        )
      }
      title="Choose a new password"
      description="Use one you do not use anywhere else."
      className={className}
    >
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        {error !== undefined && (
          <FormMessage tone="error" title={error}>
            {onRestart !== undefined && (
              <AuthLink to={onRestart} className="text-negative-strong">
                Request a new link
              </AuthLink>
            )}
          </FormMessage>
        )}
        <Field invalid={errors.password !== undefined}>
          <FieldLabel>New password</FieldLabel>
          <PasswordInput
            name="new-password"
            autoComplete="new-password"
            aria-describedby={rulesId}
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
            }}
          />
          {errors.password !== undefined && <FieldError>{errors.password}</FieldError>}
          <PasswordRules id={rulesId} password={password} minLength={minLength} />
        </Field>
        <Field invalid={errors.confirm !== undefined}>
          <FieldLabel>Confirm new password</FieldLabel>
          <PasswordInput
            name="confirm-password"
            autoComplete="new-password"
            value={confirm}
            onChange={(event) => {
              setConfirm(event.target.value);
            }}
          />
          {errors.confirm !== undefined ? (
            <FieldError>{errors.confirm}</FieldError>
          ) : (
            <FieldDescription>Signing in elsewhere ends once it is saved.</FieldDescription>
          )}
        </Field>
        <Button type="submit" loading={pending} className="mt-1 w-full">
          Save new password
        </Button>
      </form>
    </AuthFrame>
  );
}
