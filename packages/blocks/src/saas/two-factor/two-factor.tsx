import {
  Checkbox,
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  Input,
  OtpInput,
  cn,
  type OtpInputProps,
  touchHitArea,
} from '@rectio/ui';
import { useEffect, useRef, useState, type ReactNode, type SyntheticEvent } from 'react';

import { useBlockParts } from '../../lib/block-parts';
import { AuthFrame, AuthLink, type LinkTarget } from '../lib/auth';
import { focusFirstInvalid } from '../lib/focus';
import { inlineLink } from '../lib/styles';
import {
  backupCodeError,
  formatTwoFactorWait,
  maskTwoFactorDestination,
  normalizeBackupCode,
  twoFactorCodeComplete,
  twoFactorInstruction,
  twoFactorResendWait,
  type TwoFactorMethod,
} from './two-factor.logic';

/** The first slot of the code field, where typing and pasting start. */
const firstSlotOf = (root: HTMLElement | null) => root?.querySelector('input') ?? null;

export interface TwoFactorProps {
  /** Called with a complete code; `remember` when the person trusts this device. */
  onVerify: (code: string, options: { remember: boolean }) => void;
  method?: TwoFactorMethod;
  /** The phone number or email the code went to; shown masked. */
  destination?: string | undefined;
  /** Digits in the code, from 4 to 8. */
  length?: OtpInputProps['length'];
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
  /** A brand panel beside the form on wide containers; it folds away on narrow ones. */
  aside?: ReactNode;
  title?: ReactNode;
  /**
   * Focus the first slot on mount. Off by default, so an embedded block never takes focus from
   * the page; turn it on when the step is the whole page.
   */
  autoFocus?: boolean;
  className?: string;
}

/** Ticks once a second while a countdown runs, so the resend link can wake up. */
function useTicker(running: boolean): Date {
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
  aside,
  title,
  autoFocus = false,
  className,
}: TwoFactorProps) {
  const { Button } = useBlockParts();
  const [mode, setMode] = useState<'code' | 'backup'>('code');
  // Set once the person has switched views: the view that replaces another takes focus.
  const [switched, setSwitched] = useState(false);
  const [code, setCode] = useState('');
  const [remember, setRemember] = useState(false);
  const [tried, setTried] = useState(false);
  const canResend = onResend !== undefined && method !== 'app';
  const hasError = error !== undefined && error !== null && error !== false;
  const slots = useRef<HTMLDivElement>(null);
  // Opt in, read once: an embedded block must not take focus from the page.
  const focusOnMount = useRef(autoFocus);
  useEffect(() => {
    if (focusOnMount.current) firstSlotOf(slots.current)?.focus();
  }, []);
  // A refused code sends focus back to the start, ready for the next attempt. Only on the change
  // to refused: a parent re-render with the same error must not pull focus again.
  const hadError = useRef(false);
  useEffect(() => {
    if (hasError && !hadError.current) firstSlotOf(slots.current)?.focus();
    hadError.current = hasError;
  }, [hasError]);

  const verify = (value: string) => {
    if (pending || !twoFactorCodeComplete(value, length)) return;
    onVerify(value, { remember });
  };
  const submit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTried(true);
    if (!twoFactorCodeComplete(code, length)) {
      focusFirstInvalid(event.currentTarget);
      return;
    }
    verify(code);
  };
  const incomplete = tried && !twoFactorCodeComplete(code, length);

  const frame = {
    brand,
    aside,
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
          setSwitched(true);
        }}
      />
    );
  }

  const half = Math.ceil(length / 2);
  return (
    <AuthFrame
      {...frame}
      focusHeading={switched}
      title={title ?? 'Enter your verification code'}
      description={<Instruction method={method} length={length} destination={destination} />}
    >
      <form onSubmit={submit} noValidate className="flex flex-col gap-5">
        <Field invalid={hasError || incomplete}>
          <FieldLabel>Verification code</FieldLabel>
          <OtpInput
            ref={slots}
            length={length}
            groups={[half, length - half]}
            value={code}
            onValueChange={(value) => {
              setCode(value);
              setTried(false);
            }}
            onComplete={verify}
            slotLabel={(position, total) => `Digit ${String(position)} of ${String(total)}`}
            // Read only, not disabled, while checking: disabling drops focus to the page.
            readOnly={pending}
            aria-busy={pending}
          />
          {/* The error sits right under the slots; the paste hint follows it. */}
          {hasError ? (
            <FieldError>{error}</FieldError>
          ) : (
            incomplete && <FieldError>Enter all {length} digits.</FieldError>
          )}
          <FieldDescription>
            Paste the whole code into the first box if you copied it.
          </FieldDescription>
        </Field>

        {rememberLabel !== undefined && (
          <label className="flex w-fit cursor-pointer items-center gap-2.5 text-sm text-fg-muted">
            <Checkbox checked={remember} onCheckedChange={setRemember} />
            {rememberLabel}
          </label>
        )}

        {/* The code is checked on the last digit; this button is for paste and assistive use. */}
        <Button type="submit" loading={pending} className="w-full">
          Verify
        </Button>

        {(canResend || onUseBackupCode !== undefined) && (
          <div className="flex items-center justify-between gap-3 border-t border-line pt-4 text-sm">
            {canResend && (
              <ResendButton onResend={onResend} sentAt={sentAt} cooldown={resendCooldown} />
            )}
            {onUseBackupCode !== undefined && (
              <AuthLink
                to={() => {
                  setMode('backup');
                  setSwitched(true);
                }}
                className="ms-auto"
              >
                Use a backup code
              </AuthLink>
            )}
          </div>
        )}
      </form>
    </AuthFrame>
  );
}

