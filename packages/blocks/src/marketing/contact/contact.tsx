'use client';

import { CheckCircleIcon } from '@phosphor-icons/react';
import {
  Checkbox,
  Field,
  FieldError,
  FieldLabel,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  cn,
} from '@rectio/ui';
import { useId, useState, type SyntheticEvent, type ReactNode } from 'react';

import { Anchor, linkFocus } from '../lib/action';
import { useMarketingParts } from '../lib/parts';
import { Section, SectionHeader, useHeadingId, type SectionTone } from '../lib/section';
import { Textarea } from '../lib/textarea';
import {
  EMPTY_CONTACT,
  validateContact,
  type ContactErrors,
  type ContactValues,
} from './contact.logic';

export interface ContactChannel {
  id: string;
  label: string;
  /** What to show, such as an address, a phone number or office hours. */
  value: string;
  href?: string;
  /** An icon from your set. */
  icon?: ReactNode;
}

export interface ContactSectionProps {
  title: ReactNode;
  description?: ReactNode;
  eyebrow?: ReactNode;
  /**
   * Called with the checked values. Resolve when the message is on its way; throw an Error to show
   * its message above the button. The block sends nothing itself.
   */
  onSubmit: (values: ContactValues) => Promise<void> | void;
  /** Ways to reach you besides the form, listed beside it. */
  channels?: readonly ContactChannel[];
  /** Topics to choose from, such as Sales, Support and Press. Leave out for no topic field. */
  topics?: readonly { value: string; label: string }[];
  /** Asks the sender to agree before sending, with this label. */
  consentLabel?: ReactNode;
  submitLabel?: string;
  successTitle?: string;
  successMessage?: ReactNode;
  tone?: SectionTone;
  className?: string;
}

type Status = 'idle' | 'sending' | 'sent';

/**
 * A contact section: a heading and other ways to reach you on one side, a form on the other. Every
 * field says what to fix in words, the first invalid field takes focus, the button holds its place
 * while sending, and a sent message replaces the form with a confirmation.
 */
