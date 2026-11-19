import { SignOutIcon } from '@phosphor-icons/react';
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
  // Every step carries the same way out, so the four read as one flow.
  const back =
    signIn === undefined ? undefined : (
      <>
        {step !== 'done' && 'Remembered it? '}
        <AuthLink to={signIn}>Back to sign in</AuthLink>
      </>
    );
  const frame: StepFrame = { brand, className, footer: back };

  if (step === 'sent') {
    return (
      <AuthFrame
        {...frame}
        title="Check your email"
        description={
          <>
            If an account uses{' '}
            <span className="font-medium text-fg">{sentTo ?? 'that address'}</span>, a link to reset
            its password is on its way. It expires in 30 minutes.
          </>
        }
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
        {...frame}
        title="Your password is changed"
        description="You are signed out everywhere else. Sign in again with the new password."
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
        frame={frame}
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
      frame={frame}
      pending={pending}
      error={hasError ? error : undefined}
      defaultEmail={defaultEmail}
      onRequest={onRequest}
    />
  );
}

/** What every step's frame shares: your brand, your class and the way back to sign in. */
interface StepFrame {
  brand: ReactNode;
  className: string | undefined;
  footer: ReactNode;
}

function RequestLink({
  frame,
  pending,
  error,
  defaultEmail,
  onRequest,
}: {
  frame: StepFrame;
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
      {...frame}
      title="Reset your password"
      description="Enter the email you sign in with and we will send you a link to choose a new password."
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
          <FieldDescription>
            The link works once and expires in 30 minutes. We send the same reply whether or not an
            account uses this address.
          </FieldDescription>
          {problem !== null && <FieldError>{problem}</FieldError>}
        </Field>
        <Button type="submit" loading={pending} className="mt-2 w-full">
          Email me a reset link
        </Button>
      </form>
    </AuthFrame>
  );
}

function NewPassword({
  frame,
  pending,
  error,
  minLength,
  onReset,
  onRestart,
}: {
  frame: StepFrame;
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
  const [focused, setFocused] = useState(false);
  const showRules = focused || password !== '';
  const errors: NewPasswordErrors = tried ? newPasswordErrors(password, confirm, minLength) : {};

  const submit = (event: SyntheticEvent) => {
    event.preventDefault();
    setTried(true);
    if (pending || hasErrors(newPasswordErrors(password, confirm, minLength))) return;
    onReset(password);
  };

  return (
    <AuthFrame
      {...frame}
      title="Choose a new password"
      description="Use one you do not use anywhere else."
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
            aria-describedby={showRules ? rulesId : undefined}
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
            }}
            onFocus={() => {
              setFocused(true);
            }}
            onBlur={() => {
              setFocused(false);
            }}
          />
          {errors.password !== undefined && <FieldError>{errors.password}</FieldError>}
          {showRules && <PasswordRules id={rulesId} password={password} minLength={minLength} />}
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
          {errors.confirm !== undefined && <FieldError>{errors.confirm}</FieldError>}
        </Field>
        <p className="mt-2 flex items-start gap-2.5 text-base text-fg">
          <SignOutIcon aria-hidden weight="bold" className="mt-1 size-4 shrink-0 text-fg-muted" />
          Saving signs you out on every other device, so anyone using your old password loses
          access.
        </p>
        <Button type="submit" loading={pending} className="w-full">
          Save new password
        </Button>
      </form>
    </AuthFrame>
  );
}
