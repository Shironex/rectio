import {
  CheckCircleIcon,
  ClockIcon,
  ImageIcon,
  TrashIcon,
  WarningCircleIcon,
} from '@phosphor-icons/react';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  cn,
} from '@rectio/ui';
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type SyntheticEvent,
} from 'react';

import { useBlockParts } from '../../lib/block-parts';
import { BlockPanel } from '../../lib/block-panel';
import { resolveLocale } from '../../lib/finance';
import { FormMessage } from '../lib/auth';
import { Avatar } from '../lib/avatar';
import { focusFirstInvalid, useNow } from '../lib/focus';
import { dateFormat, hasErrors, countLabel } from '../lib/saas';
import {
  profileChanges,
  profileDeleteConfirmed,
  profileEmailChanged,
  profileErrors,
  profileLocalTime,
  timeZoneLabel,
  type ProfileErrors,
  type ProfileValues,
} from './profile-settings.logic';

export interface ProfileSettingsProps {
  /** What is saved now. The form starts from it and starts again whenever it changes. */
  profile: ProfileValues & { avatarUrl?: string | undefined; emailVerified?: boolean };
  /** Called with the edited values and the fields that changed. */
  onSave: (values: ProfileValues, changed: (keyof ProfileValues)[]) => void;
  /** Offers "Upload picture"; called with the chosen image file. */
  onAvatarChange?: (file: File) => void;
  onAvatarRemove?: () => void;
  /** Offers "Resend link" while the email is unverified. */
  onResendVerification?: () => void;
  /** Shows the danger zone. Called once the email has been typed back to confirm. */
  onDeleteAccount?: () => void;
  /** IANA time zones to offer. Defaults to a short list around the saved one. */
  timeZones?: readonly string[];
  /** When the profile was last saved: the bar then says "Saved at 14:32". */
  savedAt?: Date | undefined;
  /** Saving is in flight. */
  pending?: boolean;
  error?: ReactNode;
  /** The moment time zone offsets are read at, so the labels agree with your server. */
  now?: Date;
  locale?: string;
  title?: string;
  className?: string;
}

const DEFAULT_ZONES = [
  'Europe/London',
  'Europe/Lisbon',
  'Europe/Berlin',
  'Europe/Warsaw',
  'America/New_York',
  'America/Los_Angeles',
  'Asia/Tokyo',
  'Australia/Sydney',
];

/** One settings row: what it is on the left, the controls on the right; stacked when narrow. */
function Row({
  title,
  hint,
  children,
  danger = false,
  className,
}: {
  title: ReactNode;
  hint?: ReactNode;
  children: ReactNode;
  /** Set on the danger zone: the title takes the negative tone. */
  danger?: boolean;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col gap-3 py-5 first:pt-6 @2xl:flex-row @2xl:gap-10', className)}>
      <div className="flex flex-col gap-0.5 @2xl:w-52 @2xl:shrink-0">
        <h3 className={cn('text-base font-medium', danger && 'text-negative-strong')}>{title}</h3>
        {hint !== undefined && <p className="text-sm text-pretty text-fg-muted">{hint}</p>}
      </div>
      {/* A field column about a form's width: no long empty inputs on a wide panel. */}
      <div className="flex w-full max-w-lg min-w-0 flex-1 flex-col gap-4">{children}</div>
    </div>
  );
}

/**
 * The person's own profile: picture, name, email with its verification state, job title and time
 * zone, saved together from a bar that appears only when something changed, with Discard beside
 * it. A danger zone at the end deletes the account after the email is typed back.
 */
