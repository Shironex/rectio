import { Checkbox, Field, FieldError, FieldLabel, Input } from '@rectio/ui';
import { useId, useState, type ReactNode, type SyntheticEvent } from 'react';

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
import { PasswordRules } from '../lib/password-rules';
import { signUpErrors, type SignUpErrors, type SignUpValues } from './sign-up.logic';

export interface SignUpProps {
  /** Called with valid values. Show progress with `pending` and a refusal with `error`. */
  onSubmit: (values: SignUpValues) => void;
  /** Your provider buttons (see `SocialButton`), shown above the email form. */
  social?: ReactNode;
  pending?: boolean;
  /** Why the server refused, such as "An account with this email already exists". */
  error?: ReactNode;
  /** The shortest password accepted. */
  minPasswordLength?: number;
  /** Links to your terms and privacy notice; a checkbox to accept them appears when given. */
  terms?: LinkTarget | undefined;
  privacy?: LinkTarget | undefined;
  signIn?: LinkTarget;
  defaultEmail?: string;
  /** Your mark or product name, above the heading. */
  brand?: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
  className?: string;
}

/**
 * Create an account: name, work email and a password checked against its rules as it is typed,
 * with the terms to accept. Errors show after the first submit, tied to their fields. The block
 * holds only what is typed; your `onSubmit` creates the account.
 */
export function SignUp({
  onSubmit,
  social,
  pending = false,
  error,
  minPasswordLength = 12,
  terms,
  privacy,
  signIn,
  defaultEmail = '',
  ...frame
}: SignUpProps) {
  const { Button } = useBlockParts();
  const rulesId = useId();
  const [values, setValues] = useState<SignUpValues>({
    name: '',
    email: defaultEmail,
    password: '',
    acceptedTerms: false,
  });
  const [tried, setTried] = useState(false);
  const options = { minLength: minPasswordLength, requireTerms: terms !== undefined };
  const errors: SignUpErrors = tried ? signUpErrors(values, options) : {};

  const submit = (event: SyntheticEvent) => {
    event.preventDefault();
    setTried(true);
    if (pending || hasErrors(signUpErrors(values, options))) return;
    onSubmit({ ...values, name: values.name.trim(), email: values.email.trim() });
  };

  return (
    <AuthFrame
      {...frame}
      title={frame.title ?? 'Create your account'}
      description={frame.description ?? 'Free for 14 days. No card needed to start.'}
      footer={
        signIn === undefined ? undefined : (
          <>
            Already have an account? <AuthLink to={signIn}>Sign in</AuthLink>
          </>
        )
      }
    >
      {social !== undefined && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">{social}</div>
          <OrDivider>or with email</OrDivider>
        </div>
      )}

      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        {error !== undefined && error !== null && error !== false && (
          <FormMessage tone="error" title={error} />
        )}

        <Field invalid={errors.name !== undefined}>
          <FieldLabel>Full name</FieldLabel>
          <Input
            name="name"
            autoComplete="name"
            value={values.name}
            onChange={(event) => {
              setValues({ ...values, name: event.target.value });
            }}
          />
          {errors.name !== undefined && <FieldError>{errors.name}</FieldError>}
        </Field>

        <Field invalid={errors.email !== undefined}>
          <FieldLabel>Work email</FieldLabel>
          <Input
            type="email"
            name="email"
            autoComplete="email"
            inputMode="email"
            spellCheck={false}
            value={values.email}
            onChange={(event) => {
              setValues({ ...values, email: event.target.value });
            }}
          />
          {errors.email !== undefined && <FieldError>{errors.email}</FieldError>}
        </Field>

        <Field invalid={errors.password !== undefined}>
          <FieldLabel>Password</FieldLabel>
          <PasswordInput
            name="password"
            autoComplete="new-password"
            aria-describedby={rulesId}
            value={values.password}
            onChange={(event) => {
              setValues({ ...values, password: event.target.value });
            }}
          />
          {errors.password !== undefined && <FieldError>{errors.password}</FieldError>}
          <PasswordRules id={rulesId} password={values.password} minLength={minPasswordLength} />
        </Field>

        {terms !== undefined && (
          <Field invalid={errors.acceptedTerms !== undefined}>
            <label className="flex cursor-pointer items-start gap-2.5 text-sm text-fg-muted">
              <span className="flex h-5 items-center">
                <Checkbox
                  checked={values.acceptedTerms}
                  onCheckedChange={(checked) => {
                    setValues({ ...values, acceptedTerms: checked });
                  }}
                />
              </span>
              <span>
                I agree to the{' '}
                <AuthLink to={terms} className="pointer-coarse:py-0">
                  terms of service
                </AuthLink>
                {privacy !== undefined && (
                  <>
                    {' '}
                    and the{' '}
                    <AuthLink to={privacy} className="pointer-coarse:py-0">
                      privacy notice
                    </AuthLink>
                  </>
                )}
                .
              </span>
            </label>
            {errors.acceptedTerms !== undefined && <FieldError>{errors.acceptedTerms}</FieldError>}
          </Field>
        )}

        <Button type="submit" loading={pending} className="mt-1 w-full">
          Create account
        </Button>
      </form>
    </AuthFrame>
  );
}
