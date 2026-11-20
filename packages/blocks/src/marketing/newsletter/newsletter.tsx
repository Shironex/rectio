'use client';

import { CheckCircleIcon } from '@phosphor-icons/react';
import { Field, FieldError, FieldLabel, Input, cn } from '@rectio/ui';
import { useId, useState, type SyntheticEvent, type ReactNode } from 'react';

import { isEmail } from '../lib/marketing';
import { useMarketingParts } from '../lib/parts';
import { Container } from '../lib/section';

export interface NewsletterProps {
  title: ReactNode;
  description?: ReactNode;
  /**
   * Called with the address. Resolve when it is saved; throw an Error to show its message under the
   * field. The block holds no list and sends nothing itself.
   */
  onSubscribe: (email: string) => Promise<void> | void;
  /** `band` is a section of its own; `compact` fits a footer column or a sidebar. */
  layout?: 'band' | 'compact';
  /** One line under the form: what you send, how often, how to leave. */
  note?: ReactNode;
  label?: string;
  placeholder?: string;
  submitLabel?: string;
  /** Shown in place of the form once the address is saved. */
  successMessage?: ReactNode;
  className?: string;
}

type Status =
  | { state: 'idle' }
  | { state: 'sending' }
  | { state: 'done' }
  | { state: 'error'; message: string };

/**
 * An email signup. The address is checked before it is sent, the button holds its place while
 * sending, an error reads under the field, and success replaces the form with a status message
 * that assistive technology announces.
 */
export function Newsletter({
  title,
  description,
  onSubscribe,
  layout = 'band',
  note,
  label = 'Email address',
  placeholder = 'you@company.com',
  submitLabel = 'Subscribe',
  successMessage = 'Thanks. Check your inbox to confirm your address.',
  className,
}: NewsletterProps) {
  const { Button, Reveal } = useMarketingParts();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>({ state: 'idle' });
  const headingId = useId();
  const compact = layout === 'compact';

  async function submit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status.state === 'sending') return;
    if (!isEmail(email)) {
      setStatus({ state: 'error', message: 'Enter an email address such as name@company.com.' });
      return;
    }
    setStatus({ state: 'sending' });
    try {
      await onSubscribe(email.trim());
      setStatus({ state: 'done' });
    } catch (error) {
      setStatus({
        state: 'error',
        message: error instanceof Error ? error.message : 'That did not go through. Try again.',
      });
    }
  }

  const form =
    status.state === 'done' ? (
      <p className="flex items-start gap-2 text-base text-fg">
        <CheckCircleIcon
          aria-hidden
          weight="fill"
          className="mt-0.5 size-5 shrink-0 text-positive"
        />
        {successMessage}
      </p>
    ) : (
      <form noValidate onSubmit={(event) => void submit(event)} className="flex flex-col gap-3">
        <Field invalid={status.state === 'error'} className="flex-1">
          <FieldLabel className={cn(!compact && 'sr-only')}>{label}</FieldLabel>
          <div
            className={cn(
              'flex gap-2',
              compact ? 'flex-col @xs:flex-row' : 'flex-col @md:flex-row',
            )}
          >
            <Input
              type="email"
              name="email"
              autoComplete="email"
              placeholder={placeholder}
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                if (status.state === 'error') setStatus({ state: 'idle' });
              }}
              // Grow only in the row layout: a column basis of zero would collapse the field.
              className={compact ? '@xs:flex-1' : '@md:flex-1'}
            />
            <Button type="submit" size="md" loading={status.state === 'sending'}>
              {submitLabel}
            </Button>
          </div>
          {status.state === 'error' && <FieldError>{status.message}</FieldError>}
        </Field>
        {note !== undefined && <p className="text-sm text-fg-muted">{note}</p>}
      </form>
    );

  if (compact) {
    return (
      <section
        aria-labelledby={headingId}
        className={cn('@container flex flex-col gap-3', className)}
      >
        <h2 id={headingId} className="text-base font-strong text-fg">
          {title}
        </h2>
        {description !== undefined && <p className="text-sm text-fg-muted">{description}</p>}
        <div aria-live="polite">{form}</div>
      </section>
    );
  }

  return (
    <section
      aria-labelledby={headingId}
      data-slot="newsletter"
      className={cn('py-16 text-fg sm:py-24', className)}
    >
      <Container>
        <Reveal className="@container grid gap-8 border-y border-line py-12 lg:grid-cols-2 lg:items-center lg:gap-16">
          <div className="flex flex-col gap-3">
            <h2
              id={headingId}
              className="font-display text-3xl font-regular tracking-tight text-balance text-fg"
            >
              {title}
            </h2>
            {description !== undefined && (
              <p className="max-w-prose text-lg text-pretty text-fg-muted">{description}</p>
            )}
          </div>
          <div aria-live="polite">{form}</div>
        </Reveal>
      </Container>
    </section>
  );
}
