import { OTPField } from '@base-ui/react/otp-field';
import { ArrowClockwiseIcon, LifebuoyIcon, ShieldCheckIcon } from '@phosphor-icons/react';
import { Checkbox, Field, FieldDescription, FieldError, FieldLabel, Input, cn } from '@rectio/ui';
import { Fragment, useEffect, useState, type ReactNode, type SyntheticEvent } from 'react';

import { useBlockParts } from '../../lib/block-parts';
import { AuthFrame, AuthLink, type LinkTarget } from '../lib/auth';
import {
  backupCodeError,
  formatTwoFactorWait,
  normalizeBackupCode,
  twoFactorCodeComplete,
  twoFactorInstruction,
  twoFactorResendWait,
  type TwoFactorMethod,
} from './two-factor.logic';

export interface TwoFactorProps {
  /** Called with a complete code; `remember` when the person trusts this device. */
  onVerify: (code: string, options: { remember: boolean }) => void;
  method?: TwoFactorMethod;
  /** The phone number or email the code went to; shown masked. */
  destination?: string | undefined;
  length?: number;
  /** Offers "Send a new code" for text and email codes, after the cooldown. */
  onResend?: () => void;
  /** When the last code was sent, for the resend countdown. */
  sentAt?: Date | undefined;
  /** Seconds before another code may be sent. */
  resendCooldown?: number;
  /** Offers a backup code instead; called with the cleaned code. */
  onUseBackupCode?: (code: string) => void;
  /** Shows "Trust this device for 30 days" when given, with your wording. */
  rememberLabel?: ReactNode;
  pending?: boolean;
  /** Why the code was refused, tied to the code field, such as "That code has expired". */
  error?: ReactNode;
  /** "Sign in as someone else" or a way back. */
  back?: LinkTarget;
  brand?: ReactNode;
  title?: ReactNode;
  className?: string;
}

/** Ticks once a second while a countdown runs, so the resend button can wake up. */
function useNow(running: boolean): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => {
      clearInterval(timer);
    };
  }, [running]);
  return now;
}

/**
 * The second step of signing in: a one-time code in separate slots that paste and autofill in one
 * go, a resend that counts down, and a way out with a backup code. The code is sent as soon as the
 * last digit lands; a refusal from your server is tied to the field.
 */