export function ContactSection({
  title,
  description,
  eyebrow,
  onSubmit,
  channels = [],
  topics,
  consentLabel,
  submitLabel = 'Send message',
  successTitle = 'Message sent',
  successMessage = 'Thanks for writing. We reply within one working day.',
  tone,
  className,
}: ContactSectionProps) {
  const { Button, Reveal } = useMarketingParts();
  const headingId = useHeadingId();
  const formId = useId();
  const [values, setValues] = useState<ContactValues>(EMPTY_CONTACT);
  const [errors, setErrors] = useState<ContactErrors>({});
  const [failure, setFailure] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const needsTopic = topics !== undefined && topics.length > 0;
  const needsConsent = consentLabel !== undefined;

  function update<K extends keyof ContactValues>(key: K, value: ContactValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    if (errors[key] !== undefined) setErrors((current) => ({ ...current, [key]: undefined }));
  }

  async function submit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === 'sending') return;
    const found = validateContact(values, { needsTopic, needsConsent });
    setErrors(found);
    setFailure(null);
    const first = (Object.keys(found) as (keyof ContactValues)[])[0];
    if (first !== undefined) {
      event.currentTarget
        .querySelector<HTMLElement>(`[name="${first}"], [data-field="${first}"] button`)
        ?.focus();
      return;
    }
    setStatus('sending');
    try {
      await onSubmit(values);
      setStatus('sent');
    } catch (error) {
      setStatus('idle');
      setFailure(
        error instanceof Error ? error.message : 'The message did not go through. Try again.',
      );
    }
  }

  return (
    <Section tone={tone} width="wide" labelledBy={headingId} className={className}>
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="flex flex-col gap-10 lg:col-span-5">
          <SectionHeader id={headingId} title={title} description={description} eyebrow={eyebrow} />
          {channels.length > 0 && (
            <Reveal as="dl" stagger className="flex flex-col gap-6 border-t border-line pt-8">
              {channels.map((channel) => (
                <div key={channel.id} className="flex items-start gap-4">
                  {channel.icon !== undefined && (
                    <span
                      aria-hidden
                      className="inline-flex size-10 shrink-0 items-center justify-center rounded-control bg-accent-subtle text-accent-strong [&_svg]:size-5"
                    >
                      {channel.icon}
                    </span>
                  )}
                  <div className="flex flex-col gap-0.5">
                    <dt className="text-sm text-fg-muted">{channel.label}</dt>
                    <dd className="text-base font-medium text-fg">
                      {channel.href === undefined ? (
                        channel.value
                      ) : (
                        <Anchor
                          href={channel.href}
                          className={cn(
                            'underline-offset-4 pointer-fine:hover:underline',
                            linkFocus,
                          )}
                        >
                          {channel.value}
                        </Anchor>
                      )}
                    </dd>
                  </div>
                </div>
              ))}
            </Reveal>
          )}
        </div>
        <Reveal className="lg:col-span-7">
          <div
            aria-live="polite"
            className="rounded-panel border border-line bg-surface p-6 shadow-raised sm:p-8"
          >
            {status === 'sent' ? (
              <div className="flex flex-col items-start gap-3 py-10">
                <CheckCircleIcon aria-hidden weight="fill" className="size-8 text-positive" />
                <h3 className="font-display text-2xl font-regular tracking-tight text-fg">
                  {successTitle}
                </h3>
                <p className="max-w-prose text-base text-fg-muted">{successMessage}</p>
              </div>
            ) : (
              <form
                id={formId}
                noValidate
                aria-label="Contact form"
                onSubmit={(event) => void submit(event)}
                className="grid gap-5 @lg:grid-cols-2"
              >
                <Field invalid={errors.name !== undefined}>
                  <FieldLabel>Name</FieldLabel>
                  <Input
                    name="name"
                    autoComplete="name"
                    value={values.name}
                    onChange={(event) => {
                      update('name', event.target.value);
                    }}
                  />
                  {errors.name !== undefined && <FieldError>{errors.name}</FieldError>}
                </Field>
                <Field invalid={errors.email !== undefined}>
                  <FieldLabel>Work email</FieldLabel>
                  <Input
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={values.email}
                    onChange={(event) => {
                      update('email', event.target.value);
                    }}
                  />
                  {errors.email !== undefined && <FieldError>{errors.email}</FieldError>}
                </Field>
                <Field className={cn(!needsTopic && '@lg:col-span-2')}>
                  <FieldLabel optional>Company</FieldLabel>
                  <Input
                    name="company"
                    autoComplete="organization"
                    value={values.company}
                    onChange={(event) => {
                      update('company', event.target.value);
                    }}
                  />
                </Field>
                {needsTopic && (
                  <Field invalid={errors.topic !== undefined} data-field="topic">
                    <FieldLabel>Topic</FieldLabel>
                    <Select
                      items={topics}
                      value={values.topic === '' ? null : values.topic}
                      onValueChange={(value) => {
                        update('topic', value ?? '');
                      }}
                    >
                      <SelectTrigger placeholder="Choose a topic" />
                      <SelectContent>
                        {topics.map((topic) => (
                          <SelectItem key={topic.value} value={topic.value}>
                            {topic.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.topic !== undefined && <FieldError>{errors.topic}</FieldError>}
                  </Field>
                )}
                <Field invalid={errors.message !== undefined} className="@lg:col-span-2">
                  <FieldLabel>Message</FieldLabel>
                  <Textarea
                    name="message"
                    rows={5}
                    value={values.message}
                    onChange={(event) => {
                      update('message', event.target.value);
                    }}
                  />
                  {errors.message !== undefined && <FieldError>{errors.message}</FieldError>}
                </Field>
                {needsConsent && (
                  <Field invalid={errors.consent !== undefined} className="@lg:col-span-2">
                    <FieldLabel className="items-start gap-3 font-regular text-fg-muted">
                      <Checkbox
                        name="consent"
                        checked={values.consent}
                        onCheckedChange={(checked) => {
                          update('consent', checked);
                        }}
                        className="mt-0.5"
                      />
                      <span>{consentLabel}</span>
                    </FieldLabel>
                    {errors.consent !== undefined && <FieldError>{errors.consent}</FieldError>}
                  </Field>
                )}
                <div className="flex flex-col gap-3 @lg:col-span-2">
                  {failure !== null && (
                    <p role="alert" className="text-sm text-negative-strong">
                      {failure}
                    </p>
                  )}
                  <div>
                    <Button type="submit" size="lg" loading={status === 'sending'}>
                      {submitLabel}
                    </Button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
