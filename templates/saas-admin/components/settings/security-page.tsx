'use client';

import {
  CheckCircleIcon,
  DesktopIcon,
  DeviceMobileIcon,
  DeviceTabletIcon,
  ProhibitIcon,
  XCircleIcon,
} from '@phosphor-icons/react';
import { BlockPanel, passwordChecks } from '@rectio/blocks';
import {
  Badge,
  Button,
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Field,
  FieldError,
  FieldLabel,
  Input,
  SwitchField,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  useToast,
} from '@rectio/ui';
import { useState, type SubmitEvent } from 'react';

import { SESSIONS, SIGN_INS, type Session } from '@/data/security';
import { NOW, formatDuration, formatShortDate, formatTime } from '@/data/workspace';
import { ErrorPanel, LoadingPanel, LoadingRegion } from '../states/state-views';
import { usePageState } from '../use-page-state';
import { SettingsFrame } from './settings-frame';

const DEVICE_ICONS = {
  desktop: DesktopIcon,
  phone: DeviceMobileIcon,
  tablet: DeviceTabletIcon,
} as const;

function seen(date: Date): string {
  const minutes = Math.round((NOW.getTime() - date.getTime()) / 60_000);
  if (minutes < 2) return 'Active now';
  if (minutes < 60 * 24) return `${formatDuration(minutes)} ago`;
  return `${formatShortDate(date)}, ${formatTime(date)}`;
}

function PasswordDialog() {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [tried, setTried] = useState(false);
  const checks = passwordChecks(next);
  const errors = {
    current: current === '' ? 'Enter your current password.' : null,
    next: checks.every((c) => c.met) ? null : 'The new password must meet every rule.',
  };

  const reset = () => {
    setCurrent('');
    setNext('');
    setTried(false);
  };

  const submit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTried(true);
    if (errors.current !== null || errors.next !== null) return;
    setOpen(false);
    reset();
    toast.add({
      type: 'success',
      title: 'Password changed',
      description: 'Other devices were signed out.',
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        setOpen(value);
        if (!value) reset();
      }}
    >
      <DialogTrigger render={<Button variant="secondary" />}>Change password</DialogTrigger>
      <DialogContent className="max-w-md">
        <form noValidate onSubmit={submit} className="flex min-h-0 flex-col">
          <DialogHeader>
            <DialogTitle>Change your password</DialogTitle>
            <DialogDescription>Every other device is signed out once it changes.</DialogDescription>
          </DialogHeader>
          <DialogBody className="flex flex-col gap-4">
            <Field invalid={tried && errors.current !== null}>
              <FieldLabel>Current password</FieldLabel>
              <Input
                type="password"
                value={current}
                onChange={(event) => {
                  setCurrent(event.target.value);
                }}
                autoComplete="current-password"
              />
              <FieldError>{tried ? errors.current : null}</FieldError>
            </Field>
            <Field invalid={tried && errors.next !== null}>
              <FieldLabel>New password</FieldLabel>
              <Input
                type="password"
                value={next}
                onChange={(event) => {
                  setNext(event.target.value);
                }}
                autoComplete="new-password"
              />
              <ul className="flex flex-col gap-1 text-sm" aria-label="Password rules">
                {checks.map((check) => (
                  <li
                    key={check.id}
                    className={`flex items-center gap-2 ${check.met ? 'text-positive-strong' : 'text-fg-muted'}`}
                  >
                    {check.met ? (
                      <CheckCircleIcon aria-hidden weight="fill" className="size-4" />
                    ) : (
                      <XCircleIcon aria-hidden className="size-4" />
                    )}
                    {check.label}
                    <span className="sr-only">{check.met ? ', met' : ', not met yet'}</span>
                  </li>
                ))}
              </ul>
              <FieldError>{tried ? errors.next : null}</FieldError>
            </Field>
          </DialogBody>
          <DialogFooter>
            <DialogClose render={<Button variant="ghost" type="button" />}>Cancel</DialogClose>
            <Button type="submit">Change password</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function SessionRow({ session, onSignOut }: { session: Session; onSignOut: () => void }) {
  const Icon = DEVICE_ICONS[session.kind];
  return (
    <li className="flex items-center gap-4 border-t border-line px-5 py-3 first:border-t-0">
      <span
        aria-hidden
        className="flex size-9 shrink-0 items-center justify-center rounded-control bg-surface-sunken text-fg-muted"
      >
        <Icon className="size-5" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="flex flex-wrap items-center gap-2 text-sm font-medium text-fg">
          {session.device}
          {session.current === true && <Badge tone="positive">This device</Badge>}
        </span>
        <span className="truncate text-sm text-fg-muted">
          {session.browser}, {session.location}
        </span>
        <span className="text-xs text-fg-subtle">
          {seen(session.lastActive)}
          <span className="max-sm:hidden">
            , IP <span className="numeric">{session.ip}</span>
          </span>
        </span>
      </span>
      {session.current !== true && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onSignOut}
          aria-label={`Sign out ${session.device}, ${session.location}`}
        >
          Sign out
        </Button>
      )}
    </li>
  );
}

