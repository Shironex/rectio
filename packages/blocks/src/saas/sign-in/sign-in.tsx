import { EnvelopeSimpleIcon, KeyIcon } from '@phosphor-icons/react';
import { Checkbox, Field, FieldError, FieldLabel, Input } from '@rectio/ui';
import { useState, type ReactNode, type SyntheticEvent } from 'react';

import { useBlockParts } from '../../lib/block-parts';
import {
  AuthFrame,
  AuthLink,
  FormMessage,
  OrDivider,
  PasswordInput,
  type LinkTarget,
} from '../lib/auth';
import { hasErrors } from '../lib/saas';
import {
  signInErrors,
  type SignInErrors,
  type SignInMethod,
  type SignInValues,
} from './sign-in.logic';

export interface SignInProps {
  /** Called with valid values. Show progress with `pending` and a refusal with `error`. */
  onSubmit: (values: SignInValues) => void;
  /** Offers a passwordless sign in by email; called with a valid address. */
  onMagicLink?: (email: string) => void;
  /** Your provider buttons (see `SocialButton`), shown above the email form. */
  social?: ReactNode;
  /** The request is in flight: the submit button shows progress and blocks a second press. */
  pending?: boolean;
  /** Why the server refused, shown above the form, such as "That email and password do not match". */
  error?: ReactNode;
  /** Set once a magic link is sent: the form gives way to a check-your-inbox note. */
  magicLinkSentTo?: string | undefined;
  forgotPassword?: LinkTarget;
  signUp?: LinkTarget;
  defaultEmail?: string;
  /** Your mark or product name, above the heading. */
  brand?: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
  className?: string;
}

/**
 * Sign in with an email and a password, an emailed link, or your providers. Validation is shown
 * after the first submit, per field and tied to it; a refusal from your server sits above the
 * form. The block holds only what is typed; your callbacks do the signing in.
 */
export function SignIn({
  onSubmit,
  onMagicLink,
  social,
  pending = false,
  error,
  magicLinkSentTo,
  forgotPassword,
  signUp,
  defaultEmail = '',
  ...frame
}: SignInProps) {
  const { Button } = useBlockParts();
  const [method, setMethod] = useState<SignInMethod>('password');
  const [values, setValues] = useState<SignInValues>({
    email: defaultEmail,
    password: '',
    remember: true,
  });
  const [tried, setTried] = useState(false);
  // A refusal marks the password field until the password is edited.
  const [answered, setAnswered] = useState<ReactNode>(undefined);
  const refused = error !== undefined && error !== null && error !== false && error !== answered;
  const errors: SignInErrors = tried ? signInErrors(values, method) : {};

  const submit = (event: SyntheticEvent) => {
    event.preventDefault();
    setTried(true);
    if (pending || hasErrors(signInErrors(values, method))) return;
    if (method === 'magic-link') onMagicLink?.(values.email.trim());
    else onSubmit({ ...values, email: values.email.trim() });
  };

  const footer =
    signUp === undefined ? undefined : (
      <>
        New here? <AuthLink to={signUp}>Create an account</AuthLink>
      </>
    );

  if (magicLinkSentTo !== undefined) {
    return (
      <AuthFrame {...frame} title="Check your inbox" description={undefined} footer={footer}>
        <FormMessage tone="success" title={`We sent a sign-in link to ${magicLinkSentTo}`}>
          It works once and expires in 15 minutes. Open it on this device to continue.
        </FormMessage>
        <Button
          variant="secondary"
          className="w-full"
          onClick={() => {
            setMethod('password');
            onMagicLink?.(magicLinkSentTo);
          }}
        >
          Send the link again
        </Button>
      </AuthFrame>
    );
  }

  return (
    <AuthFrame
      {...frame}
      title={frame.title ?? 'Sign in'}
      description={frame.description ?? 'Welcome back. Use the email you signed up with.'}
      footer={footer}
    >
      {social !== undefined && (
        <div className="flex flex-col gap-4">
          {/* Two providers sit side by side on a roomy form; one or three take the full width. */}
          <div className="grid gap-2 @sm:grid-cols-2 @sm:[&>*:last-child:nth-child(odd)]:col-span-2">
            {social}
          </div>
          <OrDivider>or with email</OrDivider>
        </div>
      )}

      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        <Field invalid={errors.email !== undefined}>
          <FieldLabel>Email</FieldLabel>
          <Input
            type="email"
            name="email"
            autoComplete="username"
            inputMode="email"
            spellCheck={false}
            value={values.email}
            onChange={(event) => {
              setValues({ ...values, email: event.target.value });
            }}
          />
          {errors.email !== undefined && <FieldError>{errors.email}</FieldError>}
        </Field>

        {method === 'password' && (
          <Field invalid={errors.password !== undefined || refused}>
            <div className="flex items-baseline justify-between gap-3">
              <FieldLabel>Password</FieldLabel>
              {forgotPassword !== undefined && (
                <AuthLink to={forgotPassword} className="text-sm font-regular">
                  Forgot password?
                </AuthLink>
              )}
            </div>
            <PasswordInput
              name="password"
              autoComplete="current-password"
              value={values.password}
              onChange={(event) => {
                setValues({ ...values, password: event.target.value });
                setAnswered(error);
              }}
            />
            {errors.password !== undefined && <FieldError>{errors.password}</FieldError>}
          </Field>
        )}

        {method === 'password' && (
          <label className="flex w-fit cursor-pointer items-center gap-2.5 text-sm text-fg-muted">
            <Checkbox
              checked={values.remember}
              onCheckedChange={(checked) => {
                setValues({ ...values, remember: checked });
              }}
            />
            Keep me signed in on this device
          </label>
        )}

        {/* The refusal sits by the button that will retry it, after the fields it is about. */}
        {error !== undefined && error !== null && error !== false && (
          <FormMessage tone="error" title={error} />
        )}

        <div className="flex flex-col gap-2 pt-1">
          <Button type="submit" loading={pending} className="w-full">
            {method === 'password' ? 'Sign in' : 'Email me a link'}
          </Button>
          {onMagicLink !== undefined && (
            <Button
              variant="ghost"
              className="w-full text-fg-muted"
              onClick={() => {
                setMethod(method === 'password' ? 'magic-link' : 'password');
                setTried(false);
              }}
            >
              {method === 'password' ? (
                <>
                  <EnvelopeSimpleIcon aria-hidden weight="bold" className="size-4" />
                  Email me a sign-in link instead
                </>
              ) : (
                <>
                  <KeyIcon aria-hidden weight="bold" className="size-4" />
                  Use my password instead
                </>
              )}
            </Button>
          )}
        </div>
      </form>
    </AuthFrame>
  );
}