/** The line under the heading, with the masked number or address kept on one line. */
function Instruction({
  method,
  length,
  destination,
}: {
  method: TwoFactorMethod;
  length: number;
  destination: string | undefined;
}) {
  const text = twoFactorInstruction(method, length, destination);
  const masked =
    method === 'app' || destination === undefined
      ? undefined
      : maskTwoFactorDestination(destination, method);
  const at = masked === undefined ? -1 : text.indexOf(masked);
  return (
    <>
      {at < 0 || masked === undefined ? (
        text
      ) : (
        <>
          {text.slice(0, at)}
          <span className="whitespace-nowrap">{masked}</span>
          {text.slice(at + masked.length)}
        </>
      )}{' '}
      We check it as soon as you enter the last digit.
    </>
  );
}

/**
 * "Send a new code", held back until the cooldown ends. It owns the one-second tick, so only this
 * link re-renders while it counts down, not the code slots.
 */
function ResendButton({
  onResend,
  sentAt,
  cooldown,
}: {
  onResend: () => void;
  sentAt: Date | undefined;
  cooldown: number;
}) {
  const now = useTicker(sentAt !== undefined);
  const wait = twoFactorResendWait(sentAt, now, cooldown);
  return (
    <button
      type="button"
      disabled={wait > 0}
      onClick={onResend}
      className={cn(
        inlineLink,
        'relative',
        touchHitArea,
        // The countdown stays readable: muted text, only the link's underline goes.
        'disabled:cursor-not-allowed disabled:font-regular disabled:text-fg-muted disabled:no-underline',
      )}
    >
      {wait > 0 ? (
        <>
          New code in <span className="numeric">{formatTwoFactorWait(wait)}</span>
        </>
      ) : (
        'Send a new code'
      )}
    </button>
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
  aside: ReactNode;
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

  const submit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTried(true);
    if (backupCodeError(value) !== null) {
      focusFirstInvalid(event.currentTarget);
      return;
    }
    if (pending) return;
    onSubmit(normalizeBackupCode(value));
  };

  return (
    <AuthFrame
      {...frame}
      // This view replaces the code step, so focus moves to its heading.
      focusHeading
      title="Use a backup code"
      description="Each of the codes you saved when you turned on two-step sign in works once."
    >
      <form onSubmit={submit} noValidate className="flex flex-col gap-5">
        <Field invalid={shown !== null}>
          <FieldLabel>Backup code</FieldLabel>
          <Input
            autoComplete="one-time-code"
            spellCheck={false}
            value={value}
            placeholder="XXXXX-XXXXX"
            className="font-mono tracking-caps uppercase"
            onChange={(event) => {
              setValue(event.target.value);
            }}
          />
          <FieldDescription>
            Spaces and hyphens are fine. Using one marks it spent.
          </FieldDescription>
          {shown !== null && <FieldError>{shown}</FieldError>}
        </Field>
        <Button type="submit" loading={pending} className="w-full">
          Verify backup code
        </Button>
        <div className="flex justify-center border-t border-line pt-4 text-sm">
          <AuthLink to={onBack}>Use my verification code instead</AuthLink>
        </div>
      </form>
    </AuthFrame>
  );
}