export function SecurityPage() {
  const state = usePageState();
  const toast = useToast();
  const [sessions, setSessions] = useState<readonly Session[]>(SESSIONS);
  const [requireTwoFactor, setRequireTwoFactor] = useState(false);
  const [requireSso, setRequireSso] = useState(false);
  const others = sessions.filter((s) => s.current !== true).length;

  return (
    <SettingsFrame
      title="Security"
      description="Your password, two-factor and the devices signed in to your account"
    >
      {state === 'loading' ? (
        <LoadingRegion label="Loading security settings">
          <LoadingPanel kind="list" rows={3} />
          <LoadingPanel kind="list" rows={4} />
        </LoadingRegion>
      ) : state === 'error' ? (
        <ErrorPanel title="Security settings did not load" />
      ) : (
        <>
          <BlockPanel title="Sign-in" bodyClassName="gap-0 px-0 pb-0">
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 pb-4">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-fg">Password</span>
                <span className="text-sm text-fg-muted">Last changed on 14 July 2026</span>
              </div>
              <PasswordDialog />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-4">
              <div className="flex flex-col">
                <span className="flex items-center gap-2 text-sm font-medium text-fg">
                  Two-factor
                  <Badge tone="positive">On</Badge>
                </span>
                <span className="text-sm text-fg-muted">
                  Authenticator app since March 2026, 8 of 10 backup codes left
                </span>
              </div>
              <Button
                variant="secondary"
                onClick={() => {
                  toast.add({
                    title: 'Backup codes',
                    description: 'Shown once you confirm your password.',
                  });
                }}
              >
                View backup codes
              </Button>
            </div>
          </BlockPanel>
          <BlockPanel
            title="Workspace policy"
            description="Applies to every member. Only owners can change it."
            bodyClassName="gap-5"
          >
            <SwitchField
              label="Require two-factor for every member"
              description="Members without it are asked to set it up at their next sign-in. 1 member has not yet."
              checked={requireTwoFactor}
              onCheckedChange={(checked) => {
                setRequireTwoFactor(checked);
                if (checked) toast.add({ title: 'Two-factor is now required' });
              }}
            />
            <SwitchField
              label="Require Google Workspace sign-in"
              description="Password sign-in stops for everyone with a copperline.app address."
              checked={requireSso}
              onCheckedChange={setRequireSso}
            />
          </BlockPanel>
          <BlockPanel
            title="Devices"
            description={`Signed in on ${String(sessions.length)} devices`}
            bodyClassName="px-0 pb-2"
            actions={
              others > 0 && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setSessions((list) => list.filter((s) => s.current === true));
                    toast.add({ title: `Signed out of ${String(others)} other devices` });
                  }}
                >
                  <ProhibitIcon aria-hidden weight="bold" className="size-3.5" />
                  Sign out the others
                </Button>
              )
            }
          >
            <ul className="flex flex-col">
              {sessions.map((session) => (
                <SessionRow
                  key={session.id}
                  session={session}
                  onSignOut={() => {
                    setSessions((list) => list.filter((s) => s.id !== session.id));
                    toast.add({ title: `${session.device} signed out` });
                  }}
                />
              ))}
            </ul>
          </BlockPanel>
          <BlockPanel title="Recent sign-ins" bodyClassName="px-0 pb-0">
            <div className="overflow-x-auto">
              <Table>
                <TableCaption className="sr-only">Recent sign-ins to your account</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead className="ps-5">When</TableHead>
                    <TableHead className="max-sm:hidden">Method</TableHead>
                    <TableHead>Where</TableHead>
                    <TableHead align="end" className="pe-5">
                      Result
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {SIGN_INS.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="ps-5 whitespace-nowrap">
                        {formatShortDate(s.at)}, {formatTime(s.at)}
                      </TableCell>
                      <TableCell className="text-fg-muted max-sm:hidden">{s.method}</TableCell>
                      <TableCell>{s.location}</TableCell>
                      <TableCell align="end" className="pe-5">
                        <Badge tone={s.result === 'ok' ? 'positive' : 'negative'}>
                          {s.result === 'ok' ? 'Signed in' : 'Blocked'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </BlockPanel>
        </>
      )}
    </SettingsFrame>
  );
}