export function ProfileSettings({
  profile,
  onSave,
  onAvatarChange,
  onAvatarRemove,
  onResendVerification,
  onDeleteAccount,
  timeZones,
  savedAt,
  pending = false,
  error,
  now: requestedNow,
  locale: requestedLocale,
  title = 'Profile',
  className,
}: ProfileSettingsProps) {
  const locale = resolveLocale(requestedLocale);
  const now = useNow(requestedNow);
  const { Button } = useBlockParts();
  const fileRef = useRef<HTMLInputElement>(null);
  const [saved, setSaved] = useState(profile);
  const [draft, setDraft] = useState<ProfileValues>(profile);
  const [tried, setTried] = useState(false);
  const [deleting, setDeleting] = useState(false);
  // A saved profile with new values restarts the form from it. Compared by value, so a parent
  // passing a fresh object with the same values on every render keeps the edits in progress.
  if (profileChanges(saved, profile).length > 0) {
    setSaved(profile);
    setDraft(profile);
    setTried(false);
  }
  const changed = profileChanges(profile, draft);
  const dirty = changed.length > 0;
  const showActions = dirty || pending;
  const statusRef = useRef<HTMLParagraphElement>(null);
  // Discard and Save leave once the form is clean. If focus went with them, hand it to the
  // status line instead of dropping it on the page.
  const hadActions = useRef(showActions);
  useEffect(() => {
    const left = hadActions.current && !showActions;
    hadActions.current = showActions;
    if (left && (document.activeElement === null || document.activeElement === document.body)) {
      statusRef.current?.focus();
    }
  }, [showActions]);
  const errors: ProfileErrors = tried ? profileErrors(draft) : {};
  const emailChanged = profileEmailChanged(profile, draft);
  const savedZone = profile.timeZone;
  const zoneItems = useMemo(
    () =>
      [...new Set([savedZone, ...(timeZones ?? DEFAULT_ZONES)])].map((zone) => ({
        value: zone,
        label: timeZoneLabel(zone, now, locale),
      })),
    [savedZone, timeZones, locale, now],
  );

  const set = (field: keyof ProfileValues, value: string) => {
    setDraft({ ...draft, [field]: value });
  };
  const submit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTried(true);
    if (hasErrors(profileErrors(draft))) {
      focusFirstInvalid(event.currentTarget);
      return;
    }
    if (pending || !dirty) return;
    const trimmed: ProfileValues = {
      name: draft.name.trim(),
      email: draft.email.trim(),
      jobTitle: draft.jobTitle.trim(),
      timeZone: draft.timeZone,
    };
    onSave(trimmed, changed);
  };

  return (
    <BlockPanel
      title={title}
      description="How you appear to your team, and where your notifications go."
      className={className}
      bodyClassName="gap-0"
    >
      {/* Fields scrolled into view stop above the sticky save bar, not under it. */}
      <form
        onSubmit={submit}
        noValidate
        className="flex flex-col [&_button]:scroll-mb-24 [&_input]:scroll-mb-24"
      >
        {error !== undefined && error !== null && error !== false && (
          <div className="pb-5">
            <FormMessage tone="error" title={error} />
          </div>
        )}
        {/* From @4xl the right side holds a live preview, so the form is not left-heavy. */}
        <div className="flex flex-col @4xl:flex-row @4xl:items-start @4xl:gap-8">
          <div className="flex min-w-0 flex-1 flex-col divide-y divide-line">
            <Row title="Picture" hint="Square images work best, at least 256 pixels wide.">
              <div className="flex flex-wrap items-center gap-4">
                <Avatar
                  name={profile.name}
                  src={profile.avatarUrl}
                  size="lg"
                  className="size-20 text-2xl"
                />
                <div className="flex flex-wrap items-center gap-2 pointer-coarse:gap-touch-gap">
                  {onAvatarChange !== undefined && (
                    <>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          fileRef.current?.click();
                        }}
                      >
                        <ImageIcon aria-hidden weight="bold" className="size-3.5" />
                        {profile.avatarUrl === undefined ? 'Upload picture' : 'Change picture'}
                      </Button>
                      <input
                        ref={fileRef}
                        type="file"
                        accept="image/png, image/jpeg, image/webp"
                        aria-label="Choose a profile picture"
                        className="sr-only"
                        tabIndex={-1}
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file !== undefined) onAvatarChange(file);
                          event.target.value = '';
                        }}
                      />
                    </>
                  )}
                  {onAvatarRemove !== undefined && profile.avatarUrl !== undefined && (
                    <Button variant="ghost" size="sm" onClick={onAvatarRemove}>
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            </Row>

            <Row title="Name and role" hint="Shown on comments, mentions and approvals.">
              <Field invalid={errors.name !== undefined}>
                <FieldLabel>Full name</FieldLabel>
                <Input
                  name="name"
                  autoComplete="name"
                  value={draft.name}
                  onChange={(event) => {
                    set('name', event.target.value);
                  }}
                />
                {errors.name !== undefined && <FieldError>{errors.name}</FieldError>}
              </Field>
              <Field>
                <FieldLabel optional>Job title</FieldLabel>
                <Input
                  name="job-title"
                  autoComplete="organization-title"
                  value={draft.jobTitle}
                  placeholder="For example: Finance lead"
                  onChange={(event) => {
                    set('jobTitle', event.target.value);
                  }}
                />
              </Field>
            </Row>

            <Row title="Email" hint="Where sign-in links, invites and notifications go.">
              <Field invalid={errors.email !== undefined}>
                {/* The row names the field; the label stays for screen readers. */}
                <FieldLabel className="sr-only">Email address</FieldLabel>
                <Input
                  type="email"
                  name="email"
                  autoComplete="email"
                  inputMode="email"
                  spellCheck={false}
                  value={draft.email}
                  onChange={(event) => {
                    set('email', event.target.value);
                  }}
                />
                {errors.email !== undefined ? (
                  <FieldError>{errors.email}</FieldError>
                ) : emailChanged ? (
                  <FieldDescription>
                    We will send a link to the new address. The old one stays until it is confirmed.
                  </FieldDescription>
                ) : profile.emailVerified === false ? (
                  <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
                    <FieldDescription className="flex items-center gap-1.5 text-sm">
                      <WarningCircleIcon
                        aria-hidden
                        weight="bold"
                        className="size-4 shrink-0 text-warning-strong"
                      />
                      <span className="font-medium text-warning-strong">Not verified.</span>
                      Confirm it from the link we sent.
                    </FieldDescription>
                    {onResendVerification !== undefined && (
                      <Button variant="secondary" size="sm" onClick={onResendVerification}>
                        Resend the link
                      </Button>
                    )}
                  </div>
                ) : (
                  <FieldDescription className="flex items-center gap-1.5">
                    <CheckCircleIcon
                      aria-hidden
                      weight="bold"
                      className="size-3.5 shrink-0 text-positive-strong"
                    />
                    Verified
                  </FieldDescription>
                )}
              </Field>
            </Row>

            <Row title="Time zone" hint="Due dates, digests and quiet hours follow it.">
              <Field>
                <FieldLabel className="sr-only">Time zone</FieldLabel>
                <Select
                  items={zoneItems}
                  value={draft.timeZone}
                  onValueChange={(next) => {
                    if (typeof next === 'string') set('timeZone', next);
                  }}
                >
                  <SelectTrigger />
                  <SelectContent>
                    {zoneItems.map((zone) => (
                      <SelectItem key={zone.value} value={zone.value}>
                        {zone.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </Row>
          </div>
          <ProfilePreview
            name={draft.name}
            jobTitle={draft.jobTitle}
            avatarUrl={profile.avatarUrl}
            time={profileLocalTime(draft.timeZone, now, locale)}
          />
        </div>

        {/* -mx-5 and px-5 match BlockPanel's body padding, so the bar runs edge to edge. */}
        <div
          className={cn(
            'sticky bottom-0 z-10 -mx-5 mt-2 flex flex-wrap items-center gap-3 border-t border-line bg-surface px-5 py-3',
            showActions ? 'justify-between' : 'justify-end',
          )}
        >
          {/* Takes focus when Discard or Save goes away under the keyboard. */}
          <p
            ref={statusRef}
            tabIndex={-1}
            className="flex items-center gap-1.5 rounded-badge text-sm text-fg-muted outline-offset-2 focus-visible:outline-2 focus-visible:outline-focus"
            aria-live="polite"
          >
            {dirty ? (
              <span className="font-medium text-fg">
                {countLabel(changed.length, 'unsaved change')}
              </span>
            ) : (
              <>
                <CheckCircleIcon
                  aria-hidden
                  weight="bold"
                  className="size-4 shrink-0 text-positive-strong"
                />
                {savedAt === undefined
                  ? 'All changes saved'
                  : `Saved at ${dateFormat(locale, { timeStyle: 'short' }).format(savedAt)}`}
              </>
            )}
          </p>
          {showActions && (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                disabled={pending}
                onClick={() => {
                  setDraft(profile);
                  setTried(false);
                }}
              >
                Discard
              </Button>
              <Button type="submit" loading={pending}>
                Save changes
              </Button>
            </div>
          )}
        </div>
      </form>

      {onDeleteAccount !== undefined && (
        <Row
          danger
          title="Danger zone"
          hint="Removes your profile and signs you out everywhere. Work you shared stays with the team."
          className="mt-6 rounded-panel border border-negative-strong/30 bg-negative-subtle/40 px-5"
        >
          <div>
            <Button
              variant="danger"
              onClick={() => {
                setDeleting(true);
              }}
            >
              <TrashIcon aria-hidden weight="bold" className="size-4" />
              Delete account
            </Button>
          </div>
        </Row>
      )}

      <DeleteDialog
        open={deleting}
        email={profile.email}
        onCancel={() => {
          setDeleting(false);
        }}
        onConfirm={() => {
          setDeleting(false);
          onDeleteAccount?.();
        }}
      />
    </BlockPanel>
  );
}

/** How teammates see you, updated as you type: picture, name, role and local time. */
function ProfilePreview({
  name,
  jobTitle,
  avatarUrl,
  time,
}: {
  name: string;
  jobTitle: string;
  avatarUrl: string | undefined;
  time: string;
}) {
  return (
    <aside
      aria-label="How teammates see you"
      className="sticky top-4 hidden w-64 shrink-0 flex-col gap-4 rounded-panel border border-line bg-surface-sunken p-5 @4xl:mt-6 @4xl:flex"
    >
      <p className="text-sm font-medium text-fg-muted">How teammates see you</p>
      <div className="flex items-center gap-3">
        <Avatar
          name={name.trim() === '' ? '?' : name}
          src={avatarUrl}
          size="md"
          className="size-10"
        />
        <div className="flex min-w-0 flex-col">
          <p className="truncate font-medium text-fg">{name.trim() === '' ? 'Your name' : name}</p>
          <p className="truncate text-sm text-fg-muted">
            {jobTitle.trim() === '' ? 'No job title' : jobTitle}
          </p>
        </div>
      </div>
      <p className="flex items-center gap-1.5 border-t border-line pt-3 text-sm text-fg-muted">
        <ClockIcon aria-hidden weight="bold" className="size-4 shrink-0" />
        <span>
          Local time <span className="numeric text-fg">{time}</span>
        </span>
      </p>
    </aside>
  );
}

function DeleteDialog({
  open,
  email,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  email: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const { Button } = useBlockParts();
  const formId = useId();
  const [typed, setTyped] = useState('');
  const confirmed = profileDeleteConfirmed(email, typed);
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          onCancel();
          setTyped('');
        }
      }}
    >
      <DialogContent>
        <form
          id={formId}
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            if (!confirmed) return;
            onConfirm();
            setTyped('');
          }}
        >
          <DialogHeader>
            <DialogTitle>Delete your account?</DialogTitle>
            <DialogDescription>
              This cannot be undone. Type your email address to confirm.
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <Field>
              <FieldLabel>Your email address</FieldLabel>
              <Input
                autoFocus
                autoComplete="off"
                spellCheck={false}
                value={typed}
                placeholder={email}
                onChange={(event) => {
                  setTyped(event.target.value);
                }}
              />
            </Field>
          </DialogBody>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => {
                onCancel();
                setTyped('');
              }}
            >
              Cancel
            </Button>
            <Button type="submit" variant="danger" disabled={!confirmed}>
              Delete account
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