export function TwoFactor({
  onVerify,
  method = 'app',
  destination,
  length = 6,
  onResend,
  sentAt,
  resendCooldown = 30,
  onUseBackupCode,
  rememberLabel,
  pending = false,
  error,
  back,
  brand,
  title,
  className,
}: TwoFactorProps) {
  const { Button } = useBlockParts();
  const [mode, setMode] = useState<'code' | 'backup'>('code');
  const [code, setCode] = useState('');
  const [remember, setRemember] = useState(false);
  const [tried, setTried] = useState(false);
  const canResend = onResend !== undefined && method !== 'app';
  const now = useNow(canResend && sentAt !== undefined);
  const wait = canResend ? twoFactorResendWait(sentAt, now, resendCooldown) : 0;
  const hasError = error !== undefined && error !== null && error !== false;

  const verify = (value: string) => {
    if (pending || !twoFactorCodeComplete(value, length)) return;
    onVerify(value, { remember });
  };
  const submit = (event: SyntheticEvent) => {
    event.preventDefault();
    setTried(true);
    verify(code);
  };
  const incomplete = tried && !twoFactorCodeComplete(code, length);

  const frame = {
    brand: brand ?? (
      <span className="inline-flex size-11 items-center justify-center rounded-full bg-accent-subtle text-accent-strong">
        <ShieldCheckIcon aria-hidden weight="bold" className="size-5" />
      </span>
    ),
    footer:
      back === undefined ? undefined : (
        <>
          Not you? <AuthLink to={back}>Sign in as someone else</AuthLink>
        </>
      ),
    className,
  };

  if (mode === 'backup' && onUseBackupCode !== undefined) {
    return (
      <BackupCode
        {...frame}
        pending={pending}
        error={hasError ? error : undefined}
        onSubmit={onUseBackupCode}
        onBack={() => {
          setMode('code');
        }}
      />
    );
  }

  const half = Math.ceil(length / 2);
  return (
    <AuthFrame
      {...frame}
      title={title ?? 'Enter your verification code'}
      description={twoFactorInstruction(method, length, destination)}
    >
      <form onSubmit={submit} noValidate className="flex flex-col gap-5">
        <Field invalid={hasError || incomplete}>
          <FieldLabel>Verification code</FieldLabel>
          <OTPField.Root
            length={length}
            value={code}
            onValueChange={(value) => {
              setCode(value);
              setTried(false);
            }}
            onValueComplete={verify}
            disabled={pending}
            className="group/otp flex items-center gap-1.5 @sm:gap-2"
          >
            {Array.from({ length }, (_, index) => (
              <Fragment key={index}>
                {index === half && (
                  <OTPField.Separator className="mx-0.5 h-px w-2.5 shrink-0 bg-line-strong @sm:w-3" />
                )}
                <OTPField.Input
                  aria-label={
                    index === 0 ? undefined : `Digit ${String(index + 1)} of ${String(length)}`
                  }
                  className={cn(
                    'h-12 w-full min-w-0 flex-1 rounded-(--rx-field-radius) border border-(--rx-field-border) bg-(--rx-field-background)',
                    'text-center font-numeric text-xl font-medium text-fg tabular-nums caret-accent',
                    'transition-[border-color,outline-color] duration-fast ease-standard hover:border-fg-subtle',
                    'outline-0 -outline-offset-1 outline-transparent focus-visible:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
                    'group-data-invalid/otp:border-negative group-data-disabled/otp:bg-surface-sunken group-data-disabled/otp:text-fg-disabled',
                  )}
                />
              </Fragment>
            ))}
          </OTPField.Root>
          {hasError ? (
            <FieldError>{error}</FieldError>
          ) : incomplete ? (
            <FieldError>Enter all {length} digits.</FieldError>
          ) : (
            <FieldDescription>
              Paste the whole code into the first box if you copied it.
            </FieldDescription>
          )}
        </Field>

        {rememberLabel !== undefined && (
          <label className="flex w-fit cursor-pointer items-center gap-2.5 text-sm text-fg-muted">
            <Checkbox checked={remember} onCheckedChange={setRemember} />
            {rememberLabel}
          </label>
        )}

        <Button type="submit" loading={pending} className="w-full">
          Verify
        </Button>

        {(canResend || onUseBackupCode !== undefined) && (
          <div className="flex flex-col items-center gap-1 border-t border-line pt-4 text-sm @sm:flex-row @sm:justify-between">
            {canResend && (
              <Button
                variant="ghost"
                size="sm"
                disabled={wait > 0}
                onClick={onResend}
                className="text-fg-muted"
              >
                <ArrowClockwiseIcon aria-hidden weight="bold" className="size-3.5" />
                {wait > 0 ? (
                  <span>
                    Send a new code in <span className="numeric">{formatTwoFactorWait(wait)}</span>
                  </span>
                ) : (
                  'Send a new code'
                )}
              </Button>
            )}
            {onUseBackupCode !== undefined && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setMode('backup');
                }}
                className="text-fg-muted"
              >
                <LifebuoyIcon aria-hidden weight="bold" className="size-3.5" />
                Use a backup code
              </Button>
            )}
          </div>
        )}
      </form>
    </AuthFrame>
  );
}

function BackupCode({
  pending,
  error,
  onSubmit,
  onBack,
  ...frame
}: {
  brand: ReactNode;
  footer: ReactNode;
  className: string | undefined;
  pending: boolean;
  error: ReactNode;
  onSubmit: (code: string) => void;
  onBack: () => void;
}) {
  const { Button } = useBlockParts();
  const [value, setValue] = useState('');
  const [tried, setTried] = useState(false);
  const problem = tried ? backupCodeError(value) : null;
  const shown = error ?? problem;

  const submit = (event: SyntheticEvent) => {
    event.preventDefault();
    setTried(true);
    if (pending || backupCodeError(value) !== null) return;
    onSubmit(normalizeBackupCode(value));
  };

  return (
    <AuthFrame
      {...frame}
      title="Use a backup code"
      description="Each of the codes you saved when you turned on two-step sign in works once."
    >
      <form onSubmit={submit} noValidate className="flex flex-col gap-5">
        <Field invalid={shown !== null}>
          <FieldLabel>Backup code</FieldLabel>
          <Input
            autoFocus
            autoComplete="one-time-code"
            spellCheck={false}
            value={value}
            placeholder="XXXXX-XXXXX"
            className="font-mono tracking-caps uppercase"
            onChange={(event) => {
              setValue(event.target.value);
            }}
          />
          {shown !== null ? (
            <FieldError>{shown}</FieldError>
          ) : (
            <FieldDescription>
              Spaces and hyphens are fine. Using one marks it spent.
            </FieldDescription>
          )}
        </Field>
        <div className="flex flex-col gap-2">
          <Button type="submit" loading={pending} className="w-full">
            Verify backup code
          </Button>
          <Button variant="ghost" className="w-full text-fg-muted" onClick={onBack}>
            Use my verification code instead
          </Button>
        </div>
      </form>
    </AuthFrame>
  );
}
