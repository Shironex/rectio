'use client';

import { CheckCircleIcon, CopyIcon } from '@phosphor-icons/react';
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
import { useEffect, useId, useRef, useState, type SyntheticEvent } from 'react';

import { ROLES } from '@/data/launch';
import { SITE, STORAGE } from '@/data/site';
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
/** The place in line, with the invite link that moves it up. */
function Joined({ entry, focus }: { entry: WaitlistEntry; focus: boolean }) {
  const [copied, setCopied] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const link = `${SITE.url}/?ref=${String(entry.position)}`;
  // Focus the result once, right after joining, so a keyboard lands on the news.
  useEffect(() => {
    if (focus) heading.current?.focus();
  }, [focus]);
  return (
    <div className="flex flex-col items-start gap-4">
      <CheckCircleIcon aria-hidden weight="fill" className="size-10 text-positive" />
      <h3
        tabIndex={-1}
        ref={heading}
        className="font-display text-3xl font-strong tracking-tight text-balance text-fg outline-none"
      >
        You are number <span className="numeric">{entry.position.toLocaleString('en-GB')}</span>
      </h3>
      <p className="max-w-prose text-base text-fg-muted">
        We will write to {entry.email} when your wave opens. Each teammate who joins with your link
        moves you up ten places.
      </p>
      <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
        <code className="min-w-0 flex-1 truncate rounded-control border border-line bg-surface-sunken px-3 py-2 text-sm text-fg">
          {link}
        </code>
        <Button
          variant="secondary"
          onClick={() => {
            navigator.clipboard.writeText(link).then(
              () => {
                setCopied(true);
                setTimeout(() => {
                  setCopied(false);
                }, 2000);
              },
              () => {
                // Clipboard blocked: the link stays on screen to copy by hand.
              },
            );
          }}
        >
          <CopyIcon aria-hidden weight="bold" />
          {copied ? 'Link copied' : 'Copy invite link'}
        </Button>
        <span role="status" className="sr-only">
          {copied ? 'Invite link copied' : ''}
        </span>
      </div>
      <button
        type="button"
        onClick={() => {
          writeStored(STORAGE.waitlist, null);
        }}
        className="inline-flex min-h-(--rx-button-height-md) cursor-pointer items-center rounded-control text-sm text-fg-muted underline underline-offset-4 outline-offset-2 focus-visible:outline-2 focus-visible:outline-focus pointer-coarse:min-h-(--rx-button-height-touch) pointer-fine:hover:text-fg"
      >
        Wrong address? Use a different email
      </button>
    </div>
  );
}

export function WaitlistForm() {
  const raw = useStored(STORAGE.waitlist);
  const saved = parseEntry(raw);
  const [joinedNow, setJoinedNow] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [beta, setBeta] = useState(false);
  const emailInput = useRef<HTMLInputElement>(null);
  const statusId = useId();

  const submit = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFailure(null);
    if (!isEmail(email)) {
      setError('Enter a work email, such as you@company.com.');
      emailInput.current?.focus();
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const entry = await joinWaitlist({ email, role: role ?? '', beta });
      setJoinedNow(true);
      writeStored(STORAGE.waitlist, JSON.stringify(entry));
    } catch (caught) {
      setFailure(caught instanceof Error ? caught.message : 'Something went wrong. Try again.');
    } finally {
      setBusy(false);
    }
  };

  // One live region holds both states, so joining is announced and nothing jumps on a return visit.
  return (
    <div aria-live="polite" className={raw === undefined ? 'min-h-96' : undefined}>
      {raw === undefined ? null : saved !== null ? (
        <Joined entry={saved} focus={joinedNow} />
      ) : (
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
              ref={emailInput}
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
            <Checkbox
              checked={beta}
              onCheckedChange={(checked) => {
                setBeta(checked);
              }}
            />
            Invite me to a beta session with the team
          </label>
          {failure !== null && (
            <p id={statusId} className="text-sm text-negative-strong">
              {failure}
            </p>
          )}
          <Button type="submit" size="lg" loading={busy} className="w-full sm:w-fit">
            Join the waitlist
          </Button>
          <p className="text-sm text-fg-muted">
            We use your email for the waitlist and launch news only. Unsubscribe in one click.
          </p>
        </form>
      )}
    </div>
  );
}
