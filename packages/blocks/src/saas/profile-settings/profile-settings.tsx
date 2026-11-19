import { CheckCircleIcon, ImageIcon, TrashIcon, WarningCircleIcon } from '@phosphor-icons/react';
import {
  Badge,
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
import { useId, useRef, useState, type ReactNode, type SyntheticEvent } from 'react';

import { useBlockParts } from '../../lib/block-parts';
import { BlockPanel } from '../../lib/block-panel';
import { resolveLocale } from '../../lib/finance';
import { FormMessage } from '../lib/auth';
import { Avatar } from '../lib/avatar';
import { hasErrors, plural } from '../lib/saas';
import {
  profileChanges,
  profileDeleteConfirmed,
  profileEmailChanged,
  profileErrors,
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
}: {
  title: ReactNode;
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-3 py-5 first:pt-0 @2xl:grid-cols-5 @2xl:gap-8">
      <div className="flex flex-col gap-0.5 @2xl:col-span-2">
        <h3 className="text-base font-medium">{title}</h3>
        {hint !== undefined && <p className="text-sm text-pretty text-fg-muted">{hint}</p>}
      </div>
      <div className="flex min-w-0 flex-col gap-4 @2xl:col-span-3">{children}</div>
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
  pending = false,
  error,
  now = new Date(),
  locale: requestedLocale,
  title = 'Profile',
  className,
}: ProfileSettingsProps) {
  const locale = resolveLocale(requestedLocale);
  const { Button } = useBlockParts();
  const fileRef = useRef<HTMLInputElement>(null);
  const [saved, setSaved] = useState(profile);
  const [draft, setDraft] = useState<ProfileValues>(profile);
  const [tried, setTried] = useState(false);
  const [deleting, setDeleting] = useState(false);
  // A new saved profile from the app restarts the form from it.
  if (profile !== saved) {
    setSaved(profile);
    setDraft(profile);
    setTried(false);
  }
  const changed = profileChanges(profile, draft);
  const dirty = changed.length > 0;
  const errors: ProfileErrors = tried ? profileErrors(draft) : {};
  const emailChanged = profileEmailChanged(profile, draft);
  const zones = [...new Set([profile.timeZone, ...(timeZones ?? DEFAULT_ZONES)])];
  const zoneItems = zones.map((zone) => ({ value: zone, label: timeZoneLabel(zone, now, locale) }));

  const set = (field: keyof ProfileValues, value: string) => {
    setDraft({ ...draft, [field]: value });
  };
  const submit = (event: SyntheticEvent) => {
    event.preventDefault();
    setTried(true);
    if (pending || !dirty || hasErrors(profileErrors(draft))) return;
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
      <form onSubmit={submit} noValidate className="flex flex-col">
        {error !== undefined && error !== null && error !== false && (
          <div className="pb-5">
            <FormMessage tone="error" title={error} />
          </div>
        )}
        <div className="flex flex-col divide-y divide-line">
          <Row title="Picture" hint="Square images work best, at least 256 pixels wide.">
            <div className="flex flex-wrap items-center gap-4">
              <Avatar name={profile.name} src={profile.avatarUrl} size="lg" />
              <div className="flex flex-wrap items-center gap-2 pointer-coarse:gap-5">
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
              <span className="flex items-center justify-between gap-3">
                <FieldLabel>Email address</FieldLabel>
                {!emailChanged &&
                  (profile.emailVerified === false ? (
                    <Badge tone="warning">
                      <WarningCircleIcon aria-hidden weight="bold" />
                      Not verified
                    </Badge>
                  ) : (
                    <Badge tone="positive">
                      <CheckCircleIcon aria-hidden weight="bold" />
                      Verified
                    </Badge>
                  ))}
              </span>
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
                <FieldDescription>
                  Confirm it from the link we sent.
                  {onResendVerification !== undefined && (
                    <>
                      {' '}
                      <button
                        type="button"
                        onClick={onResendVerification}
                        className="cursor-pointer rounded-badge font-medium text-fg underline decoration-line-strong underline-offset-4 outline-offset-2 hover:decoration-fg focus-visible:outline-2 focus-visible:outline-focus pointer-coarse:py-2"
                      >
                        Resend link
                      </button>
                    </>
                  )}
                </FieldDescription>
              ) : null}
            </Field>
          </Row>

          <Row title="Time zone" hint="Due dates, digests and quiet hours follow it.">
            <Field>
              <FieldLabel>Time zone</FieldLabel>
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

        {/* The save bar holds its place, so the danger zone below never jumps when it appears. */}
        <div className="sticky bottom-0 z-10 -mx-5 mt-2 flex min-h-(--rx-control-height-lg) flex-wrap items-center justify-between gap-3 border-t border-line bg-surface px-5 py-3">
          <p className="text-sm text-fg-muted" aria-live="polite">
            {dirty ? (
              <span className="font-medium text-fg">
                {plural(changed.length, 'unsaved change')}
              </span>
            ) : (
              'All changes saved'
            )}
          </p>
          {/* Hidden, not removed, while nothing changed: the bar keeps its height. */}
          <div
            className={cn(
              'flex items-center gap-2',
              !dirty && !pending && 'invisible @max-xl:hidden',
            )}
          >
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
        </div>
      </form>

      {onDeleteAccount !== undefined && (
        <div className="mt-6 flex flex-col gap-3 rounded-control border border-negative-strong/25 p-4 @xl:flex-row @xl:items-center @xl:justify-between">
          <div className="flex flex-col gap-0.5">
            <h3 className="font-medium text-negative-strong">Delete account</h3>
            <p className="text-sm text-fg-muted">
              Removes your profile and signs you out everywhere. Work you shared stays with the
              team.
            </p>
          </div>
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
            <Button variant="secondary" onClick={onCancel}>
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
