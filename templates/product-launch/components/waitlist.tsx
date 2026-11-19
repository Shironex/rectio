'use client';

import { CheckCircleIcon } from '@phosphor-icons/react';
import { isEmail } from '@rectio/blocks/marketing';
import { Button } from '@rectio/motion';
import {
  Checkbox,
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@rectio/ui';
import { useId, useState, type SyntheticEvent } from 'react';

import { ROLES } from '@/data/launch';
import { STORAGE } from '@/data/site';
import { joinWaitlist, type WaitlistEntry } from '@/lib/waitlist';
import { useStored, writeStored } from '@/lib/stored';

function parseEntry(raw: string | null | undefined): WaitlistEntry | null {
  if (raw == null) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== 'object' || value === null) return null;
    const entry = value as Partial<WaitlistEntry>;
    return typeof entry.email === 'string' && typeof entry.position === 'number'
      ? { email: entry.email, position: entry.position }
      : null;
  } catch {
    return null;
  }
}

/**
 * The waitlist signup: email, role and an opt-in, checked before sending, with a busy state, an
 * error from the server and the visitor's place in line once they are in. A return visit shows
 * the place again instead of the form.
 */
export function WaitlistForm() {
  const saved = parseEntry(useStored(STORAGE.waitlist));
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const statusId = useId();

  if (saved !== null) {
    return (
      <div role="status" className="flex flex-col items-start gap-3">
        <CheckCircleIcon aria-hidden weight="fill" className="size-10 text-positive" />
        <p className="font-display text-3xl font-strong tracking-tight text-fg">
          You are number <span className="numeric">{saved.position.toLocaleString('en-GB')}</span>
        </p>
        <p className="max-w-prose text-base text-fg-muted">
          We will write to {saved.email} when your wave opens. Move up the list by inviting a
          teammate: each one who joins moves you ten places.
        </p>
      </div>
    );
  }

  const submit = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFailure(null);
    if (!isEmail(email)) {
      setError('Enter a work email, such as you@company.com.');
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const entry = await joinWaitlist({ email, role: role ?? '' });
      writeStored(STORAGE.waitlist, JSON.stringify(entry));
    } catch (caught) {
      setFailure(caught instanceof Error ? caught.message : 'Something went wrong. Try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      noValidate
      aria-describedby={failure === null ? undefined : statusId}
      onSubmit={(event) => {
        void submit(event);
      }}
      className="flex flex-col gap-5"
    >
      <Field invalid={error !== null}>
        <FieldLabel>Work email</FieldLabel>
        <Input
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
          }}
        />
        {error !== null && <FieldError>{error}</FieldError>}
      </Field>
      <Field>
        <FieldLabel>Your role</FieldLabel>
        <Select items={[...ROLES]} value={role} onValueChange={setRole}>
          <SelectTrigger placeholder="Choose a role" />
          <SelectContent>
            {ROLES.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldDescription>Optional. It helps us pick who joins each wave.</FieldDescription>
      </Field>
      <label className="flex min-h-(--rx-button-height-md) cursor-pointer items-center gap-3 text-base text-fg pointer-coarse:min-h-(--rx-button-height-touch)">
        <Checkbox />
        Invite me to a beta session with the team
      </label>
      {failure !== null && (
        <p id={statusId} role="alert" className="text-sm text-negative-strong">
          {failure}
        </p>
      )}
      <Button type="submit" size="lg" loading={busy} className="w-full sm:w-fit">
        Join the waitlist
      </Button>
    </form>
  );
}
