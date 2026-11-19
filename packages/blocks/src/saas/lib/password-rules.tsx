import { CheckIcon, CircleIcon } from '@phosphor-icons/react';
import { cn } from '@rectio/ui';

import { passwordChecks, passwordStrength, type PasswordStrength } from './saas';

const GRADES: Record<PasswordStrength, { label: string; filled: number; tone: string }> = {
  empty: { label: '', filled: 0, tone: 'bg-line-strong' },
  weak: { label: 'Weak', filled: 1, tone: 'bg-negative' },
  fair: { label: 'Fair', filled: 2, tone: 'bg-warning' },
  good: { label: 'Good', filled: 3, tone: 'bg-accent' },
  strong: { label: 'Strong', filled: 4, tone: 'bg-positive' },
};

/**
 * The rules a new password must meet, ticked off as they are typed, under a four-step strength
 * bar. The grade is written in words beside the bar and every rule says met or not met to screen
 * readers, so neither rests on colour.
 */
export function PasswordRules({
  password,
  minLength = 12,
  id,
}: {
  password: string;
  minLength?: number;
  /** Lets the password input point at the rules with `aria-describedby`. */
  id?: string;
}) {
  const strength = passwordStrength(password, minLength);
  const grade = GRADES[strength];
  return (
    <div id={id} className="flex flex-col gap-2.5">
      <div className="flex items-center gap-3">
        <div aria-hidden className="grid flex-1 grid-cols-4 gap-1">
          {[1, 2, 3, 4].map((step) => (
            <span
              key={step}
              className={cn(
                'h-1 rounded-full transition-colors duration-base ease-standard',
                step <= grade.filled ? grade.tone : 'bg-surface-sunken ring-1 ring-line ring-inset',
              )}
            />
          ))}
        </div>
        <span
          className={cn(
            'w-14 text-end text-sm font-medium text-fg-muted',
            strength === 'empty' && 'hidden',
          )}
        >
          <span className="sr-only">Password strength: </span>
          {grade.label}
        </span>
      </div>
      <ul className="grid gap-1 text-sm">
        {passwordChecks(password, minLength).map((check) => (
          <li
            key={check.id}
            className={cn(
              'flex items-center gap-2 transition-colors duration-fast ease-standard',
              check.met ? 'text-fg' : 'text-fg-muted',
            )}
          >
            {check.met ? (
              <CheckIcon
                aria-hidden
                weight="bold"
                className="size-3.5 shrink-0 text-positive-strong"
              />
            ) : (
              <CircleIcon aria-hidden weight="bold" className="size-3.5 shrink-0 text-fg-subtle" />
            )}
            <span>
              {check.label}
              <span className="sr-only">{check.met ? ', met' : ', not met yet'}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
